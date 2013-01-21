define(['./base', './aura.app'], function(base, AuraApp) {
  'use strict';

  // The actual application core

  return function(config) {
    return new AuraApp(config);
  };

});
