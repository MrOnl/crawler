/**
 * Created by xTear on 27.10.15.
 */
/**
 * Created by xTear on 14.10.15.
 */
var req = require('request');
var crypto = require("crypto");
var PATH_SPLITTER = "/";
if(process.platform == "win32") {
    PATH_SPLITTER = "\\";
}
module.exports = {
    api_url: "http://api.jdownloader.org",
    rid_counter: "",
    server_domain: "server",
    apiVer: "1.0.18062014",
    device_domain: "device",
    serverEncryptionToken: "",
    deviceEncryptionToken: "",
    init: function(email, password, callback) {
        this.rid_counter =  Math.floor(Date.now() / 1000);
        if(email.length > 0 && password.length > 0) {
            this.doConnect(email, password, function(err, data){
                if(err)
                    return callback(true, data);

                return callback(null, data);
            });
        } else {
            return callback(true, "No Userdata");
        }

    },
    doConnect: function(email, password, callback) {
        var self = this;
        this.loginSecret = this.createSecret(email, password, this.server_domain);
        this.deviceSecret = this.createSecret(email, password, this.device_domain);
        var query = "/my/connect?email="+encodeURI( email )+"&appkey="+encodeURI( this.appkey );
        this.callServer(query, this.loginSecret, function(err, data){
            if(err)
                return callback(true, data);
            var content_json = JSON.parse(data);
            self.sessiontoken = content_json.sessiontoken;
            self.regaintoken = content_json.regaintoken;
            self.serverEncryptionToken = self.updateEncryptionToken( self.loginSecret, self.sessiontoken );
            self.deviceEncryptionToken = self.updateEncryptionToken( self.deviceSecret, self.sessiontoken );
            return callback(null, true);
        });
    },
    updateEncryptionToken: function(oldToken, updateToken) {
        var tkn = oldToken+hex2a(updateToken);
        return crypto.createHash("sha256").update(tkn).digest("binary");
    },
    callServer: function(query, key, callback) {
        var rid = this.getUniqueRid();
        var self = this;
        if( query.indexOf("?") > -1)
            query += '&';
        else
            query += '?';

        query += "rid="+rid;
        var signature = this.sign(key, query);
        query += "&signature="+signature;
        var postUrl = this.api_url+query;
        req.get({
            url: postUrl,
            headers: {
                "Content-Type" : "application/aesjson-jd; charset=utf-8"
            }
        }, function(err, rsp, body){
            if(err)
                return callback(false, "Request error");
            var body = self.decrypt(body, key);
            var content_json = JSON.parse(body);
            if(content_json.rid != self.rid_counter) {
                return callback(true, "RID_MISMATCH");
            }
            return callback(null, body);
        });

    },
    createSecret: function(username, password, domain) {
        return crypto.createHash("sha256").update(username.toLowerCase() + password + domain.toLowerCase()).digest("binary");
    },
    getUniqueRid: function() {
        this.rid_counter++;
        return this.rid_counter;
    },
    sign: function(key, data) {
        return crypto.createHmac("sha256", key).update(data).digest("hex");
    },
    /*
     crypt: function(data, key) {
     var iv = key.substr(0, key.length/2);
     var key = key.substr(key.length/2);
     var cipher = crypto.createCipheriv("aes-128-cbc", key, iv);
     var crypted = cipher.update(data, "utf8");
     return crypted;
     },
     */
    crypt: function(plaintext, key2) {
        var plaintext = JSON.stringify(plaintext);
        var crypto = require('crypto');
        var key = key2.substr(key2.length / 2)
        var iv = key2.substr(0, key2.length / 2)
        var cipher = crypto.createCipheriv('aes-128-cbc', key, iv)

        var encryptedPassword = cipher.update(plaintext, 'utf8', 'base64');
        encryptedPassword += cipher.final('base64')
        return encryptedPassword;
    },
    decrypt: function(ciphertext, key) {
        try {
            var iv = key.substr(0, key.length / 2);
            var key = key.substr(key.length / 2);
            var decipher = crypto.createDecipheriv('aes-128-cbc', key, iv);
            decipher.setAutoPadding(false);
            var plaintext = decipher.update(ciphertext, 'base64', 'utf8');
            console.log(plaintext.toString('utf8').trim())
            return plaintext.toString('utf8').trim();
        } catch(e) {
            console.log(ciphertext);
            return ciphertext;
        }

    },
    addLinks: function(device, links, pkgName, destFolder,callback) {
        var _links = links.join(",");
        var params = {
            "priority" : "DEFAULT",
            "links" : _links,
            "autostart" : true,
            "packageName" : pkgName,
            "destinationFolder": destFolder
        };
        this.callAction(device, "/linkgrabberv2/addLinks", params, function(err, data){
            if(err)
                return callback(true, data);

            return callback(null, data);
        });

    },
    callAction: function(device, action, params, callback) {
        var self = this;
        if( typeof device == "undefined")
            return callback(true, "no device");

        var query = "/t_"+encodeURI(this.sessiontoken)+"_"+encodeURI(device)+action;
        var json_data = {
            url: action,
            rid: this.getUniqueRid(),
            apiVer: "1"
        };
        if(params != "") {
            json_data = {
                url: action,
                params: [],
                rid: this.getUniqueRid(),
                apiVer: Math.floor(this.apiVer,0)
            };
            json_data.params.push(JSON.stringify(params));

        }
        var keyToken = self.deviceEncryptionToken;
        json_data = this.crypt(json_data,keyToken);
        var postUrl = self.api_url+query;
        req.post({
            url: postUrl,
            headers: {
                "Content-Type" : "application/aesjson-jd; charset=utf-8"
            },
            form: json_data
        }, function(err, rsp, body){
            if(err)
                return callback(false, err);
            try {
                var body = self.decrypt(body, keyToken);
                var content_json = JSON.parse(body);
            } catch(a) {
                try {
                    content_json = JSON.parse(body);
                }catch(e) {
                    return body;
                }
            }
            console.log(content_json);
           // if(content_json.rid != self.rid_counter) {
           //     return callback(true, "RID_MISMATCH");
           // }
            return callback(null, body);
        });
    }



};
function hex2a(hexx) {
    var hex = hexx.toString();//force conversion
    var str = '';
    for (var i = 0; i < hex.length; i += 2)
        str += String.fromCharCode(parseInt(hex.substr(i, 2), 16));
    return str;
}
