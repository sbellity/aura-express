define(['aura/aura', 'aura/ext/widgets'], function(Aura, ext) {
  
  var appsContainer = $('<div>').attr('style', 'display:none');
  $('body').append(appsContainer);

  describe("Widgets Widgets Widgets", function() {

    var core, Widget,
    ext = function(appCore) { core = appCore; }

    define("__widget__$default$yeah", { initialize: function() { this.html('yeah'); } });

    beforeEach(function(done) {
      var app = Aura().use(ext),
          containerId = _.uniqueId('widgets_spec_'),
          container   = $("<div/>") .attr('id', containerId)
                                    .html('<div data-aura-widget="dummy"></div><div data-aura-widget="yeah"></div>');
      appsContainer.append(container);

      app.start("#" + containerId).then(function() {
        Widget = core.Widgets.Base;
        done();
      });
    });

    describe("Widgets Extension", function() {
      it("Should define the widgets registry and base Widget on core", function() {
        core.Widgets.should.be.a('object');
        core.Widgets.Base.should.be.a('function');
      });
    });

    describe("Starting Widgets", function() {

    });

  });



});