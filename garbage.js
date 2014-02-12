
Suite.prototype.runSync = function (report) {
    if (!this.skip) {
        var exclusiveChildren = this.children.filter(function (child) {
            return child.exclusive;
        });
        var children = exclusiveChildren.length ? exclusiveChildren : this.children;
        var suiteReport = report.start(this);
        try {
            for (var index = 0; index < children.length; index++) {
                var child = children[index];
                child.runSync(suiteReport);
            }
        } finally {
            suiteReport.end(this);
        }
    }
};

Test.prototype.runSync = function (report) {
    var report = report.start(this)
    setCurrentTest(this);
    setCurrentReport(report);
    try {
        if (!this.skip || this.callback.length > 0) {
            var context = {};
            try {
                this.beforeEachSync(context);
                this.callback.call(context);
            } finally {
                this.afterEachSync(context);
            }
        } else {
            report.skip(this);
        }
    } catch (error) {
        report.error(error, this);
    } finally {
        report.end(this);
        setCurrentTest();
        setCurrentReport();
    }
};

Test.prototype.beforeEachSync = function (context) {
    var heritage = this.heritage();
    for (var index = heritage.length - 1; index >= 0; index--) {
        var suite = heritage[index];
        if (suite.beforeEach) {
            suite.beforeEach.call(context);
        }
    }
};

Test.prototype.afterEachSync = function (context) {
    var heritage = this.heritage();
    for (var index = heritage.length - 1; index >= 0; index--) {
        var suite = heritage[index];
        if (suite.afterEach) {
            suite.afterEach.call(context);
        }
    }
};

