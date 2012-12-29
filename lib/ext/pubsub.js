define('aura/ext/pubsub', function() {

  'use strict';
  
  return {

    name: 'pubsub',

    config: {
      require: { paths: { eventemitter: 'eventemitter2/lib/eventemitter2' } }
    },

    init: function(env) {
      var EventEmitter    = require('eventemitter');
      var pubsub          = new EventEmitter(env.options.pubsub);
      env.core.pubsub     = pubsub;
      env.sandbox.on      = function() { pubsub.on.apply(pubsub, arguments); };
      env.sandbox.off     = function() { pubsub.off.apply(pubsub, arguments); };
      env.sandbox.emit    = function() { pubsub.emit.apply(pubsub, arguments); };
    }
  };
});
