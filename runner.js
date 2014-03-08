#!/usr/bin/env node

var search = require("./search");
var optimist = require("optimist");

var Suite = require("./jasminum");
var Reporter = require("./reporter");

var argv = optimist.argv;

search(argv._).then(function (files) {

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

    return suite.runAndReport({
        report: report
    });
})
.done();

