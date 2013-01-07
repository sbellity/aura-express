define(['require'], function(require) {
  
  var deferred = $.Deferred,
      when     = $.when,
      noop     = function() {},
      freeze   = Object.freeze || noop;

  /*!
   * If the value of the first argument is a function then invoke 
   * it with the rest of the args, otherwise, return it.
   */
  function getVal(val) {
    if (typeof val === 'function') {
      return val.apply(undefined, slice.call(arguments, 1));
    } else {
      return val;
    }
  };

  /**
   * Anatomy of an extension...
   * 
   */

  function ExtManager(env, config) {
    this.env          = env;
    this.require      = require(config);
    this._extensions  = [];
    this._state       = deferred();
  };

  // Public API

  ExtManager.prototype.add = function(ext) {
    this._extensions.push(ext);
    return this;
  };

  ExtManager.prototype.onReady = function(cb) {
    this._state.done(cb);
  };

  ExtManager.prototype.init = function() {
    var extensions    = this._extensions.slice(0),
        extRef        = extensions.shift(),
        initialized   = [];
    while (extRef) {
      initializing.push(this._initExtension(extRef));
      extRef = extensions.shift();
    }
    return when(initialized);
  };

  // Private API

  /*!
  * Extension resolution before actual loading.
  * If `ext` is a String, it is considered as a reference
  * to an AMD module that has to be loaded.
  *
  * This method returns a promise that resolves to the actual extension.
  *
  * @param {String|Object|Function} ext the reference of the extension
  */

  function requireExtension = function(require, ext) {
    var dfd = deferred(),
        env = this.env;
    
    var resolve = function(ext) {
      try {
        ext = getVal(ext, env);
        if (ext.require && ext.require.paths) {
          var deps = Object.keys(ext.require.paths);
          require.config(ext.require);
          require(deps, function() { dfd.resolve(ext); });
        } else {
          dfd.resolve(ext);
        }        
      } catch(err) {
        reject(err);
      }
    };

    var reject = function(err) { 
      dfd.reject(err); 
    };

    if (typeof ext === 'string') {
      require([ext], resolve, reject);
    } else {
      resolve(ext);
    }

    return dfd;
  };

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

  ExtManager.prototype._initExtension = function(require, extRef) {

    var dfd       = deferred(),
        deps      = [];

    this._requireExtension(extRef).then(function(ext) {

      if (!ext) { return dfd.resolve(); }

      var extConfig = getVal(ext.config) || {};

      if (extConfig.require && extConfig.require.paths) {
        try {
          deps = Object.keys(extConfig.require.paths);
        } catch(e) {}
      }

      registerDeps(env.appRef, deps);

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


  return ExtManager;
});