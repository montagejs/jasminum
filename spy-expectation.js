
var Expectation = require("./expectation");

module.exports = SpyExpectation;
function SpyExpectation(value, report) {
    this.value = value;
    this.report = report;
    this.not = Object.create(this);
    this.not.isNot = true;
    this.not.not = this;
}

SpyExpectation.prototype = Object.create(Expectation.prototype);

SpyExpectation.prototype.constructor = SpyExpectation;

SpyExpectation.prototype.toHaveBeenCalled = Expectation.unaryMethod(function () {
    return this.value.argsForCall.length > 0;
}, "to have been called");

SpyExpectation.prototype.toHaveBeenCalledWith = function () {
    expect(this.value.argsForCall).toContain(Array.prototype.slice.call(arguments));
};

