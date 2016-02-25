'use strict';

var registerJoin = require('../services/join');

module.exports = function(Book) {
    registerJoin(Book);


};
