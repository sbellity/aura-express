module.exports = function(grunt) {
  'use strict';

  grunt.loadNpmTasks('grunt-contrib');
  grunt.loadNpmTasks('grunt-dox');

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
      files: ['lib/**/*.js']
    },

    // jasmine testsuites
    jasmine: {
      files: ['spec/index.html']
    },

    watch: {
      files: ['<config:lint.files>'],
      tasks: ['lint']
    }
  });

  // default build task
  grunt.registerTask('default', 'server watch');

};
