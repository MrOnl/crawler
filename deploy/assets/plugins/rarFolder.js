/**
 * Created by xTear on 04.10.15.
 */
module.exports = {
    exec: require("child_process").exec,
    path: require("path"),
    rar: function(folder, name, callback) {
        var command = "\"C:\\Users\\Nicolas Abend\\Downloads\\WinRAR Unplugged\\Rar.exe\" a -ep1 -m0 -r \"" + (name)+ ".rar\" \"" +(folder)+"\"";

       console.log(command);
        this.exec(command, function(err, stdout, stderr) {

            if (err)
                return callback(err, stderr);

            return callback(null, (name + ".rar").replace(/\s/g, "\\ "));

        });
    },
    extract: function(binary, rarFile, extractDir, callback) {
        var bin = "\""+binary.replace("\\", "\\\\")+"Rar.exe\" x  \""+ rarFile + "\" *.* \"" + extractDir + "\"";
        if(binary.length <= 0) {
            bin = "rar x \""+ rarFile + "\" *.* \"" + extractDir + "\"";
        }
        this.exec(bin, function(err,stdout, stderr) {
            if (err)
                return callback(stderr, bin);

         /*   var e  = extractDir.split("\\");
            var _o = e[e.length-1];
            if( _o.length <= 0)
                _o = e[e.length-2];

            var rgx = new RegExp(_o+"(.*)(?=ok)", "gmi");
            var match = (stdout.match(rgx)[0]);
            match = match.substring(_o.length).substring(1);
*/
            return callback(null, true);
        });
    },
    isRar: function(path) {
        var _p = path.split(".");
        var _pLength = _p.length;
        if( typeof _p != "object" && typeof _p != "array")
            return false;

        if( _p[_pLength-1].toLowerCase == "rar") {
            return true;
        }
        return false;
    }
};