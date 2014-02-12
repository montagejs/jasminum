
require("collections/shim");

module.exports = Expectation;
function Expectation(value, report) {
    this.value = value;
    this.report = report;
    this.not = Object.create(this);
    this.not.isNot = true;
    this.not.not = this;
}

function getStackTrace() {
    var stack = new Error("").stack;
    if (typeof stack === "string") {
        return stack.replace(/^[^\n]*\n[^\n]\n/, "");
    } else {
        return stack;
    }
}

Expectation.prototype.unaryExpectation = function (operator, operatorName) {
    var guard = operator.call(this, this.value);
    var stack = getStackTrace();
    var assertion = {
        operator: (this.isNot ? "not " : "") + operatorName,
        not: this.isNot,
        expected: this.value,
        stack: stack || ""
    };
    if (!!guard === !!this.isNot) {
        this.report.failUnaryAssertion(assertion);
    } else {
        this.report.passAssertion(assertion);
    }
};

Expectation.prototype.binaryExpectation = function (operator, operatorName, value) {
    var guard = operator.call(this, this.value, value);
    var stack = getStackTrace();
    var assertion = {
        operator: (this.isNot ? "not " : "") + operatorName,
        not: this.isNot,
        expected: this.value,
        actual: value,
        stack: stack || ""
    };
    if (!!guard === !!this.isNot) {
        this.report.failBinaryAssertion(assertion);
    } else {
        this.report.passAssertion(assertion);
    }
};

Expectation.prototype.naryExpectation = function (operator, operatorName, args) {
    args.unshift(this.value);
    var guard = operator.apply(this, args);
    var stack = getStackTrace();
    var assertion = {
        operator: (this.isNot ? "not " : "") + operatorName,
        not: this.isNot,
        expected: this.value,
        actual: args[0],
        stack: stack || ""
    };
    if (!!guard === !!this.isNot) {
        this.report.failBinaryAssertion(assertion);
    } else {
        this.report.passAssertion(assertion);
    }
};

Expectation.unaryMethod = expectationUnaryMethod;
function expectationUnaryMethod(operator, operatorName) {
    return function (value) {
        return this.unaryExpectation(operator, operatorName, value);
    };
}

Expectation.binaryMethod = expectationBinaryMethod;
function expectationBinaryMethod(operator, operatorName) {
    return function (value) {
        return this.binaryExpectation(operator, operatorName, value);
    };
}

Expectation.naryMethod = expectationNaryMethod;
function expectationNaryMethod(operator, operatorName) {
    return function () {
        return this.naryExpectation(operator, operatorName, Array.prototype.slice.call(arguments));
    };
}

function equals(left, right) {
    // So that right can be an Any object with an equals override
    return Object.equals(right, left);
}

Expectation.prototype.toEqual = Expectation.binaryMethod(equals, "to equal");

Expectation.prototype.toBe = Expectation.binaryMethod(Object.is, "to be");

Expectation.prototype.toNotBe = function (value) {
    return this.not.toBe(value);
};

Expectation.prototype.toBeUndefined = function () {
    return this.toBe(undefined);
};

Expectation.prototype.toBeDefined = function () {
    return this.not.toBe(undefined);
};

Expectation.prototype.toBeNull = function () {
    return this.toBe(null);
};

Expectation.prototype.toBeTruthy = Expectation.binaryMethod(Boolean, "to be truthy");

Expectation.prototype.toBeFalsy = function () {
    return this.not.toBeTruthy();
};

Expectation.prototype.toContain = Expectation.binaryMethod(Object.has, "to contain");

function lessThan(a, b) {
    return Object.compare(a, b) < 0;
}

Expectation.prototype.toBeLessThan = Expectation.binaryMethod(lessThan, "to be less than");

function greaterThan(a, b) {
    return Object.compare(a, b) > 0;
}

Expectation.prototype.toBeGreaterThan = Expectation.binaryMethod(greaterThan, "to be greater than");

function near(a, b, epsilon) {
    var difference = Math.abs(Object.compare(a, b));
    if (difference === 0) {
        return Object.equals(a, b);
    } else {
        return difference < epsilon;
    }
}

function close(a, b, precision) {
    return near(a, b, Math.pow(10, -precision));
}

Expectation.prototype.toBeNear = Expectation.naryMethod(near, "to be near to");
Expectation.prototype.toBeCloseTo = Expectation.naryMethod(close, "to be close to");

function match(a, b) {
    if (typeof b === "string") {
        b = new RegExp(RegExp.escape(b));
    }
    return b.exec(a) != null;
}

Expectation.prototype.toMatch = Expectation.binaryMethod(match, "to match");

Expectation.prototype.toThrow = function () {
    if (this.isNot) {
        try {
            this.value();
            this.report.passAssertion();
        } catch (error) {
            this.report.failAssertion({
                message: "expected function not to throw",
                stack: getStackTrace()
            });
        }
    } else {
        try {
            this.value();
            this.report.failAssertion({
                message: "expected function to throw",
                stack: getStackTrace()
            });
        } catch (error) {
            this.report.passAssertion();
        }
    }
};

