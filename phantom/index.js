
var Require = require("mr");
var URL = require("mr/url");
var QS = require("qs");

var Suite = require("../jasminum");
var Reporter = require("./reporter");

var location = URL.resolve(window.location, "/");
var query = QS.parse(window.location.search.slice(1));

Require.loadPackage(location, {
    overlays: ["browser"]
})
.then(function (package) {
    return package.deepLoad(query.module)
    .then(function () {
        var suite = new Suite("jasminum").describe(function () {
            package(query.module);
        });
        return suite.runAndReport({
            report: new Reporter()
        });
    });
})
.done();

