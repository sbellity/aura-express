define(['aura/aura'], function(Aura) {

  describe("App Public API", function() {
    var core, sandbox;
    var ext = {
      init: sinon.spy(function(appCore) {
        core = appCore;
      }),
      beforeAppStart: sinon.spy(),
      afterAppStart: sinon.spy(),
      sandbox: sinon.spy(function(appSandbox, core) {
        sandbox = appSandbox;
        sandbox.foo = "bar";
      })
    };

    var app = Aura().use(ext);
    var initStatus = app.start();
    var foo = "foo";

    it("Should have loaded its core dependencies", function(done) {
      initStatus.done(function() {
        core.data.deferred.should.be.a('function');
        done();
      });
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
    
    it("Should load its extension and callbacks", function(done) {
      initStatus.done(function() {
        ext.init.should.have.been.called;
        ext.beforeAppStart.should.have.been.called;
        ext.afterAppStart.should.have.been.called;
        ext.sandbox.should.have.been.called;
        done();
      });
    });

    it("Should have extended the sandbox", function(done) {
      initStatus.done(function() {
        sandbox.foo.should.equal('bar');
        done();
      });
    })
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
        ext.should.have.been.calledWith(core);
        insideExt.should.have.been.calledWith('foo');
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
