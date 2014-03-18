#!/usr/bin/env node

var ChildProcess = require("child_process");
var Q = require("q");
var QS = require("qs");
var Fs = require("q-io/fs");
var Joey = require("joey");
var Require = require("mr");
var optimist = require("optimist");
var search = require("../search");

var argv = optimist.argv;

search(argv._).then(function (files) {
    return Require.findPackageLocationAndModuleId(files[0])
    .then(function (found) {
        var path = Require.locationToPath(found.location);
        var modules = files.map(function (file) {
            return Fs.relativeFromDirectory(path, file);
        });

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
                    modules: modules
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
})
.done(process.exit);

