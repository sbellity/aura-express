define(['aura/aura'], function(Aura) {
  describe("Aura Public API", function() {

    var ext = {
      init: sinon.spy(),
      beforeAppStart: sinon.spy(),
      afterAppStart: sinon.spy()
    };

    var app = Aura({ debug: true }).use(ext);
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
});
