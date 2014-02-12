// vim:ts=4:sts=4:sw=4:

var Q = require("q");

module.exports = Test;

function Test(name, callback, suite) {
    this.name = name;
    this.callback = callback;
    this.children = [];
    this.suite = suite;
    this.skip = !callback;
}

Test.prototype.type = "it";

Test.prototype.run = function (report) {
    var self = this;
    var report = report.start(self);
    setCurrentTest(self);
    setCurrentReport(report);
    return Q.try(function () {
        if (!self.skip) {
            var context = {};
            return Q.try(function () {
                return self.beforeEach(context, report);
            })
            .then(function () {
                return self.call(self.callback, context, report, "during");
            })
            .finally(function () {
                return self.afterEach(context, report);
            })
        }
    })
    .then(function (value) {
        // TODO expect return value to be undefined
    }, function (error) {
        report.error(error, self);
    })
    .finally(function () {
        report.end(self);
        setCurrentTest();
        setCurrentReport();
    });
};

Test.prototype.beforeEach = function (context, report) {
    var self = this;
    var heritage = this.heritage();
    return heritage.reduceRight(function (ready, suite) {
        return ready.then(function () {
            if (suite.beforeEach) {
                return self.call(suite.beforeEach, context, report, "before");
            }
        });
    }, Q());
};

Test.prototype.afterEach = function (context, report) {
    var self = this;
    var heritage = this.heritage();
    return heritage.reduceRight(function (ready, suite) {
        return ready.then(function () {
            if (suite.afterEach) {
                return self.call(suite.afterEach, context, report, "after");
            }
        });
    }, Q());
};

Test.prototype.heritage = function () {
    var heritage = [];
    var suite = this.suite;
    while (suite) {
        heritage.push(suite);
        suite = suite.parent;
    }
    return heritage;
};

Test.prototype.call = function (callback, context, report, phase) {
    function done(error) {
        if (!deferred.promise.isPending()) {
            report.error(new Error("`done` called multiple times " + phase + " " + JSON.stringify(test.name)), test);
        }
        if (error) {
            deferred.reject(error);
        } else {
            deferred.resolve();
        }
    }
    if (callback.length === 1) {
        var deferred = Q.defer();
        callback.call(context, done);
        return deferred.promise;
    } else {
        return callback.call(context);
    }
};

