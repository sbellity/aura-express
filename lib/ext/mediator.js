define('aura/ext/mediator', function() {

  'use strict';
  
  return {

    name: 'mediator',

    require: { paths: { eventemitter: 'components/eventemitter2/lib/eventemitter2' } },
  
    init: function(app) {
      var EventEmitter    = require('eventemitter');
      var mediator        = new EventEmitter(app.options.mediator);
      app.core.mediator   = mediator;
      app.sandbox.on      = function() { mediator.on.apply(mediator, arguments); };
      app.sandbox.off     = function() { mediator.off.apply(mediator, arguments); };
      app.sandbox.emit    = function() { mediator.emit.apply(mediator, arguments); };
    }
  };
});
