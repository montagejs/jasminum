// vim:ts=4:sts=4:sw=4:

var Q = require("q");

require("./dsl");

var Test = require("./test");
var Expectation = require("./expectation");
var Reporter = require("./reporter");

module.exports = Suite;

function Suite(name) {
    this.name = name;
    this.parent = null;
    this.root = this;
    this.children = [];
    this.exclusive = false;
    this.beforeEach = null;
    this.afterEach = null;
    this.testCount = 0;
}

Suite.prototype.type = "describe";

Suite.prototype.describe = function (callback) {
    setCurrentSuite(this);
    try {
        callback();
    } finally {
        setCurrentSuite(this.parent);
    }
    return this;
};

Suite.prototype.nestSuite = function (name) {
    var child = Object.create(this);
    child.parent = this;
    child.name = name;
    child.children = [];
    child.exclusive = false;
    this.children.push(child);

    // Specialize the Expectation
    function SuiteExpectation(value, report) {
        Expectation.call(this, value, report);
    }
    SuiteExpectation.prototype = Object.create(this.Expectation.prototype);
    child.Expectation = SuiteExpectation;

    return child;
};

Suite.prototype.nestTest = function (name, callback) {
    var child = new this.Test(name, callback, this, this.root);
    this.root.testCount++;
    child.exclusive = false;
    this.children.push(child);
    return child;
};

Suite.prototype.setExclusive = function () {
    var child = this;
    while (child) {
        child.exclusive = true;
        child = child.parent;
    }
};

Suite.prototype.run = function (report) {
    var self = this;
    if (self.skip) return Q();
    var exclusiveChildren = this.children.filter(function (child) {
        return child.exclusive;
    });
    var children = exclusiveChildren.length ? exclusiveChildren : this.children;
    var suiteReport = report.start(this);
    return children.reduce(function (ready, child) {
        return ready.then(function () {
            return child.run(suiteReport);
        });
    }, Q())
    .finally(function () {
        suiteReport.end(self);
    });

};

Suite.prototype.runAndReport = function (options) {
    var report = new this.Reporter();
    var self = this;
    return this.run(report, options)
    .then(function () {
        report.summarize(self, options)
        if (report.exit) {
            report.exit();
        }
    });
};

Suite.prototype.Test = Test;
Suite.prototype.Expectation = Expectation;
Suite.prototype.Reporter = Reporter;

