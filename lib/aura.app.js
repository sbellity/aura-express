define([
  './aura.extensions'
  ], function(Ext) {

  /**
  * Aura constructor and main entry point
  * This is used as a factory to create new apps
  * Loads mediator & widgets extensiony by default.
  */
  function App() {
    this.ref = env.appRef;
    env.config = (base.configure(config) || {});
    env.config.widgets = (env.config.widgets || {});
    env.config.widgets.sources = (env.config.widgets.sources || { "default" : "widgets" });
    if (env.config.debug) {
      this.use('aura/ext/debug');
    }
    this.use('aura/ext/mediator');
    this.use('aura/ext/widgets');
    return this;
  }

  /**
   * Tells the app to init with the given extension.
   *
   * This method can only be called before the app is actually started.
   *
   * @param  {String|Object|Function} ext the reference of the extension
   * @return {Aura}   the Aura app object
   */
  App.prototype.use = function(ext) {
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
  App.prototype.registerWidgetsSource = 
    env.core.registerWidgetsSource = function(name, baseUrl) {
    if (env.config.widgets.sources[name]) {
      throw new Error("Widgets source '" + name + "' is already registered");
    }
    env.config.widgets.sources[name] = baseUrl;
    return this;
  };


  /**
   * Application start.
   * Bootstraps the extensions loading process
   * @return {Promise} a promise that resolves when the app is started
   */
  App.prototype.start = function(options) {
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

      // If a callback is provided as an argument 
      // of the app.start method, we call it here
      if (typeof env.options.onInit === 'function') {
        env.options.onInit.call(self, env);
      }

      // Once all the extensions are loaded, we augment 
      // the application with its own sandbox
      // that can be used... from the outside world...
      base.util.extend(self, createSandbox());

      // Then we finally resolve the main `initStatus` promise
      env.initStatus.resolve(self);
    });

    // If there was an error in the boot sequence we 
    // reject every body an do some cleanup
    // TODO: Provide a better error message to the user.
    loadingExtensions.fail(function() {
      env.initStatus.reject("Error initializing app...", env.config.name, arguments);
      self.stop();
    });

    // Finally... we return a promise that allows 
    // to keep track of the loading process...
    return env.initStatus;
  };


  /**
   * Stops the application and unregister its loaded dependencies.
   * TODO: We need to do a little more cleanup here...
   * @return {void}
   */
  App.prototype.stop = function() {
    env.started = false;
    env.initStatus = deferred();
    unregisterDeps(env.appRef, Object.keys(allDeps.apps[env.appRef] || {}));
  };


  return App;
});
