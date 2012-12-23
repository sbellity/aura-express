define({

  name: 'widgets',

  init: function(core) {
    core.start = function(list) {
      console.warn("Core start !", list)
    }
  },

  beforeAppStart: function(core) {
  },

  afterAppStart: function(core) {
    console.warn("Start from Widgets extension !");
    core.start('YEAH !')
  },

  sandbox: function() {
    console.warn("Sandbox from widgets extension....");
  }
});