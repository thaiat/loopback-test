'use strict';

var _ = require('lodash');
global.Promise = require('bluebird');

var JoinTargetNotFoundError = function JoinTargetNotFoundError() {
    this.message = 'Target instance with id not found for join';
    this.name = 'JoinTargetNotFoundError';
    Error.captureStackTrace(this, JoinTargetNotFoundError);
};
JoinTargetNotFoundError.prototype = Object.create(Error.prototype);
JoinTargetNotFoundError.prototype.constructor = JoinTargetNotFoundError;



var findTargetInstance = Promise.method(function(target, instanceId) {
    if (!instanceId) {
        throw new JoinTargetNotFoundError();
    }
    return target.findByIdAsync(instanceId)
        .then(function(targetInstance) {
            if (!targetInstance) {
                throw new JoinTargetNotFoundError();
            }
            return resolve(targetInstance);
        });
});

var findAllTargets = function(modelInstance, targets, opts) {
    return Promise.map(targets, function(target) {
            return findTargetInstance(target, modelInstance[target.key])
                .catch(function(e) { // catch if we have a JoinTargetNotFoundError while doing a left join
                    return e && e.name === 'JoinTargetNotFoundError' && target.type === 'left';
                }, function(e) {
                    // don't do anything to swallow the error and return undefined
                    // this skips the target
                });
        })
        .then(function(targetInstances) {
            return _.compact(targetInstances);
        });
};

var prepareDestination = function(opts) {
    if (opts.clear) {
        return opts.destination.clearAsync();
    }
    return Promise.resolve({ count: 0 })
};

var joinAndInsert = function(modelInstance, targets, opts) {
    var destPromise = prepareDestination(opts);
    var findAllPromise = findAllTargets(modelInstance, targets, opts);
    return Promise.join(destPromise, findAllPromise, function(cleared, targetInstances) {
            return targetInstances;
        })
        .then(function(targetInstances) {
            return _.reduce(targetInstances, _.defaultsDeep, modelInstance);
        })
        .then(opts.destination.upsertAsync)
        .catch(function(e) { // catch if we have a JoinTargetNotFoundError, this should only be from inner joins
            return e && e.name === 'JoinTargetNotFoundError';
        }, function(e) {
            // don't do anything to swallow the error and return undefined
            // this skips the modelInstance
        });
};
