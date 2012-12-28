define(['jasmine/jasmine'], function (jasmine) {

  require(['./lib/aura_spec'], function() {
    console.warn('Jasmine runner...')
    var htmlReporter = new jasmine.HtmlReporter();
    var jasmineEnv = jasmine.getEnv();

    jasmineEnv.updateInterval = 1000;
    jasmineEnv.addReporter(htmlReporter);
    jasmineEnv.specFilter = function (spec) {
      return htmlReporter.specFilter(spec);
    };
    jasmineEnv.execute();    
  })
});
