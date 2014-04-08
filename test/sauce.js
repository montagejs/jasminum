// hung selenium/sauce {"browserName": "chrome", "version": 33, "platform": "Windows XP"},

// TODO download the Sauce Labs test matrix after all tests complete and post
// it to S3.

// TODO back out early if the version is not 0.10, to avoid running browser
// tests for every version of Node.js covered by Travis-CI.

// TODO construct a build identifier using a variety of techniques, from
// TRAVIS_JOB_ID, to Git subprocesses to check whether the working copy is
// dirty, to using Git to interpret the hash of the head.

var configuration = require("../package.json").sauce;
var Q = require("q");
var webdriver = require("wd");
var SauceLabs = require("saucelabs");
var URL = require("url");

var browserify = require("browserify");
var NodeReader = require("q-io/reader");

var knox = require("knox");
var s3 = knox.createClient({
    bucket: "jasminum",
    key: process.env.S3_ACCESS_KEY_ID,
    secret: process.env.S3_ACCESS_KEY
});

var sauce = Q(new SauceLabs({
    username: process.env.SAUCE_USERNAME,
    password: process.env.SAUCE_ACCESS_KEY
}));

//return sauce.ninvoke("getWebDriverBrowsers")
//.then(function (browsers) {
//    console.log(browsers.length);
//})
//.done();

var bundle = browserify();
bundle.add("./test/index.js");
// TODO note that NodeReader changes in Q-IO v2, does not return a promise,
// just returns the stream itself. Should not take charset as argument.
var reader = NodeReader(bundle.bundle());
return reader.invoke("read").then(function (script) {
    return put("/test.js", script, {
        "Content-Length": script.length,
        "Content-type": "application/json",
        "x-amz-acl": "public-read"
    });
}).then(function () {
    var page = "<body><script src=\"test.js\"></script></body>";
    return put("/test.html", page, {
        "Content-Length": page.length,
        "Content-type": "text/html",
        "x-amz-acl": "public-read"
    });
}).then(function () {
    return configuration.configurations.reduce(function (previous, configuration) {
        return previous.then(function () {
            return runConfiguration(configuration);
        });
    }, Q())
}).done();

function runConfiguration(configuration) {
    var browser = webdriver.promiseRemote(
        "ondemand.saucelabs.com",
        80,
        process.env.SAUCE_USERNAME,
        process.env.SAUCE_ACCESS_KEY
    );

    browser.on('status', function(info){
      console.log("WD-STATUS>", info);
    });

    browser.on('command', function(meth, path){
      console.log("WD-COMMAND>", meth, path);
    });

    configuration.name = "Jasminum";
    configuration.tags = []; // TODO prerelease, release, etc
    configuration.build = process.env.TRAVIS_JOB_ID;
    return browser.init(configuration)
    .then(function (session) {
        var sessionId = session[0];
        console.log("SESSION", sessionId);

        return browser.get(URL.resolve(process.env.S3_WEBSITE, "test.html"))
        .then(function () {
            return poll(function () {
                return browser.eval("window.global_test_results")
                .then(function (results) {
                    return slurpLogs(browser)
                    .thenResolve(results);
                });
            }, 100)
            .then(function(results) {
                console.log(results);
            })
        })
        .then(function () {
            return slurpLogs();
        })
        .timeout(10 * 1000)
        .then(function () {
            return sauce.ninvoke("updateJob", sessionId, {
                passed: true,
                public: true
            });
        }, function (error) {
            return sauce.ninvoke("updateJob", sessionId, {
                passed: false,
                public: true,
                "custom-data": {
                    "error": error.stack
                }
            });
        });
    })
    .finally(function () {
        return browser.quit();
    });
}

function put(path, content, headers) {
    var deferred = Q.defer();
    var request = s3.put(path, headers);
    request.on("response", function (response) {
        if (response.statusCode === 200) {
            deferred.resolve();
        } else {
            deferred.reject("Can't post " + response.statusCode);
        }
    });
    request.end(content);
    return deferred.promise;
}

function slurpLogs(browser) {
    return Q();
    // TODO
    return browser.log("browser")
    .then(function (logs) {
        logs.forEach(function (log) {
            console.log(log.message);
        });
    }, function () {
        // I'm not even angry
    });
}

function poll(callback, ms) {
    return callback().then(function (value) {
        if (value) {
            return value;
        } else {
            return Q().delay(ms).then(function () {
                return poll(callback, ms);
            });
        }
    })
}

