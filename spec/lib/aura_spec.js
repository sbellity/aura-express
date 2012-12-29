define(['aura/aura'], function(aura) {

  'use strict';
  /*global describe:true, it:true, before: true, sinon: true, assert: true, should: true */

  describe("Aura Main", function() {
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

      var app = aura().use(ext);
      var initStatus = app.start([]);

      // Make sure the app is started before...
      before(function(done) {
        initStatus.then(function() {
          done();
        });
      });

      it("Should have loaded its core dependencies", function() {
        core.data.deferred.should.be.a('function');
      });

      it("Should have a public API", function() {
        app.use.should.be.a('function');
        app.start.should.be.a('function');
        app.stop.should.be.a('function');
      });
        
      it("Should load its extension and callbacks", function() {
        ext.init.should.have.been.called;
        ext.beforeAppStart.should.have.been.called;
        ext.afterAppStart.should.have.been.called;
        ext.sandbox.should.have.been.called;
      });

      it("Should have extended the sandbox", function() {
        sandbox.foo.should.equal('bar');
      });

      it("Should complain if I try to use a new extension and the app is already started", function() {
        // initStatus.done()
      });
    });

    describe("Defining and loading extensions", function() {

      it("Should be able to use extensions defined as objects", function(done) {
        var ext = { init: sinon.spy() };
        aura().use(ext).start([]).done(function() {
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
        aura().use(ext).start([]).done(function() {
          ext.should.have.been.calledWith(core);
          insideExt.should.have.been.calledWith('foo');
          done();
        });
      });

      it("Should be able to use extensions defined as amd modules", function(done) {
        var ext = { init: sinon.spy() };
        define("myExtensionModule", ext);
        aura().use("myExtensionModule").start([]).done(function() {
          sinon.assert.called(ext.init);
          done();
        });
      });
    });
  });
});
