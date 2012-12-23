define(['./base', './ext/pubsub'], function(base, pubsub) {

  var apps = [];

  return (function(config) {

    var core              = Object.create(base);
    var extensions        = [];
    var sandboxExtensions = [];
    var initialized = false;

    function Aura() {
      console.warn("New Aura App", initialized, extensions);
      core.configure(config);
      this.use(pubsub);
    }

    var proto = {};

    proto.use = function(ext) {
      if (initialized) {
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
          if (typeof ext.sandbox === 'function') {
            console.warn("New sandbox extension: ", ext.name);
            sandboxExtensions.push({ name: ext.name, init: ext.sandbox });
          }
          dfd.resolve(initFn(core));
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
      var sandbox = Object.create(base);
      base.util.each(sandboxExtensions, function(i, ext) {
        console.warn("Init new sandbox with ext: ", ext);
        ext.init(sandbox, core);
      });
      return sandbox;
    };

    proto.start = function(el) {
      if (initialized) {
        throw new Error("App already initialized... !");
      }
      this.el = el;
      initialized = base.data.when.apply(undefined, extensions);

      initialized.then(function() {
        console.warn("Really initialized now...", config.name, arguments);
        base.util.extend(this, createSandbox());
        return this;
      }.bind(this));
      initialized.fail(function() {
        console.error("Error initializing app...", config.name, arguments);
      });

    };

    proto.stop = function() {

    };

    Aura.prototype = proto;

    return new Aura();

  });

});
