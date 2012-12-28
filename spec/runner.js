define(function() {
  mocha.setup('bdd');
  require(['spec/lib/aura_spec'], function() {
    mocha.setup('bdd');
    mocha.run();
  });
});