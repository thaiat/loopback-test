'use strict';

var _ = require('lodash');
global.Promise = require('bluebird');
var joinHelper = require('../../lib/joinHelper');

module.exports = function(Model) {
    var app = require('../../server/server');
    console.log('registering join with', Model.modelName);

    /**
     * Perform a join by iterating over the set of models and fetching/merging target entities based on their related keys
     * @param  {Object[]} targets        - The target model or models for the join
     * @param  {string} targets[].name          - The name of the target model (required)
     * @param  {string} [targets[].key]         - The relation key on the base model that contains the target model's ID (overrides opts.keySuffix)
     * @param  {Object} [targets[].scope]       - The filter to be applied to the target model query (overrides opts.scope)
     * @param  {bool} [targets[].type]          - The type of join to perform for this target (overrides opts.type)
     * @param  {Object} opts                    - Options
     * @param  {string} opts.destination        - The name of the model into which the retults of the join should be inserted
     * @param  {string} [opts.keySuffix = 'Id'] - Appended to target.name to build the key on the base model that contains the target model's ID
     * @param  {Object} [opts.filter = {}]      - Optional filter to passed to the base model's find()
     * @param  {Object} [opts.scope = {}]       - Optional scope to passed to the target models' findById()
     * @param  {bool} [opts.clear = true]       - Whether the destination should be cleared before inserting the results (defaults to true)
     * @param  {string} [opts.type = 'inner']   - The type of join to perform (defaults to inner)
     * @param  {number} [opts.concurrency = 10] - The maximum number of concurrent join ops to allow (defaults to 10, see http://bluebirdjs.com/docs/api/promise.map.html)
     * @returns {Buffer}                        - A binary buffer of the docx
     */
    Model.join = function(targets, opts, cb) {
        targets = [].concat(targets);
        opts = _.assign({
            keySuffix: 'Id',
            filter: {},
            scope: {},
            clear: true,
            type: 'inner'
        }, opts);

        if (!opts.destination) {
            return cb(new Error('No destination provided!'))
        }
        if (!Destination) {
            return cb(new Error('Destination ' + opts.destination + ' is not a registered model'))
        }
        var Destination = app.models[opts.destination];
        // pass the destination and methods via opts
        opts.destination = {
            name: opts.destination,
            clearAsync: Promise.promisify(Destination.clear, { context: Destination }),
            upsertAsync: Promise.promisify(Destination.upsert, { context: Destination })
        };

        if (!targets || _.some(targets, _.isEmpty) || !_.every(targets, 'name')) {
            return cb(new Error('Invalid target(s) provided. Targets must contain at least a model name.'));
        }

        _.each(targets, function(target) {
            if (!app.models[target.name]) {
                cb(new Error('Invalid target provided. ' + target.name + ' is not a registered model.'));
            }
            // default the key and scope properties for each target
            target.key = target.key || target.name + opts.keySuffix;
            target.scope = target.scope || opts.scope;
            target.type = target.type || opts.type;
            // attach the bound findById method from each target Model to the the target object.
            var Target = app.models[target.name];
            target.findByIdAsync = Promise.promisify(Target.findById, { context: Target })
        });


        return new Promise.fromCallback(Model.find.bind(Model, opts.filter))
            .map(joinHelper.joinAndInsert(targets, opts), {
                concurrency: opts.concurrency
            })
            .asCallback(cb);
    };
    Model.remoteMethod('join', {
        returns: {
            arg: 'result',
            type: 'object'
        },
        description: 'Join and upsert multiple models using ' + Model.modelName + ' as a base.',
        accessType: 'READ',
        accepts: [{
            arg: 'targets',
            type: 'array',
            description: 'The targets objects'
        }, {
            arg: 'opts',
            type: 'object',
            description: 'Options object'
        }],
        http: {
            path: '/join'
        }
    });
};
