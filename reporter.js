
var util = require("util");
require("colors");

function getStackTrace() {
    var stack = new Error("").stack;
    if (typeof stack === "string") {
        return stack.replace(/^[^\n]*\n[^\n]\n/, "");
    } else {
        return stack;
    }
}

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
        message = (message + " (skipped)").cyan;
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

Reporter.prototype.skip = function (test) {
    this.skipped = true;
    this.root.skipped++;
};

Reporter.prototype.assert = function (guard, messages, objects) {
    if (!guard) {
        for (var index = 0; index < Math.max(messages.length, objects.length); index++) {
            if (index < messages.length) {
                console.log(("" + messages[index]).red);
            }
            if (index < objects.length) {
                console.log(util.inspect(objects[index], {colors: true, depth: null}));
            }
        }
        var stack = getStackTrace();
        if (stack) {
            console.log(stack);
        }
        this.failed = true;
        this.root.failedAssertions++;
    } else {
        this.root.passedAssertions++;
    }
};

Reporter.prototype.error = function (error, test) {
    this.failed = true;
    this.root.errors++;
    console.log("error".red);
    console.error(error && error.stack ? error.stack : error);
};

Reporter.prototype.enter = function () {
    if (typeof alert === "undefined") {
        var self = this;
        this.exitListener = function (code) {
            self.failed++;
            console.log("test never completes: add a timeout".red);
            self.exit(code !== 0);
        };
        process.on("exit", this.exitListener);
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

Reporter.prototype.exit = function (exiting) {
    if (typeof alert === "undefined") {
        // Node.js
        process.removeListener("exit", this.exitListener);
        if (!exiting) {
            process.exit(this.failed ? -1 : 0);
        }
    } else {
        // PhantomJS
        if (this.failed) {
            alert("Jasminum tests failed.");
        } else {
            alert("Jasminum tests completed.");
        }
    }
};

