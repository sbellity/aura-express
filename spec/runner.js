var should;
define(['chai', 'sinon', 'sinon_chai', 'mocha'], function(chai, sinon, sinonChai) {

  window.chai         = chai;
  window.expect       = chai.expect;
  window.assert       = chai.assert;
  window.sinonChai    = sinonChai;
  should              = chai.should();

  chai.use(sinonChai);
  mocha.setup('bdd');


  var specs = [
    'spec/lib/aura_spec',
    'spec/lib/ext/widgets_spec'
  ]

  require(specs, function() {
    if (window.mochaPhantomJS) mochaPhantomJS.run()
    else mocha.run();
  });
})
