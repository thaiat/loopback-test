module.exports = function(Affiliation) {
    Affiliation.clear = function(where, cb) {
        this.destroyAll(where, cb);
    };


    Affiliation.remoteMethod(
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
