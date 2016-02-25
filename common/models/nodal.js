'use strict';

var registerJoin = require('../services/join');

module.exports = function(Nodal) {
    registerJoin(Nodal);


    Nodal.clear = function(where, cb) {
        this.destroyAll(where, cb);
    };


    Nodal.remoteMethod(
        'clear', {
            returns: {
                arg: 'result',
                type: 'object'
            },
            description: 'Delete all matching records.',
            accessType: 'WRITE',
            accepts: {
                arg: 'where',
                type: 'object',
                description: 'filter.where object'
            },
            http: {
                verb: 'del'
            }
        });
};
