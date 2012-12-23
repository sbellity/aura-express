define(['./base', './ext/pubsub'], function(base, pubsub) {

  return (function() {

    var core        = Object.create(base);
    var extensions  = [];
    var started     = false;

    function Aura(config) {
      core.configure(config);
      this.use(pubsub);
    }

    var proto = {};

    proto.use = function(ext) {
      if (started) {
        throw new Error("You cannot extend an already started app !");
      }

      var initFn = function() {};

      if (typeof ext === 'function') {
        initFn = ext;
      } else if (typeof ext.init === 'function') {
        initFn = ext.init;
      }

      core.configure(ext.config);

      if (ext.config && ext.config.require && ext.config.require.paths) {
        if (ext.config.require && ext.config.require.paths) {
          var dfd   = base.data.deferred();
          require(Object.keys(ext.config.require.paths), function() {
            dfd.resolve(initFn(core));
          }, function(err) {
            console.warn("Error loading dep", err);
            dfd.reject(err);
          });
          extensions.push(dfd);
        }
      } else {
        initFn(core);
      }

      return this;
    };

    proto.start = function(el) {
      if (started) {
        throw new Error("App already started... !");
      }
      this.el = el;
      started = base.data.when.apply(undefined, extensions);

      started.then(function() {
        console.warn("Really started now...", arguments);
      });
      started.fail(function() {
        console.error("Error starting app...", arguments);
      });
      return this;
    };

    proto.stop = function() {

    };

    Aura.prototype = proto;

    return Aura;

  })();

});
