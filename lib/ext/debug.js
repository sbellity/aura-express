define('aura/ext/debug', function() {

  'use strict';
  
  return {
    init: function(env) {
      env.initStatus.progress(function(level, msg) {
        var logFn = console[level] || console.log || function(){};
        var args = [['Init Status']].concat(Array.prototype.slice.call(arguments, 1));
        logFn.apply(console, args);
      });
    }
  };
});
