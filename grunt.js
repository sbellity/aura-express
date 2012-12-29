module.exports = function(grunt) {
  'use strict';

  grunt.loadNpmTasks('grunt-contrib');
  grunt.loadNpmTasks('grunt-mocha');
  // grunt.loadNpmTasks('grunt-dox');

  // ==========================================================================
  // Project configuration
  // ==========================================================================

  grunt.initConfig({

    dox: {
      files: {
        src: 'lib/**/*.js',
        dest: 'docs'
      }
    },

    server: {
      port: 8899,
      base: './'
    },

    lint: {
      files: ['lib/**/*.js', 'spec/lib/**/*.js']
    },

    jshint: {
      options: {
        curly: true,
        eqeqeq: true,
        immed: true,
        latedef: true,
        newcap: true,
        noarg: true,
        sub: true,
        undef: true,
        eqnull: true,
        browser: true,
        nomen: false,
        expr: true
      },
      globals: {
        console: true,
        require: true,
        define: true,
        _: true,
        $: true,
      }
    },

    mocha: {
      all: {
        src: 'spec/index.html',
        run: true
      }
    },

    watch: {
      files: ['<config:lint.files>'],
      tasks: ['lint']
    }
  });

  // default build task
  grunt.registerTask('launch', 'server watch');
  grunt.registerTask('default', 'lint dox');

};
