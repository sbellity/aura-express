define(['aura/aura.extensions'], function(ExtManager) {

  'use strict';
  /*global describe:true, it:true, before: true, sinon: true */

  describe("ExtManager", function() {

    it("should be a constructor", function() {
      ExtManager.should.be.a('function');
    });


    describe("ExtManager.prototype", function() {

      var proto = ExtManager.prototype;

      it("should have a init function", function() {
        proto.init.should.be.a('function');
      });

      it("should have a add function", function() {
        proto.add.should.be.a('function');
      });

      it("should have a onReady function", function() {
        proto.onReady.should.be.a('function');
      });

      it("should have a onFailure function", function() {
        proto.onFailure.should.be.a('function');
      });

    });

    describe("Adding extensions", function() {

      it("Should be possible to add extensions", function(done) {
        var mgr = new ExtManager(),
            ext1 = { ref: sinon.spy(), context: "ext1" }, ext2 = { ref: sinon.spy(), context: "ext2" };
        
        mgr.add(ext1);
        mgr.add(ext2);

        var init = mgr.init();
        init.done(function() {
          ext1.ref.should.have.been.calledWith(ext1.context);
          ext2.ref.should.have.been.calledWith(ext2.context);
          done();
        });
      });

      it("Should not be possible to add an extension twice", function() {
        var mgr = new ExtManager(),
            ext = { ref: sinon.spy(), context: '123' };
        var addExt = function() { mgr.add(ext); };
        addExt();
        addExt.should.Throw(Error);
      });

      it("Should be possible to add an extension via its module ref name", function(done) {
        var mgr = new ExtManager(),
            ext = { init: sinon.spy(), foo: "bar" };

        define("myExt", ext);
        mgr.add({ ref: "myExt", context: "yep" });
        mgr.init().done(function(extResolved) {
          ext.init.should.have.been.calledWith("yep");
          extResolved.foo.should.equal("bar");
          done();
        });
      });

      it("Should call onReady callbacks when all extensions have been loaded", function(done) {
        var mgr   = new ExtManager(),
            ctx   = {},
            ready = sinon.spy();
        define("ext1", { init: function(c) { c.one = true; } });
        define("ext2", { init: function(c) { c.two = true; } });
        mgr.add({ ref: "ext1", context: ctx });
        mgr.add({ ref: "ext2", context: ctx });
        mgr.onReady(ready);
        mgr.init().done(function() {
          ready.should.have.been.called;
          done();
        });
      });

    });


  });

});