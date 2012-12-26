var defaultConfig = {
  require: {
    paths: {
      aura:       'aura-express/lib',
      underscore: 'underscore/underscore',
      jquery:     'jquery/jquery'
    },
    shim: {
      underscore: { exports: '_' },
      jquery:     { exports: '$' }
    }
  }
};

(function() {

  function configure(config) {
    if (!config) { return; }

    var requireConfig = require.s.contexts._.config;

    if (config.require) {
      // Shim Config
      for (var s in config.require.shim) {
        requireConfig.shim[s] = requireConfig.shim[s] || config.require.shim[s];
      }

      // Path Config
      for (var p in config.require.paths) {
        requireConfig.paths[p] = requireConfig.paths[p] || "components/" + config.require.paths[p];
      }
      require.config(requireConfig);
    }
    return config;
  }

  var baseConfig = configure(defaultConfig);

  define(['underscore', 'jquery', './platform'], function(_, $) {
    var base = {};

    base.config = baseConfig;
    base.configure = configure;

    base.dom = {
      find: function(selector, context) {
        context = context || document;
        return $(context).find(selector);
      },
      data: function(selector, attribute) {
        return $(selector).data(attribute);
      }
    };

    base.data = {
      deferred: $.Deferred,
      when: $.when
    };

    base.util = {
      each: $.each,
      extend: $.extend,
      uniq: _.uniq,
      _: _,
      decamelize: function(camelCase, delimiter) {
        delimiter = (delimiter === undefined) ? '_' : delimiter;
        return camelCase.replace(/([A-Z])/g, delimiter + '$1').toLowerCase();
      }
    };

    var noop = function() {};
    var console = window.console || {};

    base.log = console.log || noop;
    base.warn = console.warn || noop;
    base.error = console.error || noop;

    base.template = {
      parse: _.template
    };

    return base;

  });

})();
