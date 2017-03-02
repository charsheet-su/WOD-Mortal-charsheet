var gulp = require('gulp');
var sourcemaps = require('gulp-sourcemaps');
var source = require('vinyl-source-stream');
var buffer = require('vinyl-buffer');
var browserify = require('browserify');
var watchify = require('watchify');
var cleanCSS = require('gulp-clean-css');
var del = require('del');
var uglify = require('gulp-uglifyjs');
var runSequence = require('run-sequence');
var babelify = require('babelify');
var replace = require('gulp-replace');

const babel = require('gulp-babel');
const concat = require('gulp-concat');

gulp.task('build-scripts', function () {
  /*return gulp.src('./src/js/index.js')
   .pipe(sourcemaps.init({loadMaps: true}))
   .pipe(babel({
   presets: ['es2015']
   }))
   .pipe(browserify({
   insertGlobals: true
   }))
   .bundle()
   .pipe(source('index.js'))
   .pipe(buffer())
   .pipe(uglify())
   //.pipe(concat('index.js'))
   .pipe(sourcemaps.write('./'))
   .pipe(gulp.dest('./lib/js'));*/


  /*
   return browserify({insertGlobals: true,entries: './src/js/index.js', debug: true})
   .transform(babelify)
   .bundle()
   .pipe(source('index.js'))
   .pipe(gulp.dest('./lib/js'));*/

  return browserify({entries: './src/js/index.js', debug: true})
    .transform(babelify)
    .bundle()
    .pipe(source('index.js'))
    .pipe(buffer())
    //.pipe(uglify())
    .pipe(sourcemaps.init({loadMaps: true}))
    .pipe(sourcemaps.write('./'))
    .pipe(gulp.dest('./lib/js'));

});

gulp.task('build-css',
  function buildCss() {
    return gulp.src(['./src/css/**/*.css',
      './node_modules/bootstrap/dist/css/bootstrap.css',
      './node_modules/bootstrap/dist/css/bootstrap-theme.css'])
      .pipe(sourcemaps.init({loadMaps: true}))
      //.pipe(cleanCSS())
      .pipe(concat('style.min.css'))
      .pipe(replace('../../../fonts', '../../fonts'))
      .pipe(replace('../../../img', '../../img/'))
      .pipe(sourcemaps.write('./'))
      .pipe(gulp.dest('./lib/css'));
  });

gulp.task('clean-css',
  function clean() {
    return del([
      'lib/css/**/*',
      '!lib/css/.gitignore'
    ]);
  });


gulp.task('clean-scripts',
  function clean() {
    return del([
      'lib/js/**/*',
      '!lib/js/.gitignore'
    ]);
  });

gulp.task('build', function () {
  runSequence(['clean-css', 'clean-scripts'], ['build-css', 'build-scripts'])
});

gulp.task('default', ['build']);