define(['aura/aura'], function(Aura) {
  describe("App Public API", function() {

    var ext = {
      init: sinon.spy(),
      beforeAppStart: sinon.spy(),
      afterAppStart: sinon.spy()
    };

    var app = Aura().use(ext);
    var initStatus = app.start();
    var foo = "foo";

    it("Should have loaded its core dependencies", function() {
      foo.should.be.a('string');
    });

    it("Should have a public API", function() {
      app.use.should.be.a('function');
      app.start.should.be.a('function');
      app.stop.should.be.a('function');
    });

    it("Should end up starting...", function(done) {
      initStatus.done(function() {
        done();
      });
    });

    it("Should load its extension", function(done) {
      initStatus.done(function() {
        sinon.assert.called(ext.init);
        sinon.assert.called(ext.beforeAppStart);
        sinon.assert.called(ext.afterAppStart);
        done();
      });
    });
  });

  describe("Defining and loading extensions", function() {

    it("Should be able to use extensions defined as objects", function(done) {
      var ext = { init: sinon.spy() };
      Aura().use(ext).start().done(function() {
        sinon.assert.called(ext.init);
        done();
      });
    });

    it("Should be able to use extensions defined as functions", function(done) {
      var core;
      var insideExt = sinon.spy();
      var ext = sinon.spy(function(appCore) {
        core = appCore;
        insideExt("foo");
      });
      Aura().use(ext).start().done(function() {
        sinon.assert.calledWith(ext, core);
        sinon.assert.calledWith(insideExt, "foo");
        done();
      });
    });

    it("Should be able to use extensions defined as amd modules", function(done) {
      var ext = { init: sinon.spy() };
      define("myExtensionModule", ext);
      Aura().use("myExtensionModule").start().done(function() {
        sinon.assert.called(ext.init);
        done();
      });
    });


  });
});
