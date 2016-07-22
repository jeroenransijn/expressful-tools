#!/usr/bin/env node
'use strict';
const settings = {
  javascript: {
    entryFiles: '**/src/js/*.js',
    destination: '**/dist/js/'
  },

  css: {
    entryFiles: '**/src/css/*.css',
    destination: '**/dist/css/'
  }

  /**
   * Source settings
   * ---
   * this patterns match the entry files for css and javascript
   */
  src: {
    css: '**/src/css/*.css',
    js: '**/src/js/*.js'
  },

  /**
   * Dist(ribution) settings
   * --
   * these match where the processed css and javascript should go
   *
   * Example with values:
   * src/js/main.js => public/dist/js/main.js
   */
  dist: {
    css: '**/dist/css/',
    js: '**/dist/js/'
  }
};
const fs = require('fs');

const gulp = require('gulp');
const sourcemaps = require('gulp-sourcemaps');
const plumber = require('gulp-plumber');
const rename = require('gulp-rename');
const nodemon = require('gulp-nodemon');
const concat = require('gulp-concat');
const uglify = require('gulp-uglify');
const gutil = require('gulp-util');

// # CSS

// "You can literally write future-proof CSS and forget old preprocessor specific syntax."
// READ MORE: http://cssnext.io/features/
// cssnext is based on PostCSS
const vanillaPostcss = require('postcss');
const postcss = require('gulp-postcss');
const postcssImport = require('postcss-import');
const postcssCssnext = require('postcss-cssnext');
const cssnano = require('cssnano');
const postcssBrowserReporter = require('postcss-browser-reporter');
const stylefmt = require('stylefmt');

function streamError(err) {
  gutil.beep();
  gutil.log(err instanceof gutil.PluginError ? err.toString() : err.stack);
}

function styles () {
  const processors = [
    postcssImport,
    postcssCssnext({
      browsers: ['last 1 version'],
      warnForDuplicates: false
    }),
    cssnano(),
    postcssBrowserReporter
  ];

  gulp.src(settings.src.main)
    .pipe(plumber({ errorHandler: streamError }))
    .pipe(sourcemaps.init())
    .pipe(postcss(processors))
    .pipe(sourcemaps.write('.'))
    .pipe(gulp.dest(settings.dist.css));
}
gulp.task('styles', styles);

/**
 * Watches the css
 * - Runs stylefmt on file save
 * - Runs styles and compiles all the css
 */
function watch () {
  styles();

  gulp.watch(settings.src.css, (event) => {

    // Perfectly format CSS across the team with stylefmt
    if (settings.cssFormatting) {
      // [Using event.path for source and destination](https://github.com/gulpjs/gulp/issues/212)
      // Split the filename from the path.
      let filename = event.path.split('/');
      filename = filename[filename.length - 1];
      // For some reason it needs a base to work
      const base = event.path.replace(filename, '');

      gulp.src(event.path, { base: base })
        .pipe(plumber({ errorHandler: streamError }))
        .pipe(postcss([
          stylefmt
        ]))
        .pipe(gulp.dest(base))
        .on('end', styles);

    } else {
      styles();
    }
  });
}
gulp.task('watch', watch);

function scripts () {
  const scriptsInConfig = config.get('scripts').map((name) => `src${name}`);
  // Assume this is always run in NODE_ENV=development
  console.log('Scripts that are bundled:\n',
    scriptsInConfig.join('\n'));
  gulp.src(scriptsInConfig)
    .pipe(sourcemaps.init())
    .pipe(concat('bundle.js'))
    .pipe(uglify())
    .pipe(sourcemaps.write('.'))
    .pipe(gulp.dest( settings.dist.js ));
}
gulp.task('scripts', scripts);

function serve () {
  const env = process.env.NODE_ENV || 'development';
  console.log('NODE_ENV:', env);
  nodemon({
    script: 'app.js',
    ext: 'js html cson json nunj nunjucks',
    env: { 'NODE_ENV': env }
  }).on('readable', function () {
    this.stdout.on('data', (chunk) => {
      process.stdout.write(chunk);
    });
  });
}
gulp.task('serve', serve);

/**
 * Build does not comb your code
 */
gulp.task('build', ['styles', 'scripts']);

gulp.task('default', ['watch', 'serve']);

function dev () {
  watch();
  serve();
}

dev();
