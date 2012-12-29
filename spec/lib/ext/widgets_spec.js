define(['aura/aura', 'aura/ext/widgets'], function(aura, ext) {

  'use strict';
  /*global describe:true, it:true, beforeEach: true, sinon: true */

  
  var appsContainer = $('<div>').attr('style', 'display:none');
  $('body').append(appsContainer);

  describe("Widgets Widgets Widgets", function() {

    var env, Widget,
        ext = function(appEnv) { env = appEnv; };

    var yeahWidget = { initialize: sinon.spy(function() { this.html('yeah'); }) };
    define("__widget__$default$yeah", yeahWidget);

    beforeEach(function(done) {
      var app = aura().use(ext),
          containerId = _.uniqueId('widgets_spec_'),
          container   = $("<div/>") .attr('id', containerId)
                                    .html('<div data-aura-widget="dummy"></div><div data-aura-widget="yeah"></div>');
      appsContainer.append(container);

      app.start("#" + containerId).then(function() {
        Widget = env.core.Widgets.Base;
        done();
      });
    });

    describe("Widgets Extension", function() {
      it("Should define the widgets registry and base Widget on core", function() {
        env.core.Widgets.should.be.a('object');
        env.core.Widgets.Base.should.be.a('function');
      });
    });

    describe("Loading Widgets", function() {
      it("Should call the widget's initialize method on start", function() {
        yeahWidget.initialize.should.have.been.called;
      });
    });

    describe("Starting Widgets", function() {

    });

  });



});