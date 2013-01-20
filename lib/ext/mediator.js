define('aura/ext/mediator', function() {

  'use strict';

  return {

    name: 'mediator',

    config: {
      require: { paths: { eventemitter: 'eventemitter2/lib/eventemitter2' } }
    },

    init: function(env) {
      var EventEmitter    = require('eventemitter');
      var mediatorConfig  = env.config.mediator || { wildcard: true, delimiter: ".", maxListeners: 20, newListener: true };
      var mediator        = new EventEmitter(mediatorConfig);
      env.core.mediator   = mediator;
      env.sandbox.on      = function() { mediator.on.apply(mediator, arguments); };
      env.sandbox.off     = function() { mediator.off.apply(mediator, arguments); };
      env.sandbox.emit    = function() { mediator.emit.apply(mediator, arguments); };
    }
  };
});
