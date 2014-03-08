
var Q = require("q");
var Require = require("mr");
var URL = require("url");
var QS = require("qs");
require("colors");

var Suite = require("../jasminum");
var Reporter = require("./reporter");

var location = URL.resolve(window.location, "/");
var query = QS.parse(window.location.search.slice(1));

Require.loadPackage(location, {
    overlays: ["browser"]
})
.then(function (package) {
    return Q.all(query.modules.map(function (module) {
        return package.deepLoad(module);
    }))
    .then(function () {
        var suite = new Suite("jasminum").describe(function () {
            query.modules.forEach(function (module) {
                console.log(module.grey);
                package(module);
            });
        });
        return suite.runAndReport({
            report: new Reporter()
        });
    });
})
.done();

