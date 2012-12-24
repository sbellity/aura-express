define(['./base', './ext/pubsub', './ext/widgets'], function(base, pubsub, widgets) {

  var appCounter = 0,
      slice = Array.prototype.slice,
      noop = function() {},
      apps = [],
      allDeps = { modules: {}, apps: {} };

  function registerDeps(ref, deps) {
    for (d in deps) {
      depName = deps[d];
      console.warn("Registering dep: ", depName, deps)
      if (typeof depName === 'string') {
        allDeps.modules[depName] = allDeps.modules[depName] || {};
        allDeps.modules[depName][ref] = 1;

        allDeps.apps[ref]           = allDeps.apps[ref] || {};
        allDeps.apps[ref][depName]  = 1;
      }
    }
  }

  function unregisterDeps(ref, deps) {
    for (d in deps) {
      depName = deps[d];
      if (allDeps.modules[depName]) {
        delete allDeps.modules[depName][ref];
        delete allDeps.apps[ref][depName];
        if (Object.keys(allDeps.modules[depName]).length == 0) {
          delete allDeps.modules[depName];
          require.undef(depName);
        }
      }
    }
  }

  window.allDeps = allDeps;

  function getFn() {
    var funcs = slice.call(arguments), fn;
    for (var f=0, l=funcs.length; f < l; f++) {
      fn = funcs[f];
      if (typeof(fn) === 'function') return fn;
    }
    return noop;
  }

  window.getFn = getFn;

  return (function(config) {
    var appRef            = appCounter++;
    var core              = Object.create(base);
    var sandbox           = Object.create(base);

    var extensions        = [];
    var initialized       = base.data.deferred();
    var started           = false;


    function Aura() {
      core.configure(config);
      this.use(pubsub);
      this.use(widgets);
    }

    var proto = {};

    function registerExtension(ext) {
      extensions.push(ext);
      return ext;
    };

    function loadExtension(ext) {
      var dfd       = base.data.deferred(),
          deps      = [];

      if (typeof ext === 'function') { ext = ext(core) || {} }

      if (ext.config && ext.config.require && ext.config.require.paths) {
        try {
          deps = Object.keys(ext.config.require.paths);
        } catch(e) {};
      }

      registerDeps(appRef, deps);

      core.configure(ext.config);

      require(deps, function() {
        getFn(ext, ext.init)(core);
        getFn(ext.sandbox)(sandbox, core);
        var beforeStart = base.data.when(getFn(ext.beforeAppStart)(core));
        beforeStart.done(function() { dfd.resolve(getFn(ext.afterAppStart)) });
      }, function(err) {
        console.warn("Error loading dep", err);
        dfd.reject(err);
      });

      return dfd;
    }

    proto.use = function(ext) {
      if (initialized.state() === 'resolved') {
        throw new Error("You cannot extend an already initialized app !");
      }
      registerExtension(ext);
      return this;
    };

    function createSandbox() {
      return Object.create(sandbox);
    }

    proto.sandbox = createSandbox;
    core.sandbox  = createSandbox;

    proto.start = function(widgets, cb) {
      if (started) {
        console.warn("Aura already started... !");
        return initialized;
      }

      started = true;

      var extensionsToLoad = [];

      for (var i=0, l = extensions.length; i < l; i++) {
        extensionsToLoad.push(loadExtension(extensions[i]));
      }

      var loadingExtensions = base.data.when.apply(undefined, extensionsToLoad);

      loadingExtensions.then(function() {
        base.util.extend(this, createSandbox());
        base.util.each(slice.call(arguments), function(i, onStart) {
          if (typeof(onStart) === 'function') {
            onStart.call(this, core, widgets);
          }
        });
        if (typeof cb === 'function') {
          cb.call(this, core, list);
        }
        initialized.resolve(core);
      }.bind(this));

      loadingExtensions.fail(function() {
        initialized.reject("Error initializing app...", config.name, arguments);
        this.stop();
      }.bind(this));

      return initialized;
    };

    proto.stop = function() {
      started = false;
      initialized = base.data.deferred();
      unregisterDeps(appRef, Object.keys(allDeps.apps[appRef]));
    };

    Aura.prototype = proto;

    return new Aura();

  });

});
