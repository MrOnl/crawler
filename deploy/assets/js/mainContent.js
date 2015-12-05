function setItem(name, saveVar) {
    var item = saveVar;
    if (typeof saveVar == "object" || typeof saveVar == "array") {
        item = JSON.stringify(saveVar);
    }
    return localStorage[name] = item;

}

function getItem(name) {
    if (typeof localStorage[name] != "undefined") {
        try {
            return JSON.parse(localStorage[name]);
        } catch (e) {
            return localStorage[name];
        }
    }
    return false;
}

function toMS(min) {
    return ((min * 60) * 1000);
}

function addNewEntry(url) {
    $("#grabPath").append("<option>" + url + "</option>");
}

function clearLog() {
    $("#log").find("option").remove();
}

function writeLog($msg) {
    $("#log").append("<option>" + $msg + "</option>");
}

function chooseFile(name, callback) {
    var chooser = $(name);
    chooser.change(function() {
        callback($(this).val());
    });
    chooser.trigger('click');
}

function removeFromArray(arr, val) {
    return _.without(arr, val);
}
var fs = require("fs");
var mv = require("mv");
var uuid = require("node-uuid");
var sanitize = require("sanitize-filename");
var chokidar = require("chokidar");
var rimraf = require("rimraf");
var _ = require("underscore");
var async = require("async");
var urlMod = require("url");
var resourceDirectory = process.cwd();
var avg = require(resourceDirectory + "/assets/plugins/avxhome.js");
var jDownloader = require(resourceDirectory + "/assets/plugins/jDownloader.js");
var req = require("request");
var gui = require('nw.gui');
var jd_dl_path = "";
var doneRlsDir = "";
var timerFunc = "";
var toDoRls = {};
var rar = require(resourceDirectory + "/assets/plugins/rarFolder.js");
var PATH_SPLITTER = "/";
var lastRls = {};
var min = "";
var rlsList = [];
var rlsListUrl = [];
var watcher = "";

if (process.platform == "win32") {
    PATH_SPLITTER = "\\";
    var exec = require('child_process').exec;
}
/* MAIN */
var word = "godmode";
var input = "";


// reset input when pressing esc

$("document").ready(function() {
    $("#ImageInTxt:checkbox").change(function(){
        var checked = $(this).prop("checked");
        setItem("ImageInTxt", checked);
    })
    document.body.addEventListener('keypress',function(ev){
        input += String.fromCharCode(ev.keyCode);
        if(input == word){
            gui.Window.get().showDevTools();
            input = "";
        }
    });
    document.body.addEventListener('keyup',function(ev){
        if(ev.keyCode == 27) input = "";
    });
    $("#btnLog").click(function() {
        clearLog();
    });
    //MINUTES
    if (getItem("searchInterval")) {
        $("#timeInterval").val(getItem("searchInterval"));
        min = toMS(getItem("searchInterval"));
    }
    if( getItem("rlsList")) {
        rlsList = getItem("rlsList");
    }
    if( getItem("rlsListUrl")) {
        rlsListUrl = getItem("rlsListUrl");
    }
    //GET JD
    if (getItem("jDownloaderCred")) {
        var jdCred = getItem("jDownloaderCred");
        if (jdCred) {
            $("#jd_user").val(jdCred.user);
            $("#jd_pw").val(jdCred.pass);
            $("#jd_device_id").val(jdCred.dev_id);
            jDownloader.init(jdCred.user, jdCred.pass, function(err, data) {
                if (err)
                    return alert(data);

                return writeLog("Jdownloader successful login!");
            });
        }
    }
    if(getItem("ImageInTxt")) {
        $("#ImageInTxt").prop("checked", getItem("ImageInTxt"));
    }
    if (getItem("lastRelease")) {
        lastRls = getItem("lastRelease");
    }
    //GET RELEASE.txt-DIR
    if (getItem("tmpDir")) {
        $("#fakeTmpDir").val(getItem("tmpDir"));
        tmpDir = getItem("tmpDir");
    }
    //GET JDOWNLOADER_WORKING_DIR
    if (getItem("jd_dl_path")) {
        $("#fakeJDDir").val(getItem("jd_dl_path"));
        jd_dl_path = $("#fakeJDDir").val();
        watchFile(jd_dl_path, watcherCB);
    }
    //GET WORKING-DIR
    if (getItem("done_path")) {
        $("#fakeDoneRls").val(getItem("done_path"));
        doneRlsDir = $("#fakeDoneRls").val();
    }
    //GET GRAB-PAGES
    if (getItem("GRAB_PAGES")) {
        var entries = getItem("GRAB_PAGES");
        var entryLength = entries.length;
        for (var i = 0; i < entryLength; i++)
            addNewEntry(entries[i]);
    }

    //SET GRAB-PAGES
    /* OPEN AVGRUND POPUP */
    $("#btnNew").click(function() {
        Avgrund.show("#default-popup");
    });

    $("#modalSave").click(function() {
        if ($("#newGrabEntry").val().length > 0) {
            var newEntry = $("#newGrabEntry").val().replace(/pages.*/, "");
            var check = urlMod.parse(newEntry);
            if (check.hostname != "avxhome.se") {
                Avgrund.hide();
                $("#newGrabEntry").val("");
                return alert("Falsche URL!");
            }
            if (newEntry.substr(newEntry.length - 4) == "html") {
                Avgrund.hide();
                $("#newGrabEntry").val("");
                return alert("Keine Categorie sondern Rls!");
            }
            var entriesArr = getItem("GRAB_PAGES");
            if (jQuery.inArray(newEntry, entriesArr) > -1) {
                Avgrund.hide();
                $("#newGrabEntry").val("");
                return alert("eintrag schon vorhanden");
            }
            if (!entriesArr)
                entriesArr = [];
            entriesArr.push(newEntry);
            setItem("GRAB_PAGES", entriesArr);
            addNewEntry(newEntry);
            Avgrund.hide();
            $("#newGrabEntry").val("");
            firstRun(newEntry);
        }
    });


    //SAVE RELEASE.txt-DIR
    $("#jdownloader_dir").click(function() {
        chooseFile("#jdDLPath", function(path) {
            $("#fakeJDDir").val(path);
            setItem("jd_dl_path", path);
            jd_dl_path = $("#fakeJDDir").val();
            watchFile(jd_dl_path, watcherCB);
        });
    });
    //SAVE RELEASE.txt-DIR
    $("#doneRls").click(function() {
        chooseFile("#doneRlsDir", function(path) {
            $("#fakeDoneRls").val(path);
            setItem("done_path", path);
            doneRlsDir = $("#fakeDoneRls").val();

        });
    });

    //SAVE RELEASE.txt-DIR
    $("#tmpDirBtn").click(function() {
        chooseFile("#tempPath", function(path) {
            $("#fakeTmpDir").val(path);
            setItem("tmpDir", path);
            tmpDir = path;
        });
    });
    //SAVE NF
    $("#save_jdownloader").click(function() {
        var jdUser = $("#jd_user").val();
        var jdPass = $("#jd_pw").val();
        var jdDeviceId = $("#jd_device_id").val();
        if (jdUser.length > 0 && jdPass.length > 0 && jdDeviceId.length > 0) {
            jDownloader.init(jdUser, jdPass, function(err, data) {
                if (err)
                    return alert(data);

                setItem("jDownloaderCred", {
                    user: jdUser,
                    pass: jdPass,
                    dev_id: jdDeviceId
                });
                return writeLog("jDownloader Login successful")
            });

        }
    });
    // SAVE MINUTES
    $("#saveInterval").click(function() {
        var timeInterval = $("#timeInterval").val();
        if(timeInterval < 30) {
            return writeLog("Mind 30 minuten!");
        }
        if (timeInterval.length > 0)
            setItem("searchInterval", timeInterval);
        min = toMS(timeInterval);
    });

    //DELETE ENTRIES
    $("#btnDelete").click(function() {
        var op = $("#grabPath").find("option:selected");
        if(typeof lastRls[op.text()] != "undefined")
            delete lastRls[op.text()];

        op.remove();
        var newEntries = [];
        $("#grabPath").find("option").each(function() {
            newEntries.push($(this).val());
        });
        setItem("GRAB_PAGES", newEntries);
    });


    /* MAIN CONTEXT */

    $("#btnStart").click(function() {
        writeLog("Start..");
        doLoop();
        timerFunc = setInterval(function() {
            writeLog("Interval..");
            doLoop();
        }, (min));
    });
    $("#btnStop").click(function() {
        writeLog("Stop..");
        if (typeof timerFunc == "object") {
            clearInterval(timerFunc);
        }
    });
});
function setRlsList($rls, dl) {
    rlsList.push($rls);
    rlsListUrl.push(dl);
    setItem("rlsList", rlsList);
    setItem("rlsListUrl", rlsListUrl);
}
function doLoop() {
    var lEntries = getItem("GRAB_PAGES");
    var lEntriesLength = lEntries.length;
    lastRls = getItem("lastRelease");
    var jdUser = $("#jd_user").val();
    var jdPass = $("#jd_pw").val();
    var jdDeviceId = $("#jd_device_id").val();
    if (jdUser.length > 0 && jdPass.length > 0 && jdDeviceId.length > 0) {
        jDownloader.init(jdUser, jdPass, function(err, data) {
            if (err)
                return writeLog("JDownloader fehler!");


            for (var c = 0; c < lEntriesLength; c++) {
                console.log(typeof lastRls[lEntries[c]]);
                if (typeof lastRls[lEntries[c]] == "undefined" || lEntries[c] == "undefined")
                    continue;

                var loop_lastEntryUrl = lastRls[lEntries[c]];
                var loop_entryUrl = lEntries[c];
                if (typeof toDoRls == "undefined" || typeof toDoRls[loop_entryUrl] == "undefined") {
                    toDoRls[loop_entryUrl] = [];
                }
                grabLoop(loop_entryUrl, loop_lastEntryUrl);
            }
        });

    }

}
function grabLoop(loop_entryUrl, loop_lastEntryUrl) {
    avg.grabTill(loop_entryUrl, loop_lastEntryUrl, function (err, data) {
        console.log("SUCHE NACH " + loop_entryUrl);
        if (err)
            return writeLog(loop_entryUrl + "Nichts gefunden");

        var newLastRls = data[0];
        for (var x = 0; x < data.length; x++) {
            avg.getReleaseData(data[x], function (err, data) {
                if (err) {
                    return false;it
                }
                if (typeof data == "undefined") {
                    return false;
                }
                if (typeof data.rlsName == "undefined")
                    return false;

                lastRls[loop_entryUrl] = newLastRls;
                setItem("lastRelease", lastRls);
                //Create the directory


                var _rlsName = escapeRls(data.rlsName);

                _rlsName = sanitize(_rlsName);
                var _rlsNameLength = _rlsName.length;
                if (_rlsName.charAt(0) == " " || _rlsName.charAt(0) == ".") {
                    _rlsName = _rlsName.substring(1);
                }
                if (_rlsName.charAt(_rlsNameLength - 1) == " " || _rlsName.charAt(_rlsNameLength - 1) == ".") {
                    _rlsName = _rlsName.slice(0, -1);
                }
                if (_.contains(rlsList, _rlsName) || _.contains(rlsListUrl, data.download)) {
                    return;
                }
                setRlsList(_rlsName + "|||" + data.download);
                var _tmpDir = tmpDir + PATH_SPLITTER + _rlsName;
                data.rlsName = _rlsName;

                fs.mkdir(_tmpDir, "0777", function (err) {
                    if (err)
                        return writeLog(data.rlsName + " | " + err);
                    data.text = escapeText(data.text);
                    if($("#ImageInTxt").prop("checked")) {
                        data.text += "\r\n\r\n"+data.image;
                    }
                    fs.writeFile(_tmpDir + PATH_SPLITTER + "info.txt", data.text,"ascii", function (err) {
                        if (err)
                            return writeLog("Konnte nicht geschrieben werden: " + data.rlsName);
                        var ext = data.image.split(".");
                        var fileExt = ext[ext.length - 1];
                        if (fileExt.toLowerCase() == "jpeg")
                            fileExt = "jpg";
                        req.get(data.image, function (err, rsp, bdy) {
                            if (err)
                                writeLog("Kein Cover gefunden " + data.rlsName);
                            var pkgName = generateUniqueId();
                            toDoRls[loop_entryUrl].push(pkgName + "|||" + _tmpDir);
                            jDownloader.addLinks($("#jd_device_id").val(), [data.download], pkgName, jd_dl_path + PATH_SPLITTER + pkgName, function (err, data) {
                                if (err)
                                    return writeLog("Could not add to jDownloader " + data.rlsName);

                            });
                        }).pipe(fs.createWriteStream(_tmpDir + PATH_SPLITTER + makeid() + "." + fileExt));
                    })

                });
            });
        }
    });
}
function watchFile(dir, callback) {

    if (typeof watcher != "undefined") {
        watcher.close();
    }
    var watcher = chokidar.watch(dir, {
        ignored: /^\./,
        persistent: true,
        ignoreInitial: true,
        depth: 1,
        awaitWriteFinish: true,
        ignorePermissionErrors: true
    });
    watcher
        .on('add', function(path, stats) {
            if (path.indexOf(".rar") > -1 && path.indexOf(".part") == "-1") {
                var sp = path.split(PATH_SPLITTER);
                var pkgName = sp[sp.length - 2];
                var fileName = sp[sp.length - 1];
                callback({
                    pkgName: pkgName,
                    fileName: fileName,
                    fullPath: path,
                    rar: true
                }, watcher);

            } else {
                if ((path.indexOf(".part") == "-1") || path.indexOf(".") == "-1") {
                    var sp = path.split(PATH_SPLITTER);
                    var pkgName = sp[sp.length - 2];
                    var fileName = sp[sp.length - 1];
                    if (pkgName.split("-").length != 5) {
                        pkgName = sp[sp.length - 3];
                        fileName = sp[sp.length - 2];
                    }
                    callback({
                        pkgName: pkgName,
                        fileName: fileName,
                        fullPath: path,
                        rar: false
                    }, watcher);
                }
            }
        });

}

function search(obj, searchVal, cb) {
    async.forEach(Object.keys(obj), function(key, callback) {
        var obKey = key;
        var arr = obj[key];
        var arrLength = obj[key].length;
        for (var i = 0; i < arrLength; i++) {
            var _t = arr[i].split("|||");
            if (_t[0] == searchVal) {
                return callback({
                    key: obKey,
                    pkgName: _t[0],
                    tmp: _t[1]
                });
            }
        }
        return callback(false);
    }, function(data) {
        if (data != null) {
            return cb(data);
        }
        return cb(false)
    })

}

function watcherCB(data, watcher) {
    var pkgName = data.pkgName;
    var fullPath = data.fullPath;
    var isRar = data.rar;
    watcher.unwatch(jd_dl_path+PATH_SPLITTER+pkgName);
    search(toDoRls, pkgName, function(data) {
        if (!data)
            return;

        var pkg = data.pkgName;
        var tmpDir = data.tmp;
        var _msgTmp = data.tmp;
        var key = data.key;

        toDoRls[key] = removeFromArray(toDoRls[key], pkg + "|||" + tmpDir);

        if (isRar) {
            rar.extract("", fullPath, tmpDir, function(err, dir) {
                if (err) {
                    console.log(err);
                    console.log(dir);
                    return writeLog(fullPath + " Konnte nicht entpackt werden");
                }
                exec('move "' + tmpDir + '" "' + doneRlsDir + '"', function(err, stdout, stderr) {
                    if (err) {
                        return writeLog("Konnte nicht verschieben");
                    }
                    rimraf(jd_dl_path+PATH_SPLITTER+pkgName, function(err){
                        if(err)
                            return writeLog("Datei konnte nicht gelöscht werden");
                        return writeLog(_msgTmp + " Release Fertig");

                    });
                    /*   exec("rmdir /s /q \""++"\"", function(err, stdout, stderr){
                     if(err) {
                     return writeLog("Konnte nicht gelöscht werden: "+pkgName);
                     } */

                    //                    });
                });
            });
        } else {
            try {
                fs.exists(fullPath, function (exists) {
                    if (!exists) {
                        return console.log("FILE NOT EXISTS " + fullPath);
                    }
                    var command = 'move "' + fullPath + '" "' + tmpDir + '"';

                    exec(command, function (err, stdout, stderr) {
                        // stdout is a string containing the output of the command.
                        if (err) {
                            return writeLog(stderr);
                        }

                        exec('move "' + tmpDir + '" "' + doneRlsDir + '"', function (err, stdout, stderr) {
                            if (err) {
                                console.log(stderr)
                                return writeLog("Konnte nicht verschieben");
                            }
                            rimraf(jd_dl_path + PATH_SPLITTER + pkgName, function (err) {
                                if (err)
                                    return writeLog("Datei konnte nicht gelöscht werden");
                                return writeLog(_msgTmp + " Release Fertig");

                            });
                            /*   exec("rmdir /s /q \""+jd_dl_path+PATH_SPLITTER+pkgName+"\"", function(err, stdout, stderr){
                             if(err) {
                             return writeLog("Konnte nicht gelöscht werden: "+pkgName);
                             } */
                            //return writeLog(pkgName + " Release Fertig");

                            //                    });
                        });

                    });
                });
            } catch(e) {
                console.log(e);
            }
        }
    });

}

function firstRun($mainUrl) {
    var jdUser = $("#jd_user").val();
    var jdPass = $("#jd_pw").val();
    var jdDeviceId = $("#jd_device_id").val();
    if (jdUser.length > 0 && jdPass.length > 0 && jdDeviceId.length > 0) {
        jDownloader.init(jdUser, jdPass, function(err, data) {
            if (err)
                return writeLog("Jdownloader error!");

            toDoRls[$mainUrl] = [];

            avg.firstGrab($mainUrl, function(err, urls) {
                lastRls[$mainUrl] = urls[0];
                setItem("lastRelease", lastRls);
                if (err) {
                    return writeLog($mainUrl + " | " + urls);
                }
                var lengthUrl = urls.length;
                for (var i = 0; i < lengthUrl; i++)
                    avg.getReleaseData(urls[i], function(err, data) {
                        if(err) {
                            return false;
                        }
                        if(typeof data == "undefined") {
                            return false;
                        }
                        if(typeof data.rlsName == "undefined")
                            return false;
                        //Create the directory

                        var _rlsName = escapeRls(data.rlsName);
                        var _rlsNameLength = _rlsName.length;
                        if(_rlsName.charAt(0) == " " || _rlsName.charAt(0) == ".") {
                            _rlsName = _rlsName.substring(1);
                        }
                        if(_rlsName.charAt(_rlsNameLength - 1 ) == " " || _rlsName.charAt(_rlsNameLength - 1) == ".") {
                            _rlsName = _rlsName.slice(0, -1);
                        }
                        if(_.contains(rlsList, _rlsName) || _.contains(rlsListUrl,data.download)) {
                            return;
                        }
                        setRlsList(_rlsName,data.download);
                        var _tmpDir = tmpDir + PATH_SPLITTER + _rlsName;
                        data.rlsName = _rlsName;
                        fs.mkdir(_tmpDir, "0777", function(err) {
                            if (err)
                                return writeLog(data.rlsName + " | " + err);
                            data.text = escapeText(data.text);
                            if($("#ImageInTxt").prop("checked")) {
                                data.text += "\r\n\r\n"+data.image;
                            }
                            fs.writeFile(_tmpDir + PATH_SPLITTER + "info.txt", data.text,"ascii", function(err) {
                                if (err)
                                    return writeLog("Konnte nicht geschrieben werden: " + data.rlsName);
                                var ext = data.image.split(".");
                                var fileExt = ext[ext.length - 1];
                                if(fileExt.toLowerCase() == "jpeg")
                                    fileExt = "jpg";
                                req.get(data.image, function(err, rsp, bdy) {
                                    if (err)
                                        writeLog("Kein Cover gefunden " + data.rlsName);
                                    var pkgName = generateUniqueId();
                                    toDoRls[$mainUrl].push(pkgName + "|||" + _tmpDir);
                                    jDownloader.addLinks($("#jd_device_id").val(), [data.download], pkgName, jd_dl_path + PATH_SPLITTER + pkgName, function(err, data) {
                                        if (err)
                                            return writeLog("Could not add to jDownloader " + data.rlsName);

                                    });
                                }).pipe(fs.createWriteStream(_tmpDir + PATH_SPLITTER + makeid()+"." + fileExt));
                            })

                        });
                    });
            });
        });

    }

}

function generateUniqueId() {
    return uuid.v4();
}

function makeid()
{
    var text = "";
    var possible = "abcdefghijklmnopqrstuvwxyz";
    var randNmbr = Math.floor(Math.random() * 16 | 0) + 4;
    for( var i=0; i < randNmbr; i++ )
        text += possible.charAt(Math.floor(Math.random() * possible.length));

    return text;
}

function escapeRls(_rls) {
    return _rls.trim()
        .replace("\\", "_")
        .replace(/\(repost\)/gi, "")
        .replace(/&/g, " und ")
        .replace(/#/g, "")
        .replace(/\(/, "")
        .replace(/\)/g, "")
        .replace(/é/g, "e")
        .replace(/É/g, "E")
        .replace(/´/g, "")
        .replace(/,/g, "")
        .replace(/Ä/g, "Ae")
        .replace(/ä/g, "ae")
        .replace(/Ö/g, "Oe")
        .replace(/ö/g, "oe")
        .replace(/Ü/g, "Ue")
        .replace(/ü/g, "ue")
        .replace(/N°/gi, "No")
        .replace(/ß/g, "ss")
        .replace(/°/g, "")
        .replace(/\?/g, "")
        .replace(/\+/g, "")
        .replace(/\!/g, "")
        .replace(/•/g, "-")
        .replace(/\'/g, "")
        .replace(/´/g, "")
        .replace(/\"/g, "")
        .replace(/\s/g, ".")
        .replace(/–/g, "-")
        .replace(/\//g, "-")
        .replace(/’/g, "")
        .replace(/•/g, "-")
        .replace(/–/g, "-")
        .replace(/№/g, "")
        .replace(/\.\./g, ".");
}
function escapeText(_rls) {
    var iconv = require("iconv-lite");
    _rls =  _rls.trim()
        .replace("\\", "_")
        .replace(/\(repost\)/gi, "")
        .replace(/&/g, " und ")
        .replace(/#/g, "")
        .replace(/\(/, "")
        .replace(/\)/g, "")
        .replace(/É/g, "E")
        .replace(/é/g, "e")
        .replace(/´/g, "")
        .replace(/,/g, "")
        .replace(/N°/gi, "No")
        .replace(/ß/g, "ss")
        .replace(/°/g, "")
        .replace(/\?/g, "")
        .replace(/\+/g, "")
        .replace(/\!/g, "")
        .replace(/’/g, "")
        .replace(/•/g, "-")
        .replace(/–/g, "-")
        .replace(/№/g, "")
        .replace(/\.\./g, ".");
    return _rls;
}