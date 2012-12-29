var should;
define(['chai', 'sinon', 'sinon_chai', 'mocha'], function(chai, sinon, sinonChai) {

  window.chai         = chai;
  window.expect       = chai.expect;
  window.assert       = chai.assert;
  window.sinonChai    = sinonChai;
  should              = chai.should();

  chai.use(sinonChai);
  mocha.setup('bdd');

  require(['spec/lib/aura_spec'], function() {
    if (window.mochaPhantomJS) mochaPhantomJS.run()
    else mocha.run();
  });
})
