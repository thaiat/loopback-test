module.exports = function(Model, options) {
    console.log('applying time-stamp');
    // Model is the model class
    // options is an object containing the config properties from model definition
    Model.defineProperty('created', { type: Date, default: '$now' });
    Model.defineProperty('modified', { type: Date, default: '$now' });
};