
var SpyExpectation = require("./spy-expectation");

module.exports = createSpy;
function createSpy(identity, spied) {
    function spy() {
        var args = Array.prototype.slice.call(arguments)
        var call = {
            args: args
        };
        spy.mostRecentCall = call;
        spy.argsForCall.push(call.args);
        spy.calls.push(call);
        if (spy.callThrough) {
            return spy.spied.apply(this, arguments);
        }
    }
    spy.identity = identity;
    spy.calls = [];
    spy.argsForCall = [];
    spy.spied = spied;
    spy.callThrough = false;
    spy.andCallFake = function (fake) {
        spy.spied = fake;
        spy.callThrough = true;
    };
    spy.andCallThrough = function () {
        spy.callThrough = true;
    };
    spy.andReturn = function (value) {
        spy.callThrough = true;
        spy.spied = function () {
            return value;
        };
    };
    spy.expect = function () {
        return expectation;
    };
    var expectation = new SpyExpectation(spy, getCurrentReport());
    return spy;
}

