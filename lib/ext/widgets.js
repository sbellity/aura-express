define('aura/ext/widgets', function() {
  return function(core) {

    var ownProp = function(obj, key) {
      return Object.prototype.hasOwnProperty.call(obj, key);
    };

    /**
     * Widgets registry
     * @type {Object}
     */
    var registeredWidgets = {};

    /**
     * The base Widget constructor...
     *
     * @param {Object} options the options to init the widget...
     */
    function Widget(options) {
      this.options = options;
      this._ref = options._ref;
      this.$el  = core.dom.find(options.el);
      this.initialize.call(this, options);
      return this;
    }

    Widget.prototype.initialize = function() {};

    /**
     * A small helper function to render markup
     *
     * @param  {String} markup the markup to render in the widget's root el
     * @return {Widget} the Widget instance to allow methods chaining...
     */
    Widget.prototype.html =  function(markup, el) {
      var _el = (el && core.dom.find(el, this.$el)) || this.$el;
      _el.html(markup);
      return this;
    };

    // Stolen from Backbone 0.9.9 !
    // Helper function to correctly set up the prototype chain, for subclasses.
    // Similar to `goog.inherits`, but uses a hash of prototype properties and
    // class properties to be extended.
    var extend = function(protoProps, staticProps) {
      var parent = this;
      var child;
      if (protoProps && ownProp(protoProps, 'constructor')) {
        child = protoProps.constructor;
      } else {
        child = function(){ parent.apply(this, arguments); };
      }
      core.util.extend(child, parent, staticProps);
      var Surrogate = function(){ this.constructor = child; };
      Surrogate.prototype = parent.prototype;
      child.prototype = new Surrogate();
      if (protoProps) core.util.extend(child.prototype, protoProps);
      child.__super__ = parent.prototype;
      return child;
    };

    Widget.extend = extend;

    /**
     * Widget loader.
     * @param  {String} name    The name of the Widget to load
     * @param  {Object} options The options to pass to the new widget instance.
     * @return {Promise}        A Promise that resolves to the loaded widget instance.
     */
    Widget.load = function(name, options) {
      console.warn("Loading ", name);

      var dfd = core.data.deferred();

      // Show the widget when it is fully loaded...
      dfd.then(function() {
        core.dom.find(options.el).show();
      });

      dfd.fail(function(err) {
        console.error("Error loading widget ", name, err);
      });

      var ref = options.ref,
          sandboxRef  = ref + "/sandbox",
          sandbox, widget, WidgetConstructor;

      // Requirejs map hack to have a hold on the sandbox
      // from the modules inside the widget's package.
      options.require.map = options.require.map || {};
      options.require.map[ref]  = {
        sandbox:  sandboxRef
      };

      // If an instance of this widget has already been loaded before,
      // we should already have a sandbox created for it.
      if (require.defined(sandboxRef)) {
        sandbox = require(sandboxRef);
      }

      // Otherwise, we create and register an shiny new one.
      if (!sandbox) {
        sandbox = core.sandbox();
        define(sandboxRef, sandbox);
      }

      // Apply requirejs map / package configuration before the actual loading.
      require.config(options.require);

      // Here, we require the widget's package definition
      require([options.ref], function(widgetDefinition) {

        if (!widgetDefinition) {
          return dfd.reject();
        }

        try {

          // Ok, the widget has already been loaded once, we should already have it in the registry
          if (registeredWidgets[ref]) {
            WidgetConstructor = registeredWidgets[ref];
          } else {

            if (widgetDefinition.type) {
              // If `type` is defined, we use a constructor provided by an extension ? ex. Backbone.
              WidgetConstructor = core.Widgets[widgetDefinition.type];
            } else {
              // Otherwise, we use the stock Widget constructor.
              WidgetConstructor = Widget;
            }

            if (!WidgetConstructor) {
              throw new Error("Can't find widget of type '" +  widgetDefinition.type + "', did you forget to include the extension that provides it ?");
            }

            if (_.isObject(widgetDefinition)) {
              WidgetConstructor = registeredWidgets[ref] = WidgetConstructor.extend(widgetDefinition);
            }
          }

          // Here we inject the sandbox in the widget's prototype...
          ext = { sandbox: sandbox };

          // If the Widget is just defined as a function, we use it as its `initialize` method.
          if (typeof widgetDefinition === 'function') {
            ext.initialize = widgetDefinition;
          }

          WidgetConstructor = WidgetConstructor.extend(ext);

          options._ref  = core.util._.uniqueId(ref + "+");
          var newWidget = new WidgetConstructor(options);

          var initialized = core.data.when(newWidget);

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

    /**
     * Parses the widget's options from its element's data attributes.
     *
     * @param  {String|DomNode} el the element
     * @return {Object}         An object that contains the widget's options
     */
    function parseWidgetOptions(el) {
      var options = { el: el, require: {} }, widgetName, widgetLocation;
      var data = core.dom.data(el);

      // Here we go through all the data attributes of the element to build the options object
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

      // Allows to load widgets from another server...
      // TODO: we should maybe provide a mechanism to register allowed sources... ?
      if (widgetLocation) {
        loc = "http://" + widgetLocation + "/" + widgetName;
      } else {
        loc = "widgets/" + widgetName;
      }

      // Register the widget a s requirejs package...
      // TODO: packages are not supported by almond, should we find another way to do this ?
      options.ref   = ['__widget__', widgetLocation || 'default', widgetName].join("$");
      options.require           = options.require || {};
      options.require.packages  = options.require.packages || [];
      options.require.packages.push({ name: options.ref, location: loc });
      options.name  = widgetName;
      return options;
    }

    /**
     * Returns a list of widget.
     * If the first argument is a String, it is considered as a DomNode reference
     * We then parse its content to find aura-widgets inside of it.
     *
     * @param  {Array|String} widgets a list of widgets or a reference to a root dom node
     * @return {Array}        a list of widget with their options
     */
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

    /**
     * Actual start method for a list of widgets.
     *
     * @param  {Array|String} widgets cf. `Widget.parseList`
     * @return {Promise} a promise that resolves to a list of started widgets.
     */
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

        // Widgets 'classes' registry...
        core.Widgets = core.Widgets || {};
        core.Widgets.Base = Widget;

        // Provide a start method to start widgets from the core.
        core.start  = function(list) {
          return Widget.startAll(list);
        };
      },

      beforeAppStart: function(core) {

      },

      afterAppStart: function(core, widgets) {
        // Auto start widgets when the app is loaded.
        core.start(widgets);
      },

      sandbox: function(sandbox, core) {

      }
    };
  };
});
