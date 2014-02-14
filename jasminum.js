
var BaseSuite = require("./suite");
var Q = require("q");

module.exports = Suite;

function Suite() {
    BaseSuite.apply(this, arguments);
}

Suite.prototype = Object.create(BaseSuite.prototype);
Suite.prototype.constructor = Suite;
Suite.prototype.Promise = Q.Promise;

