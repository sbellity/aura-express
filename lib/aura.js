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
        allDeps.apps[ref]             = allDeps.apps[ref] || {};
        allDeps.apps[ref][depName]    = 1;
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


  // The actual application core

  return function(config) {

    var env     = {};

    // App Ref
    // Each aura app, created from this constructor gets a unique identifier
    env.appRef  = _.uniqueId('aura_');

    // The Application core
    env.core    = Object.create(base);

    // The Prototype used by the application to generate new sandboxes
    env.sandbox = Object.create(base);

    function createSandbox() {
      return Object.create(env.sandbox);
    }

    env.core.createSandbox  = createSandbox;

    // Here we keep track of the app's loading/start status
    env.initStatus = deferred();
    env.started    = false;

  }

});
