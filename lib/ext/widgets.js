define(function() {
  return function(core) {

    var ownProp = function(obj, key) { 
      return Object.prototype.hasOwnProperty.call(obj, key);
    };

    var registeredWidgets = {};

    function Widget(options) {
      this.options = options;
      this.$el = core.dom.find(options.el);
      this.initialize.call(this, options);
      return this;
    }

    Widget.prototype.initialize = function() {};

    Widget.prototype.html =  function(markup) {
      this.$el.html(markup);
      return this;
    };

    // Stolen from Backbone 0.9.9 !
    // Helper function to correctly set up the prototype chain, for subclasses.
    // Similar to `goog.inherits`, but uses a hash of prototype properties and
    // class properties to be extended.
    var extend = function(protoProps, staticProps) {
      var parent = this;
      var child;

      // The constructor function for the new subclass is either defined by you
      // (the "constructor" property in your `extend` definition), or defaulted
      // by us to simply call the parent's constructor.
      if (protoProps && ownProp(protoProps, 'constructor')) {
        child = protoProps.constructor;
      } else {
        child = function(){ parent.apply(this, arguments); };
      }

      // Add static properties to the constructor function, if supplied.
      core.util.extend(child, parent, staticProps);

      // Set the prototype chain to inherit from `parent`, without calling
      // `parent`'s constructor function.
      var Surrogate = function(){ this.constructor = child; };
      Surrogate.prototype = parent.prototype;
      child.prototype = new Surrogate();

      // Add prototype properties (instance properties) to the subclass,
      // if supplied.
      if (protoProps) core.util.extend(child.prototype, protoProps);

      // Set a convenience property in case the parent's prototype is needed
      // later.
      child.__super__ = parent.prototype;

      return child;
    };

    Widget.extend = extend;

    Widget.load = function(name, options) {
      var dfd = core.data.deferred();
      dfd.then(function() {
        core.dom.find(options.el).show();
      });
      var ref = options.ref,
          sandboxRef  = ref + "/sandbox",
          sandbox, widget, WidgetConstructor;

      options.require.map = options.require.map || {};
      options.require.map[ref]  = {
        sandbox:  sandboxRef
      };

      if (require.defined(sandboxRef)) {
        sandbox = require(sandboxRef);
      }

      if (!sandbox) {
        sandbox = core.sandbox();
        define(sandboxRef, sandbox);
      }

      require.config(options.require);

      require([options.ref], function(widgetDefinition) {

        if (!widgetDefinition) {
          return dfd.reject();
        }
        try {

          if (registeredWidgets[ref]) {
            WidgetConstructor = registeredWidgets[ref];
          } else {
            if (widgetDefinition.type) {
              WidgetConstructor = core.Widgets[widgetDefinition.type];  
            } else {
              WidgetConstructor = Widget;
            }

            if (!WidgetConstructor) { 
              throw new Error("Can't find widget of type '" +  widgetDefinition.type + "', did you forget to include the extension that provides it ?");
            }

            if (_.isObject(widgetDefinition)) {
              WidgetConstructor = registeredWidgets[ref] = WidgetConstructor.extend(widgetDefinition);
            }
          }

          ext = { sandbox: sandbox };

          if (typeof widgetDefinition === 'function') {
            ext.initialize = widgetDefinition;
          }

          WidgetConstructor = WidgetConstructor.extend(ext);
          
          var initialized = core.data.when(new WidgetConstructor(options));

          initialized.then(function(ret) { dfd.resolve(ret); });
          initialized.fail(function(err) { dfd.reject(ret); });

          return initialized;
        } catch(err) {


          console.error(err.message);
          dfd.reject(err);
        }
      }, function(err) { dfd.reject(err); });

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
        list.push(Widget.load(w.name, w.options));
      });
      return core.data.when.apply(undefined, list);
    };

    return {
      name: 'widgets',
    
      config: {
        require: { paths: { text: 'requirejs-text/text' } }
      },

      init: function(core) {
        core.Widgets = core.Widgets || {};
        core.Widgets.Base = Widget;
        core.start  = function(list) { 
          return Widget.startAll(list);
        };
      },

      beforeAppStart: function(core) {
      },

      afterAppStart: function(core, widgets) {
        core.start(widgets);
      },

      sandbox: function() {
      }
    };
  };
});