'use strict';

var registerJoin = require('../services/join');

module.exports = function(Person) {
    registerJoin(Person);

};
