define('aura/ext/debug', {

  init: function(core, initStatus) {
    console.warn("Debug", arguments);
    initStatus.progress(function(level, msg) {
      var logFn = console[level] || console.log || function(){};
      var args = [['Init Status']].concat(Array.prototype.slice.call(arguments, 1));
      logFn.apply(console, args);
    })
  },
  beforeAppStart: function(core, initStatus) {

  },
  afterAppStart: function(core) {
    console.warn("App Started");
  }



});
