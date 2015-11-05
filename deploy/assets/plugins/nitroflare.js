/**
 * Created by xTear on 17.10.15.
 */
var req = require("request");
var cheerio = require("cheerio");
var fs = require("fs");
var jar = req.jar();
module.exports = {
    setJar: function(oldJar) {
        jar = oldJar;
    },
    setUsername : function(username) {
        this.username = username;
    },
    setPass: function(pass) {
        this.pass = pass;
    },
    setCookie: function(cookies) {
        var cookies = req.cookie(cookies);
        jar.setCookie(cookies, "https://nitroflare.com/");
    },
    login: function(callback) {
        var self = this;
        req.get({
            jar: jar,
            url: "https://nitroflare.com/login",
            headers: {
                "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
                "Accept-Encoding": "gzip,deflate,sdch",
                "Accept-Language": "de-DE,de;q=0.8,en-US;q=0.6,en;q=0.4,nl;q=0.2",
                "Cache-Control": "max-age=0",
                "Connection": "keep-alive",
                "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_11_1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/46.0.2490.71 Safari/537.36"
            },
            gzip: true
        }, function(err, resp, body){
            if(err)
                return callback(true, err);
            console.log( resp.req.path );
            if(resp.req.path.indexOf("member") > -1) {
                return callback(null, "Sind bereits eingeloggt!");
            }
            var $ = cheerio.load(body);

            var token = $('input[name="token"]').val();
            console.log({
                email: self.username,
                password: self.pass,
                token: token,
                login: ""
            });
            req.post({
                jar: jar,
                form: {
                    email: self.username,
                    password: self.pass,
                    token: token,
                    login: ""
                },
                gzip: true,
                headers: {
                    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
                    "Accept-Encoding": "gzip,deflate,sdch",
                    "Accept-Language": "de-DE,de;q=0.8,en-US;q=0.6,en;q=0.4,nl;q=0.2",
                    "Cache-Control": "max-age=0",
                    "Connection": "keep-alive",
                    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_11_1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/46.0.2490.71 Safari/537.36"
                },
                followAllRedirects: true,
                url: "https://nitroflare.com/login"
            }, function(err, resp, body){
                console.log(jar);
                if(err)
                    return callback(true, err);
                //get errors
                var $ = cheerio.load(body);

                if($("ul.errors").length > 0) {
                    return callback(true,$("ul.errors").text().trim());
                }
                return callback(null, jar);
            })
        })
    },
    downloadFile: function(url, dir, callback, setJar) {
        req.get({
            url: url,
            jar: jar,
            gzip:true,
            followAllRedirects: true,
            headers: {
                "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
                "Accept-Encoding": "gzip,deflate,sdch",
                "Accept-Language": "de-DE,de;q=0.8,en-US;q=0.6,en;q=0.4,nl;q=0.2",
                "Cache-Control": "max-age=0",
                "Connection": "keep-alive",
                "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_11_1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/46.0.2490.71 Safari/537.36"
            }
        }, function(err, rsp, bdy) {
            if(err)
                return callback(true, err);
            var $ = cheerio.load(bdy);
            console.log($("a.login").attr("href")+" => "+ url);
           if(typeof $("a#download").attr("href") == "undefined")
                return callback(true, "No Download");

            var downloadUrl = $("a#download").attr("href");

            var fileNameParts = downloadUrl.split("/");
            var fileName = fileNameParts[fileNameParts.length -1];

            var absolute_path = dir+"/"+fileName;

            req.get({
                url: downloadUrl,
                jar: jar,
                gzip:true,
                followAllRedirects: true,
                headers: {
                    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
                    "Accept-Encoding": "gzip,deflate,sdch",
                    "Accept-Language": "de-DE,de;q=0.8,en-US;q=0.6,en;q=0.4,nl;q=0.2",
                    "Cache-Control": "max-age=0",
                    "Connection": "keep-alive",
                    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_11_1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/46.0.2490.71 Safari/537.36"
                }
            }, function(err, body, resp){
                setJar("nfJar",jar);
               if(err)
                return callback(true, "Error!");

                return callback(null, {
                    path: absolute_path,
                    fileName : fileName,
                    status: "true"
                });

            }).pipe( fs.createWriteStream(absolute_path) );
        });
    }

};

