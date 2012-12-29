define(['aura/aura', 'aura/ext/widgets'], function(aura, ext) {

  'use strict';
  /*global describe:true, it:true, beforeEach: true, before: true, alert: true, sinon: true */

  
  var appsContainer = $('<div>').attr('style', 'display:none');
  $('body').append(appsContainer);

  function buildAppMarkup(markup) {
    var containerId = _.uniqueId('widgets_spec_'),
        container   = $("<div/>").attr('id', containerId).html(markup);
    appsContainer.append(container);
    return container;
  }

  describe("Widgets Widgets Widgets", function() {

    var env, BaseWidget,
        ext = function(appEnv) { env = appEnv; };

    var yeahWidget = { initialize: sinon.spy(function() { this.html('yeah'); }) };
    define("__widget__$default$yeah", yeahWidget);

    describe("Playing with Widgets", function() {

      beforeEach(function(done) {

        var container = buildAppMarkup('<div data-aura-widget="dummy"></div><div data-aura-widget="yeah"></div>');
        var app = aura().use(ext);
        app.start({ widgets: container }).then(function() {
          BaseWidget = env.core.Widgets.Base;
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

    
    describe("Creating new Widget Types", function() {

      var ext = {
        init: function(env) {
          env.sandbox.registerWidgetType("NewWidgetType", { foo: "bar", initialize: function() { this.render(this.foo); }});
        }
      };

      var render = sinon.spy(function(content) {
        this.html(content);
      });

      var my_widget = { type: "NewWidgetType", render: render, foo: "nope" };
      define("__widget__$default$my_widget", my_widget);

      before(function(done) {
        var container = buildAppMarkup('<div data-aura-widget="my_widget"></div>');
        var app = aura();
        app.use(ext).start({ widgets: container }).done(function() { setTimeout(done, 100); });
      });

      it("Should use the right type is asked to...", function() {
        render.should.have.been.calledWith("nope");
      });


    });

  });



});