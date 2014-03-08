
var ChildProcess = require("child_process");
var Q = require("q");
var QS = require("qs");
var Fs = require("q-io/fs");
var Joey = require("joey");
var Require = require("mr");
var optimist = require("optimist");

var argv = optimist.argv;

Require.findPackageLocationAndModuleId(argv._[0])
.then(function (found) {
    var path = Require.locationToPath(found.location);

    var server = Joey
    .route(function ($) {
        $("~/...").fileTree(Fs.join(__dirname, ".."), {
            followInsecureSymbolicLinks: true
        });
    })
    .fileTree(path, {followInsecureSymbolicLinks: true})
    .server();

    return server.listen(0)
    .then(function (server) {
        var codeDeferred = Q.defer();
        var port = server.address().port;
        var child = ChildProcess.spawn("phantomjs", [
            Fs.join(__dirname, "script.js"),
            "http://localhost:" + port + "/~/phantom/index.html?" + QS.stringify({
                module: found.id
            })
        ], {
            stdio: [
                process.stdin,
                process.stdout,
                process.stderr
            ]
        });
        child.on("close", function (code, signal) {
            codeDeferred.resolve(code);
        });
        return codeDeferred.promise;
    })
    .finally(server.stop);
})
.done(process.exit);

