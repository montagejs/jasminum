
require("colors");

module.exports = Reporter;
function Reporter(options) {
    options = options || {};
    this.showFails = !!options.showFails;
    this.root = this;
    this.passed = 0;
    this.failed = 0;
    this.skipped = 0;
    this.errors = 0;
    this.passedAssertions = 0;
    this.failedAssertions = 0;
    this.depth = 0;
}

Reporter.prototype.start = function (test) {
    var child = Object.create(this);
    child.parent = this;
    child.depth = this.depth + 1;
    child.failed = false;
    child.skipped = false;
    var message = (Array(child.depth + 1).join("❯") + " " + test.type + " " + test.name + (test.async ? " async".white : ""));
    if (test.skip) {
        message = message.cyan;
    } else {
        message = message.grey;
    }
    child.message = message;
    if (!this.showFails) {
        console.log(child.message);
    }
    return child;
};

Reporter.prototype.end = function (test) {
    if (this.showFails && this.failed) {
        console.log((Array(this.depth + 1).join("⬆") + " " + test.type + " " + test.name).grey);
    }
    if (this.failed && this.parent && this.parent.parent) {
        this.parent.failed = true;
    }
    if (test.type === "it") {
        if (this.failed) {
            this.root.failed++;
        } else if (this.skipped) {
            this.root.skipped++;
        } else {
            this.root.passed++;
        }
    }
};

Reporter.prototype.summarize = function (suite) {
    if (!this.failed && this.passed) {
        console.log((this.passed + " passed tests").green);
    } else {
        console.log(this.passed + " passed tests");
    }
    if (!this.failedAssertions && this.passedAssertions && !this.failed && this.passed) {
        console.log((this.passedAssertions + " passed assertions").green);
    } else {
        console.log(this.passedAssertions + " passed assertions");
    }
    if (this.failed) {
        console.log((this.failed + " failed tests").red);
    } else {
        console.log(this.failed + " failed tests");
    }
    if (this.failedAssertions) {
        console.log((this.failedAssertions + " failed assertions").red);
    } else {
        console.log(this.failedAssertions + " failed assertions");
    }
    if (this.errors) {
        console.log((this.errors + " errors").red);
    } else {
        console.log(this.errors + " errors");
    }
    var skipped = suite.testCount - this.passed - this.failed;
    if (skipped) {
        console.log((skipped + " skipped tests").cyan);
    }
};

Reporter.prototype.skip = function () {
    this.skipped = true;
    this.root.skipped++;
};

Reporter.prototype.failAssertion = function (assertion) {
    console.log(("" + assertion.message).red);
    console.error(assertion.stack);
    this.failed = true;
    this.root.failedAssertions++;
};

Reporter.prototype.failUnaryAssertion = function (assertion) {
    console.log(("expected " + assertion.message).red);
    console.log(assertion.expected);
    console.log("at".red);
    console.error(assertion.stack);
    this.failed = true;
    this.root.failedAssertions++;
};

Reporter.prototype.failBinaryAssertion = function (assertion) {
    console.log("expected".red);
    console.log(assertion.expected);
    console.log(assertion.operator.red);
    console.log(assertion.actual);
    console.log("at".red);
    console.error(assertion.stack);
    this.failed = true;
    this.root.failedAssertions++;
};

Reporter.prototype.passAssertion = function () {
    this.root.passedAssertions++;
};

Reporter.prototype.error = function (error, test) {
    this.failed = true;
    this.root.errors++;
    console.log("error".red);
    console.error(error && error.stack ? error.stack : error);
};

Reporter.prototype.exit = function () {
    process.exit(this.failed ? -1 : 0);
};

