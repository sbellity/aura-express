define(function() {
  return function(core) {

    var registeredWidgets = {};

    function Widget(name, options) {
      this.sandbox = core.sandbox();
      this.name = name;
      this.options = options;
      return this;
    }

    Widget.prototype.load = function() {
      var dfd = core.data.deferred();
      this.options.require.map                    = this.options.require.map || {};
      this.options.require.map[this.options.ref]  = {
        sandbox: this.options.ref + "/sandbox",
        widget: this.options.ref + "/widget"
      }
      
      define(this.options.ref + "/widget", this);
      define(this.options.ref + "/sandbox", this.sandbox);

      require.config(this.options.require);
      require([this.options.ref], function(widgetDefinition) {
        console.warn("Hey... I Have a Widget here !", arguments);
        if (typeof widgetDefinition === 'function') {
          widgetDefinition(this);
        } else {
          console.warn("Oops... I don't know yet what to do with this widget...");
        }
      }.bind(this));
      console.warn("Loading Widget", this);
      return dfd;
    };

    function parseWidgetOptions(el) {
      var options = { el: el, require: {} }, widgetName, widgetLocation;
      var data = core.dom.data(el);
      core.util.each(data, function(k,v) {
        var key = core.util.decamelize(k).toLowerCase();
        if (key !== 'aura_widget') {
          options[key] = v;
        } else {
          var ref = v.split("@");
          widgetName      = core.util.decamelize(ref[0]);
          widgetLocation  = ref[1];
        }
      });

      if (widgetLocation) {
        loc = "http://" + widgetLocation + "/" + widgetName;
      } else {
        loc = "widgets/" + widgetName;
      }

      options.ref   = ['__widget__', widgetLocation || 'default', widgetName].join("$");
      options.require           = options.require || {};
      options.require.packages  = options.require.packages || [];
      options.require.packages.push({ name: options.ref, location: loc });
      options.name  = widgetName;
      return options;
    }

    Widget.parseList = function(widgets) {
      if (Array.isArray(widgets)) {
        return widgets;
      }
      var list = [];
      core.dom.find('[data-aura-widget]', widgets || 'body').each(function() {
        var options = parseWidgetOptions(this), widgetName, widgetLocation;
        list.push({ name: options.name, options: options });
      });
      return list;
    };

    Widget.startAll = function(widgets) {
      var widgetsList = Widget.parseList(widgets);
      var list = [];
      core.util.each(widgetsList, function(i, w) {
        list.push(new Widget(w.name, w.options).load());
      });
      return core.data.when.apply(undefined, list);
    };

    return {
      name: 'widgets',

      init: function(core) {
        core.Widgets = { Widget: Widget };
        core.start  = function(list) { 
          return Widget.startAll(list);
        };
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
    };
  };
});