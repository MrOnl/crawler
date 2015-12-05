/**
 * Created by xTear on 17.10.15.
 */

var req = require("request");
var cheerio =require("cheerio");
var async = require("async");
var parse = require("url");
var Entities = require('html-entities').AllHtmlEntities;
var entities = new Entities();

function cc(str) {
    var _l = str.length;
    var newStr = "";
    for(var i=0; i < _l; i++) {
        var ascii = str.charCodeAt(i);
            switch(ascii) {
                case 1072:
                    ascii = 97;
                    break;
                case 1040:
                    ascii = 65;
                    break;
                case 1042:
                    ascii = 66;
                    break;
                case 1075:
                    ascii = 114;
                    break;
                case 1045:
                    ascii = 69;
                    break;
                case 1077:
                    ascii = 101;
                    break;
                case 1047:
                    ascii = 51;
                    break;
                case 1050:
                    ascii = 75;
                    break;
                case 1052:
                    ascii = 77;
                    break;
                case 1053:
                    ascii = 72;
                    break;
                case 1054:
                    ascii = 79;
                    break;
                case 1086:
                    ascii = 111;
                    break;
                case 1056:
                    ascii = 80;
                    break;
                case 1088:
                    ascii = 112;
                    break;
                case 1057:
                    ascii = 67;
                    break;
                case 1089:
                    ascii = 99;
                    break;
                case 1058:
                    ascii = 84;
                    break;
                case 1059:
                    ascii = 121;
                    break;
                case 1091:
                    ascii = 89;
                    break;
                case 1061:
                    ascii = 88;
                    break;
                case 1093:
                    ascii = 120;
                    break;
        }
        newStr += String.fromCharCode(ascii);
    }
    return newStr;
}

module.exports = {
    getReleases: function($url,cb) {
        req($url, function(err, rsp, body){
            if(err)
                return cb(true, err);

            if(rsp.statusCode != 200)
                return cb(true, "error");

            var $ = cheerio.load(body);

            var urls = [];

            $("div.title a").each(function(){
                urls.push( "http://avxhome.se/"+$(this).attr("href") );
            });
            cb(null,urls);
        });
    },
    getReleaseData: function($url, cb) {
        req($url, function(err, rsp, bdy){
            if(err)
                return cb(true, err);

            if(rsp.statusCode != 200)
                return cb(true, "Req not valid");

            var $ = cheerio.load(bdy);
            var rlsTitle = $(".title h1").first().text();
            rlsTitle = cc(rlsTitle);
            var image_url = $("div.image img").attr("src");
            var content = $("div.text .center").first().html().replace(/<b>/g, "").replace(/<\/b>/g, "").replace(/<br>/g, "\r\n").replace(/<br \/>/g, "\r\n");
            var c = cheerio.load("<body>"+content+"</body>");
            var content = (c("body").text().trim());
            var dl_link = "";

            $("div.news a").each(function(){
                if( $(this).attr("href").toLowerCase().indexOf("nitroflare.com") > -1) {
                    dl_link = $(this).attr("href");
                    return false;
                }
            });
            var _str = content.split("|");
            delete _str[_str.length-1];
            content = _str.join("|");
            content = entities.decode(content);
            content = cc(content);
            return cb(null, {
                image: image_url,
                text: content,
                download: dl_link,
                rlsName: rlsTitle,
                rlsUrl: parse.parse($url).path
            })

        });
    },
    firstGrab: function(url, callback){
        if(url.indexOf("pages/") > -1) {
            var sUrl = url.split("pages/");
            var url = sUrl[0];
        }
        if(url.charAt( url.length -1 ) == "/" ) {
            var url = url.substring(0, url.length -1);
        }
        var url = url + "/pages/";
        var start = 1;
        var max_pages = 2;
        var urlArr = [];
        for(start; start <= max_pages; start++) {
            urlArr.push(url+start);
        }
        async.map(urlArr, this.getReleases, function(err, data){
            if(err)
                return callback(true, "Error occured");
            var callbackArr = [];
            for(var i=0; i < data.length; i++) {
                var zwErg = data[i];
                for(var x = 0; x < zwErg.length; x++)
                    callbackArr.push(zwErg[x]);
            }
            callback(null,callbackArr)
        });
    },
    grabTill : function(url, rlsName, cb) {
        console.log("== GRAB TILL ==");
        console.log(url);
        console.log(rlsName);
        console.log("== GRAB TILL END ==");
        var uObj = parse.parse(rlsName);
        var _rls = uObj.path;
        if(_rls.charAt(0) == "/")
            _rls = _rls.substring(1);
        var rlsName = _rls;
        var self = this;
        if(url.indexOf("pages/") > -1) {
            var sUrl = url.split("pages/");
            var url = sUrl[0];
        }
        if(url.charAt( url.length -1 ) == "/" ) {
            var url = url.substring(0, url.length -1);
        }
        var url = url + "/pages/";
        var start = 1;

        var newRls = [];

        function grabRls(url,counter, rlsData, callb) {
            console.log(url+counter);
            if(counter > 5)
                callb(true, 55);

            req(url+counter, function(err, rsp, body){
                if(err)
                    return cb(true, err);

                if(rsp.statusCode != 200)
                    return cb(true, "error");

                var $ = cheerio.load(body);

                var urls = [];
                var found = false;
                $("div.title a").each(function(){
                    if($(this).attr("href").indexOf(rlsData) <= -1) {
                        urls.push("http://avxhome.se" + $(this).attr("href"));
                    } else {
                        found = true;
                        return false;
                    }
                });
                callb(null,{
                    length: $("div.title a").length,
                    urls: urls,
                    found: found,
                    iter: counter,
                    url: url
                });
            });
        }
        var callbackTest = function(err, data){
            if(err && data == "55")
                data.found = true;

            if(err && data != "55")
                return cb(true, "Error occured");

            for(var i = 0; i < data.urls.length; i++) {
                newRls.push(data.urls[i]);
            }
            if(newRls.length <= 0) {
                if (!data.found) {
                    console.log("GEFINDET NICHT");
                    data.iter++;
                    return grabRls(data.url, data.iter++, rlsName, callbackTest);
                }
            }
            return cb(false, newRls)
        };
        grabRls(url, start, rlsName, callbackTest);

    }
};