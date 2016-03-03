'use strict';

var _ = require('lodash');

module.exports = function(Generator) {
    Generator.createModel = function(config, cb) {
        var modelName = config.name;
        delete config.name;
        var datasourceName = config.ds || 'db';
        delete config.ds;
        var properties = config.properties;
        delete config.properties;


        var ds = Generator.app.datasources[datasourceName];

        var Model = ds.createModel(modelName, properties, config);
        Generator.app.model(Model);

        ds.automigrate(Model.modelName, function(err) {
            if (err) {
                cb(err);
            } else {
                cb(null, 'Successfully created ' + Model.modelName);
            }
        });

    }

    Generator.remoteMethod(
        'createModel', {
            accepts: {
                arg: 'config',
                type: 'object',
                description: 'Config should contain a modelName, ds, properties, and any other model creation options'
            },
            returns: {
                arg: 'result',
                type: 'string',
                root: true
            },
            http: {
                verb: 'post'
            }
        }
    );

    Generator.createView = function(config, cb) {
        var datasourceName = config.ds || 'db';
        delete config.ds;
        var params = config.params || [];
        delete config.params;
        var viewName = config.viewName;
        delete config.viewName;
        var query = config.query
        delete config.query;

        var ds = Generator.app.datasources[datasourceName];

        if (_.isFunction(ds.connector.executeSQL)) {   
            var dropQuery = 'DROP VIEW ' + viewName;
            var createQuery = 'CREATE VIEW ' + viewName + ' AS ' + query + ';';         
            ds.connector.executeSQL(dropQuery, params, {}, function(err, result) {
                ds.connector.executeSQL(createQuery, params, {}, cb);
            });
        } else {
            cb(new Error('DataSource ' + datasourceName + '\'s connector does not have an executeSQL method for executing this view.'))
        }

    }

    Generator.remoteMethod(
        'createView', {
            accepts: {
                arg: 'config',
                type: 'object',
                description: 'Config should contain a viewName, ds, query, params'
            },
            returns: {
                arg: 'result',
                type: 'string',
                root: true
            },
            http: {
                verb: 'post'
            }
        }
    );

    Generator.executeQuery = function(config, cb) {
        var datasourceName = config.ds || 'db';
        delete config.ds;
        var params = config.params || [];
        delete config.params;
        var query = config.query
        delete config.query;

        var ds = Generator.app.datasources[datasourceName];

        if (_.isFunction(ds.connector.executeSQL)) {   
            var View = ds.connector.executeSQL(query, params, {}, cb);
        } else {
            cb(new Error('DataSource ' + datasourceName + '\'s connector does not have an executeSQL method for executing this view.'))
        }

    }

    Generator.remoteMethod(
        'executeQuery', {
            accepts: {
                arg: 'config',
                type: 'object',
                description: 'Config should contain a ds, query, params'
            },
            returns: {
                arg: 'result',
                type: 'string',
                root: true
            },
            http: {
                verb: 'post'
            }
        }
    );


};
