define(['aura/aura', 'aura/ext/widgets'], function(aura, ext) {

  'use strict';
  /*global describe:true, it:true, beforeEach: true, before: true, alert: true, sinon: true */

  var appConfig = { widgets: "spec/widgets" };
  var appsContainer = $('<div>').attr('style', 'display:none');
  $('body').append(appsContainer);

  function buildAppMarkup(markup) {
    var container   = $("<div/>").attr('id', _.uniqueId('widgets_spec_')).html(markup);
    appsContainer.append(container);
    return container;
  }

  describe("Widgets API", function() {

    var env, app, BaseWidget,
        ext = function(appEnv) { env = appEnv; };

    var yeahWidget = { initialize: sinon.spy(function() { this.html('yeah'); }) };
    define("__widget__$yeah@default", yeahWidget);

    describe("Playing with Widgets", function() {

      beforeEach(function(done) {
        app = aura(appConfig).use(ext);
        var container = buildAppMarkup('<div id="dummy-' + app.ref + '" data-aura-widget="dummy"></div><div data-aura-widget="yeah"></div>');
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

      describe("Starting a list of widgets", function() {

        it("Should start the provided list of widgets", function() {
          var el = "#dummy-" + app.ref;
          var list = [{ name: 'dummy', options: { el: el } }];
          // TODO...
        });

      });

    });

    
    describe("Creating new Widget Types", function() {

      // A Very simple Widget type...
      var NewWidgetType = { 
        foo: "bar", 
        initialize: function() { 
          this.render(this.foo); 
        }
      };

      // An extension to load it
      var ext = {
        init: function(env) {
          env.sandbox.registerWidgetType("NewWidgetType", NewWidgetType);
        }
      };

      // The render method of the widget which will inherit from NewWidgetType
      var render = sinon.spy(function(content) {
        this.html(content);
      });

      // The actual widget
      var my_widget = { 
        type: "NewWidgetType", 
        render: render, 
        foo: "nope" 
      };
      define("__widget__$my_widget@default", my_widget);

      before(function(done) {
        var container = buildAppMarkup('<div data-aura-widget="my_widget"></div>');
        var app = aura(appConfig);
        app.use(ext).start({ widgets: container }).done(function() { 
          // Hum... a little bit hacky
          // The promise resolves when the app is loaded...
          // not when the widgets are started...
          // TODO: what should we do ?
          setTimeout(done, 0); 
        });
      });

      it("Should use the right type if asked to...", function() {
        // The render method should have been called 
        // from the initialize method of the parent type...
        render.should.have.been.calledWith("nope");
      });

    });

    describe("Nesting Widgets", function() {
      it("Should be possible to nest widgets...");
      // Nesting means that if a widget's markup contains data-aura-widget elements, 
      // They should be started recursively
    });


    describe("Adding new widgets source locations...", function() {

      var env;
      var myExternalWidget = sinon.spy(function() { return { initialize: sinon.spy(), render: sinon.spy() }; });
      var ext = { init: function(appEnv) { env = appEnv; } };

      before(function(done) {
        var container = buildAppMarkup('<div data-aura-widget="ext_widget@anotherSource"></div>');
        var app = aura(appConfig);
        app.use(ext);
        app.addWidgetsSource("anotherSource", "remoteWidgets");
        define("__widget__$ext_widget@anotherSource", myExternalWidget);
        app.start({ widgets: container }).done(function() { setTimeout(done, 0); });
      });

      it("Should be possible to add new sources locations for widgets #123", function() {
        myExternalWidget.should.have.been.called;
      });
    });


  });



});