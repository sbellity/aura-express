define(['./base'], function(base) {
  'use strict';

  // Utils...
  var _ = base.util._,
      when = base.data.when,
      deferred = base.data.deferred;

  var slice = Array.prototype.slice,
      apps = [],
      allDeps = { modules: {}, apps: {} };

  // Depedencies registry

  function registerDeps(ref, deps) {
    var depName;
    for (var d in deps) {
      depName = deps[d];
      if (typeof depName === 'string') {
        allDeps.modules[depName] = allDeps.modules[depName] || {};
        allDeps.modules[depName][ref] = 1;
        allDeps.apps[ref]           = allDeps.apps[ref] || {};
        allDeps.apps[ref][depName]  = 1;
      }
    }
  }

  function unregisterDeps(ref, deps) {
    var depName;
    for (var d in deps) {
      depName = deps[d];
      if (allDeps.modules[depName]) {
        delete allDeps.modules[depName][ref];
        delete allDeps.apps[ref][depName];
        if (Object.keys(allDeps.modules[depName]).length === 0) {
          delete allDeps.modules[depName];
          require.undef(depName);
        }
      }
    }
  }

  /*!
   * Various handy helpers...
   */
   var noop = function() {};

   /*!
   * Helper function that returns the first function found among its arguments.
   * If no function if found, it return a noop (empty function).
   *
   * @return {[type]} [description]
   */
  function getFn() {
    var funcs = slice.call(arguments), fn;
    for (var f=0, l=funcs.length; f < l; f++) {
      fn = funcs[f];
      if (typeof(fn) === 'function') { return fn; }
    }
    return noop;
  }

  /*!
   * If the value of the first argument is a function then invoke it with the rest of the args.
   * otherwise, return it.
   */
  function getVal(val) {
    if (typeof val === 'function') {
      return val.apply(undefined, slice.call(arguments, 1));
    } else {
      return val;
    }
  }

  // The actual application core

  return function(config) {

    var env = {};

    // App Ref
    // Each aura app, created from this constructor gets a unique identifier
    env.appRef            = _.uniqueId('aura_');

    // The Application core
    env.core              = Object.create(base);

    // The Prototype used by the application to generate new sandboxes
    env.sandbox = Object.create(base);

    function createSandbox() {
      return Object.create(env.sandbox);
    }

    env.core.createSandbox  = createSandbox;

    // Here we keep track of the app's loading/start status
    env.initStatus = deferred();
    env.started    = false;

    /*!
    * The registry of the application's extensions.
    * Ensures that an extension can only be added once.
    *
    * @param {String|Object|Function} ext the reference of the extension
    */
    var extensions = [];
    function registerExtension(ext) {
      if (_.include(extensions, ext)) {
        console.error(ext, " is already registered. Extensions can only be used once.");
        return;
      }
      env.initStatus.notify('info', 'registered', ext);
      extensions.push(ext);
      return ext;
    }


    /*!
    * Extension resolution before actual loading.
    * If `ext` is a String, it is considered as a reference
    * to an AMD module that has to be loaded.
    *
    * This method returns a promise that resolves to the actual extension.
    *
    * @param {String|Object|Function} ext the reference of the extension
    */

    function requireExtension(ext) {
      var dfd = deferred();
      if (typeof ext === 'string') {
        var extRef = ext;
        require([ext], function(ext) {
          dfd.resolve(getVal(ext, env));
        }, function(err) {
          dfd.reject(err);
        });
      } else {
        dfd.resolve(getVal(ext, env));
      }
      return dfd;
    }

    /*!
     * Actual extension loading.
     *
     * The sequence is:
     *
     * * resolves the extension reference
     * * register and requires its dependencies if any
     * * init the extension
     * * augment the `sandbox` prototype
     * * setup the extensions's lifecycle callbacks (beforeAppStart, afterAppStart)
     *
     * This method also returns a promise that allows
     * to keep track of the app's loading sequence.
     *
     * If the extension provides a `afterAppStart` method,
     * the promise will resolve to that function that
     * will be called at the end of the app loading sequence.
     *
     * @param {String|Object|Function} ext the reference of the extension
     */

    function loadExtension(extRef, env) {
      var dfd       = deferred(),
          deps      = [];

      requireExtension(extRef).then(function(ext) {

        env.initStatus.notify('info', 'resolved', extRef);


        if (!ext) { return dfd.resolve(); }

        var extConfig = getVal(ext.config) || {};

        if (extConfig.require && extConfig.require.paths) {
          try {
            deps = Object.keys(extConfig.require.paths);
          } catch(e) {}
        }

        registerDeps(env.appRef, deps);
        base.configure(extConfig);


        require(deps, function() {

          var init = getFn(ext, ext.init)(env);

          when(init).done(function() {
            dfd.resolve(function() { getFn(ext.afterAppStart)(env); });
          });
        }, function(err) {
          console.error("Error loading dep", err);
          env.initStatus.notify('error', 'rejected', extRef, err);
          dfd.reject(err);
        });
      }).fail(function(err) {
        env.initStatus.notify('error', 'rejected', extRef, err);
        dfd.reject(err);
      });

      return dfd;
    }

    /**
    * Aura constructor and main entry point
    * This is used as a factory to create new apps
    * Loads pubsub & widgets extensiony by default.
    */
    function Aura() {
      this.ref = env.appRef;
      env.config = base.configure(config) || {};
      env.config.widgetSources = env.config.widgetSources || { "default" : ( env.config.widgets || "widgets" ) };
      if (env.config && env.config.debug) {
        this.use('aura/ext/debug');
      }
      this.use('aura/ext/pubsub');
      this.use('aura/ext/widgets');
    }

    /**
     * Tells the app to init with the given extension.
     *
     * This method can only be called before the app is actually started.
     *
     * @param  {String|Object|Function} ext the reference of the extension
     * @return {Aura}   the Aura app object
     */
    Aura.prototype.use = function(ext) {
      if (env.initStatus.state() === 'resolved') {
        throw new Error("You cannot extend an already initialized app !"); // really ?
      }
      registerExtension(ext);
      return this;
    };


    /**
     * Adds a new source for widgets
     * 
     * @param {String} name    the name of the source
     * @param {String} baseUrl the base url for those widgets
     */
    Aura.prototype.addWidgetsSource = function(name, baseUrl) {
      env.config.widgetSources[name] = baseUrl;
      return this;
    };


    /**
     * Application start.
     * Bootstraps the extensions loading process
     * @return {Promise} a promise that resolves when the app is started
     */
    Aura.prototype.start = function(options) {
      if (env.started) {
        console.error("Aura already started... !");
        return env.initStatus;
      }

      env.options = options || {};

      env.started = true;

      var self = this,
          loadingExtensions = deferred(),
          loadedExtensions;

      // Enforce sequencial loading of extensions...
      // The `loadingExtensions` promise resolves to the actually resolved and loaded extensions...
      (function extLoader(i) {
        if (typeof(i) !== 'number') {
          i = 0;
          loadedExtensions = [];
        }
        if (extensions[i]) {
          var ext = loadExtension(extensions[i], env),
              w = when(ext);

          w.then(function(e) {
            loadedExtensions[i] = e;
            extLoader(i+1);
          });
          w.fail(function() {
            loadingExtensions.reject();
          });
        } else {
          loadingExtensions.resolve(loadedExtensions);
        }
      })();

      loadingExtensions.then(function(exts) {

        // Then we call all the `afterAppStart` provided by the extensions
        base.util.each(exts, function(i, onStart) {
          if (typeof(onStart) === 'function') {
            onStart();
          }
        });

        // If a callback is provided as an argument of the app.start method, we call it here
        if (typeof env.options.onInit === 'function') {
          env.options.onInit.call(self, env);
        }

        // Once all the extensions are loaded, we augment the application with its own sandbox
        // that can be used... from the outside world...
        base.util.extend(self, createSandbox());

        // Then we finally resolve the main `initStatus` promise
        env.initStatus.resolve(self);
      });

      // If there was an error in the boot sequence we reject every body an do some cleanup
      // TODO: Provide a better error message to the user.
      loadingExtensions.fail(function() {
        env.initStatus.reject("Error initializing app...", config.name, arguments);
        self.stop();
      });

      // Finally... we return a promise that allows to keep track of the loading process...
      return env.initStatus;
    };

    /**
     * Stops the application and unregister its loaded dependencies.
     * TODO: We need to do a little more cleanup here...
     * @return {void}
     */
    Aura.prototype.stop = function() {
      env.started = false;
      env.initStatus = deferred();
      unregisterDeps(env.appRef, Object.keys(allDeps.apps[env.appRef] || {}));
    };

    return new Aura();

  };

});
