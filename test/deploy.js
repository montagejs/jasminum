
var config = require("../package.json");
var NodeReader = require("q-io/reader");
var ChildProcess = require("child_process");
var knox = require("knox");
var browserify = require("browserify");
var URL = require("url");
var Q = require("q");

module.exports = deploy;
function deploy() {
    return getDeploymentReference().then(function (reference) {
        var s3 = knox.createClient({
            bucket: "jasminum",
            key: process.env.S3_ACCESS_KEY_ID,
            secret: process.env.S3_ACCESS_KEY
        });
        var bundle = browserify();
        bundle.add("./test/index.js");
        // TODO note that NodeReader changes in Q-IO v2, does not return a promise,
        // just returns the stream itself. Should not take charset as argument.
        var reader = NodeReader(bundle.bundle());
        return reader.invoke("read").then(function (script) {
            return put(s3, URL.resolve(reference.path, "test.js"), script, {
                "Content-Length": script.length,
                "Content-type": "application/json",
                "x-amz-acl": "public-read"
            });
        }).then(function () {
            var page = "<body><script src=\"test.js\"></script></body>";
            return put(s3, URL.resolve(reference.path, "test.html"), page, {
                "Content-Length": page.length,
                "Content-type": "text/html",
                "x-amz-acl": "public-read"
            });
        }).then(function () {
            return {
                type: reference.type,
                tags: [reference.type],
                build: reference.build,
                custom: reference,
                testLocation: URL.resolve(URL.resolve(process.env.S3_WEBSITE, reference.path), "test.html")
            }
        });
    });
}

function put(s3, path, content, headers) {
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

function getDeploymentReference() {
    return getGitHash("head").then(function (hash) {
        return gitIsClean().then(function (gitIsClean) {
            if (gitIsClean) {
                return getGitHash("v" + config.version).then(function (vHash) {
                    if (hash === vHash) {
                        return {
                            type: "release",
                            hash: hash,
                            version: config.version,
                            build: "v" + config.version,
                            path: "/release/" + config.version + "/"
                        }
                    } else {
                        return {
                            type: "integration",
                            hash: hash,
                            build: hash.slice(0, 7),
                            path: "/integration/" + hash + "/"
                        }
                    }
                });
            } else {
                var nonce = Math.random().toString(36).slice(2, 7);
                return {
                    type: "development",
                    hash: hash,
                    nonce: nonce,
                    build: hash.slice(0, 7) + "-" + nonce,
                    path: "/development/" + hash + "-" + nonce + "/"
                };
            }
        })
    });
}

function getGitHash(rev) {
    var git = ChildProcess.spawn("git", ["rev-parse", rev]);
    var out = NodeReader(git.stdout, "utf-8");
    return out.invoke("read").then(function (line) {
        return line.trim();
    });
}

function gitIsClean() {
    var git = ChildProcess.spawn("git", ["status", "--porcelain"]);
    var out = NodeReader(git.stdout, "utf-8");
    return out.invoke("read").then(function (line) {
        return line.trim() === "";
    });
}

if (require.main === module) {
    return deploy().done(console.log);
}

