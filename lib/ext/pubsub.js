define('aura/ext/pubsub', {
  name: 'pubsub',

  config: {
    require: { paths: { eventemitter: 'eventemitter2/lib/eventemitter2' } }
  },

  init: function(core) {
    var EventEmitter = require('eventemitter');
    core.pubsub      = new EventEmitter();
  },

  beforeAppStart: function() {},

  afterAppStart: function() {},

  sandbox: function(sandbox, core) {
    sandbox.on      = function() { core.pubsub.on.apply(core.pubsub, arguments); };
    sandbox.off     = function() { core.pubsub.off.apply(core.pubsub, arguments); };
    sandbox.emit    = function() { core.pubsub.emit.apply(core.pubsub, arguments); };
  }

});
