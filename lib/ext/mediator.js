define('aura/ext/mediator', function() {

  'use strict';
  
  return {

    name: 'mediator',

    require: { paths: { eventemitter: 'components/eventemitter2/lib/eventemitter2' } },
  
    init: function(env) {
      var EventEmitter    = require('eventemitter');
      var mediator        = new EventEmitter(env.options.mediator);
      env.core.mediator   = mediator;
      env.sandbox.on      = function() { mediator.on.apply(mediator, arguments); };
      env.sandbox.off     = function() { mediator.off.apply(mediator, arguments); };
      env.sandbox.emit    = function() { mediator.emit.apply(mediator, arguments); };
    }
  };
});
