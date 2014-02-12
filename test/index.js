var Suite = require("../suite");
new Suite("Q").describe(function () {
    require("./jasmine-test");
}).runAndReport().done();
