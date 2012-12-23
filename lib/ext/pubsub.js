define(function() {

  var ext = { name: 'pubsub', config: {} };

  ext.config.require = { paths: { eventemitter: 'eventemitter2/lib/eventemitter2' } };

  ext.init = function(core) {
    var EventEmitter = require('eventemitter');
    core.pubsub      = new EventEmitter();
    return core;
  };

  ext.sandbox = function(sandbox, core) {
    sandbox.on    = core.pubsub.on;
    sandbox.off   = core.pubsub.off;
    sandbox.emit  = core.pubsub.emit;
    return sandbox;
  };

  return ext;

});
