define({
  name: 'pubsub',

  config: {
    require: { paths: { eventemitter: 'eventemitter2/lib/eventemitter2' } }
  },

  init: function(core) {
    var EventEmitter = require('eventemitter');
    core.pubsub      = new EventEmitter();
  },

  start: function() {
    console.warn("pubsub onStart !");
  },

  sandbox: function(sandbox, core) {
    sandbox.on    = core.pubsub.on;
    sandbox.off   = core.pubsub.off;
    sandbox.emit  = core.pubsub.emit;
  }

});
