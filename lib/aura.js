define(['./base'], function(base) {

  // Utils...
  var _ = base.util._,
      When = base.data.when,
      Deferred = base.data.deferred;

  var slice = Array.prototype.slice,
      apps = [],
      allDeps = { modules: {}, apps: {} };

  window.allDeps = allDeps;


  // Depedencies registry

  function registerDeps(ref, deps) {
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
      if (typeof(fn) === 'function') return fn;
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

  return (function(config) {

    // App Ref
    // Each aura app, created from this constructor gets a unique identifier
    var appRef            = _.uniqueId('aura_');

    // The Application core
    var core              = Object.create(base);

    // The Prototype used by the application to generate new sandboxes
    var sandbox           = Object.create(base);

    function createSandbox() {
      return Object.create(sandbox);
    }

    core.sandbox  = createSandbox;

    // Here we keep track of the app's loading/start status
    var initialized       = Deferred();
    var started           = false;

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
      var dfd = Deferred();
      if (typeof ext === 'string') {
        require([ext], function(ret) {
          dfd.resolve(getVal(ret, core));
        }, function(err) { dfd.reject(err); });
      } else {
        dfd.resolve(getVal(ext, core));
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

    function loadExtension(ext) {
      var dfd       = Deferred(),
          deps      = [];

      requireExtension(ext).then(function(ext) {
        if (!ext) { return dfd.resolve(); }
        if (ext.config && ext.config.require && ext.config.require.paths) {
          try {
            deps = Object.keys(ext.config.require.paths);
          } catch(e) {}
        }
        registerDeps(appRef, deps);
        core.configure(ext.config);
        require(deps, function() {
          getFn(ext, ext.init)(core);
          getFn(ext.sandbox)(sandbox, core);

          var beforeStart = getFn(ext.beforeAppStart)(core),
              afterStart  = getFn(ext.afterAppStart);

          When(beforeStart).done(function() { dfd.resolve(afterStart); });
        }, function(err) {
          console.error("Error loading dep", err);
          dfd.reject(err);
        });
      }).fail(function(err) { dfd.reject(err); });

      return dfd;
    }

    /**
    * Aura constructor and main entry point
    * This is used as a factory to create new apps
    * Loads pubsub & widgets extensiony by default.
    */
    function Aura() {
      core.config = core.configure(config);
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
      if (initialized.state() === 'resolved') {
        throw new Error("You cannot extend an already initialized app !"); // really ?
      }
      registerExtension(ext);
      return this;
    };


    /**
     * Application start.
     * Bootstraps the extensions loading process
     */

    Aura.prototype.start = function(widgets, cb) {
      if (started) {
        console.error("Aura already started... !");
        return initialized;
      }

      started = true;

      var loadingExtensions = Deferred(),
          loadedExtensions;

      // Enforce sequencial loading of extensions...
      // The `loadingExtensions` promise resolves to the actually resolved and loaded extensions...
      (function extLoader(i) {
        if (typeof(i) !== 'number') {
          i = 0;
          loadedExtensions = [];
        }
        if (extensions[i]) {
          ext = loadExtension(extensions[i]);
          w = When(ext);
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
        // Once all the extensions are loaded, we augment the application with its own sandbox
        // that can be used... from the outside world...
        base.util.extend(this, createSandbox());

        // Then we call all the `afterAppStart` provided by the extensions
        base.util.each(exts, function(i, onStart) {
          if (typeof(onStart) === 'function') {
            onStart.call(this, core, widgets);
          }
        });

        // If a callback is provided as an argument of the app.start method, we call it here
        if (typeof cb === 'function') {
          cb.call(this, core, list);
        }

        // Then we finally resolve the main `initialized` promise
        initialized.resolve(this);
      }.bind(this));

      // If there was an error in the boot sequence we reject every body an do some cleanup
      // TODO: Provide a better error message to the user.
      loadingExtensions.fail(function() {
        initialized.reject("Error initializing app...", config.name, arguments);
        this.stop();
      }.bind(this));

      // Finally... we return a promise that allows to keep track of the loading process...
      return initialized;
    };

    /**
     * Stops the application and unregister its loaded dependencies.
     * TODO: We need to do a little more cleanup here...
     * @return {[type]} [description]
     */
    Aura.prototype.stop = function() {
      started = false;
      initialized = Deferred();
      unregisterDeps(appRef, Object.keys(allDeps.apps[appRef]));
    };

    return new Aura();

  });

});
