define(['./base', './ext/pubsub'], function(base, pubsub) {

  var slice = Array.prototype.slice;

  var apps = [];

  return (function(config) {
    var core              = Object.create(base);
    var sandbox           = Object.create(base);

    var extensions        = [];
    var sandboxExtensions = [];
    var initialized       = base.data.deferred();
    var started           = false;

    function Aura() {
      core.configure(config);
      this.use(pubsub);
    }

    var proto = {};

    proto.use = function(ext) {
      if (initialized.state() === 'resolved') {
        throw new Error("You cannot extend an already initialized app !");
      }

      var initFn = function() {};

      if (typeof ext === 'function') {
        initFn = ext;
      } else if (typeof ext.init === 'function') {
        initFn = ext.init;
      }

      core.configure(ext.config);

      if (ext.config && ext.config.require && ext.config.require.paths) {
        var dfd   = base.data.deferred();
        require(Object.keys(ext.config.require.paths), function() {
          var onStart = initFn(core);
          if (typeof ext.sandbox === 'function') {
            ext.sandbox(sandbox, core);
          }
          dfd.resolve(ext.start);
        }, function(err) {
          console.warn("Error loading dep", err);
          dfd.reject(err);
        });

        extensions.push(dfd);

      } else {
        initFn(core);
      }

      return this;
    };

    function createSandbox() {
      return Object.create(sandbox);
    };

    proto.sandbox = createSandbox;
    core.sandbox  = createSandbox;

    proto.start = function(el, cb) {
      if (started) {
        console.warn("Aura already started... !");
        return initialized;
      }

      started = true;
      this.el = el;

      var loadingExtensions = base.data.when.apply(undefined, extensions);

      loadingExtensions.then(function() {
        base.util.extend(this, createSandbox());
        base.util.each(slice.call(arguments), function(i, onStart) {
          if (onStart && typeof(onStart) === 'function') {
            onStart.call(this, core);
          }
        });
        if (typeof cb === 'function') {
          cb.call(this, core);
        }
        initialized.resolve(core);
      }.bind(this));

      loadingExtensions.fail(function() {
        initialized.reject("Error initializing app...", config.name, arguments);
      });

      return initialized;
    };

    proto.stop = function() {

    };

    Aura.prototype = proto;

    return new Aura();

  });

});
