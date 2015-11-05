/**
 * Created by xTear on 17.10.15.
 */

var req = require("request");
var cheerio =require("cheerio");
var async = require("async");
var parse = require("url");

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
            var image_url = $("div.image img").attr("src");
            var content = $("div.text .center").first().html().replace("<b>", "").replace("</b>", "").replace("<br>", "\r\n").replace("<br />", "\r\n");

            var dl_link = "";

            $("div.news a").each(function(){
                if( $(this).attr("href").toLowerCase().indexOf("nitroflare.com") > -1) {
                    dl_link = $(this).attr("href");
                    return false;
                }
            });

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
        var max_pages = 5;
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
            if(err)
                return console.log("Error Occoured");

            for(var i = 0; i < data.urls.length; i++) {
                newRls.push(data.urls[i]);
            }
            if(!data.found) {
                console.log("GEFINDET NICHT");
                data.iter++;
                return grabRls(data.url, data.iter++, rlsName, callbackTest);
            }
            return cb(false, newRls)
        };
        grabRls(url, start, rlsName, callbackTest);

    }
};