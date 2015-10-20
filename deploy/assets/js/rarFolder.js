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
    }
};