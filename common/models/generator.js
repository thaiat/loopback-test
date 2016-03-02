'use strict';

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
            accepts: { arg: 'config', type: 'object' },
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
