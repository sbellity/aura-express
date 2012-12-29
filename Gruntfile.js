module.exports = function(grunt) {
  'use strict';

  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-connect');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-mocha');
  grunt.loadNpmTasks('grunt-dox');

  // ==========================================================================
  // Project configuration
  // ==========================================================================

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    dox: {
      files: {
        src: 'lib/**/*.js',
        dest: 'docs'
      }
    },

    connect: {
      server: {
        options: {
          port: 8899,
          base: '.'
        }
      }
    },

    jshint: {
      files: {
        src: ['lib/**/*.js', 'spec/lib/**/*.js']
      },
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
        expr: true,
        globals: {
          console: true,
          require: true,
          define: true,
          _: true,
          $: true,
        }
      }
    },

    mocha: {
      aura: {
        src: ['spec/index.html']
      }
    },

    watch: {
      files: ['lib/**/*.js', 'spec/lib/**/*.js'],
      tasks: ['jshint']
    }
  });

  // default build task
  grunt.registerTask('default', ['connect', 'jshint', 'watch']);
  grunt.registerTask('build', ['jshint','dox']);

};
