#!/usr/bin/env node

var fs = require("fs");
var glob = require("glob");
var path = require("path");
var optimist = require("optimist");
var Q = require("q");

var Suite = require("./suite");
var Reporter = require("./reporter");

var argv = optimist.argv;

// TODO use the Q
argv._.reduceRight(function (next, arg) {
    return function (error, list) {
        if (error) return next(error);
        return fs.stat(arg, function (error, stats) {
            if (!error && stats.isFile()) {
                return fs.realpath(arg, function (error, realpath) {
                    if (error) return next(error);
                    list.push(realpath);
                    return next(null, list);
                });
            } else if (stats && stats.isDirectory()) {
                glob(path.join(process.cwd(), arg, "**/*-{spec,test}.js"), function (error, files) {
                    if (error) return next(error);
                    list.push.apply(list, files);
                    return next(null, list);
                });
            } else {
                next(new Error("Arg must be a directory or file: " + arg));
            }
        });
    };
}, function (error, files) {
    if (error) throw error;

    var suite = new Suite("").describe(function () {
        files.forEach(function (file) {
            describe(file, function () {
                console.log(file.grey);
                require(file);
            });
        });
    });
    var options = {
        showFails: argv.f || argv.failures,
        showSkips: argv.s || argv.skips // TODO
    };
    var report = new Reporter(options);

    suite.run(Q.Promise, report, options)
    .then(function () {
        report.summarize(suite);
    })
    .done();

})(null, []);

