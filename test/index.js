var Suite = require("../jasminum");
new Suite("jasminum").describe(function () {
    require("./jasmine-test");
}).runAndReport().done();
