define(function() {
  return function(core) {
    function parseWidgetsList(widgets) {
      if (Array.isArray(widgets)) {
        return widgets;
      }
      var list = []
      core.dom.find('[data-aura-widget]', widgets).each(function() {
        list.push();
        console.warn("Widget: ", arguments)
      });
      return list;
      
    }

    function startWidgets(widgets) {
      var widgetsList = parseWidgetsList(widgets)

      core.util.each(widgetsList, function(i, opts) {
        return new Widget(opts)
      });
    }

    function Widget(opts) {
      var sandbox = core.sandbox();
      console.warn("New Widget", name, opts);
    }

    return {
      name: 'widgets',

      init: function(core) {
        core.start = function(widgets) {
          startWidgets(widgets);
        }
      },

      beforeAppStart: function(core) {
      },

      afterAppStart: function(core, widgets) {
        console.warn("Start from Widgets extension !", arguments);
        core.start(widgets);
      },

      sandbox: function() {
        console.warn("Sandbox from widgets extension....");
      }
    }
  } 
});