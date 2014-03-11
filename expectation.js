
require("collections/shim");

module.exports = Expectation;
function Expectation(value, report) {
    this.value = value;
    this.report = report;
    this.isNot = false;
    this.not = Object.create(this);
    this.not.isNot = true;
    this.not.not = this;
}

Expectation.binaryMethod = expectationBinaryMethod;
function expectationBinaryMethod(operator, operatorName) {
    return function (value) {
        var guard = operator.call(this, this.value, value);
        this.report.assert(
            !guard === this.isNot,
            [
                "expected",
                (this.isNot ? "not " : "") + operatorName
            ],
            [
                this.value,
                value
            ]
        );
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

Expectation.prototype.toBeNear = function (value, epsilon) {
    var guard = close(this.value, value, precision);
    this.report.assert(
        !guard === this.isNot,
        [
            "expected",
            (this.isNot ? "not " : "") + " to be near",
            "within",
            "above or below"
        ],
        [
            this.value,
            value,
            epsilon
        ]
    );
};

function close(a, b, precision) {
    return near(a, b, Math.pow(10, -precision));
}

Expectation.prototype.toBeCloseTo = function (value, precision) {
    var guard = close(this.value, value, precision);
    this.report.assert(
        !guard === this.isNot,
        [
            "expected",
            (this.isNot ? "not " : "") + "to be close to",
            "within",
            "digits of precision"
        ],
        [
            this.value,
            value,
            precision
        ]
    );
};

Expectation.prototype.toBeBetween = function (low, high) {
    var guard = Object.compare(low, this.value) > 0 && Object.compare(high, this.value) < 0;
    this.report.assert(
        !guard === this.isNot,
        [
            "expected",
            (this.isNot ? "not " : "") + " to be between",
            "and"
        ],
        [
            this.value,
            low,
            high
        ]
    );
};

Expectation.prototype.toBeInRange = function (low, high) {
    var guard = Object.compare(low, this.value) >= 0 && Object.compare(high, this.value) < 0;
    this.report.assert(
        !guard === this.isNot,
        [
            "expected",
            (this.isNot ? "not " : "") + " to be within the interval",
            "inclusive to",
            "exclusive"
        ],
        [
            this.value,
            low,
            high
        ]
    );
};

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
            this.report.assert(true, [
                "expected function not to throw"
            ], []);
        } catch (error) {
            this.report.assert(false, [
                "expected function not to throw but threw"
            ], [error]);
        }
    } else {
        try {
            this.value();
            this.report.assert(false, [
               "expected function to throw"
            ], []);
        } catch (error) {
            this.report.assert(true, [
               "expected function to throw"
            ], []);
        }
    }
};

