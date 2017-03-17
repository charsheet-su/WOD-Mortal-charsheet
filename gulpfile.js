const gulp        = require('gulp'),
      sourcemaps  = require('gulp-sourcemaps'),
      source      = require('vinyl-source-stream'),
      buffer      = require('vinyl-buffer'),
      browserify  = require('browserify'),
      // watchify    = require('watchify'),
      cleanCSS    = require('gulp-clean-css'),
      del         = require('del'),
      uglify      = require('gulp-uglifyjs'),
      runSequence = require('run-sequence'),
      babelify    = require('babelify'),
      replace     = require('gulp-replace');

const concat = require('gulp-concat');

gulp.task('copy-fonts', ()=> {
  gulp.src(['./node_modules/bootstrap/fonts/*']).pipe(gulp.dest('lib/fonts'));
});

gulp.task('build-scripts-dev', ()=>
  browserify({entries: './src/js/index.js', debug: true})
    .transform(babelify, {presets: ['es2015']})
    .bundle()
    .pipe(source('index.js'))
    .pipe(buffer())
    // .pipe(uglify())
    .pipe(sourcemaps.init({loadMaps: true}))
    .pipe(sourcemaps.write('./'))
    .pipe(gulp.dest('./lib/js')));

gulp.task('build-scripts-prod', ()=>
  browserify({entries: './src/js/index.js', debug: false})
    .transform(babelify, {presets: ['es2015']})
    .bundle()
    .pipe(source('index.js'))
    .pipe(buffer())
    .pipe(uglify())
    .pipe(sourcemaps.init({loadMaps: true}))
    .pipe(sourcemaps.write('./'))
    .pipe(gulp.dest('./lib/js')));

gulp.task('build-css-dev', ()=>
  gulp.src(['./src/css/**/*.css',
    './node_modules/bootstrap/dist/css/bootstrap.css',
    './node_modules/bootstrap/dist/css/bootstrap-theme.css'])
    .pipe(sourcemaps.init({loadMaps: true}))
    // .pipe(cleanCSS())
    .pipe(concat('style.min.css'))
    .pipe(replace('../../../fonts', '../../fonts'))
    .pipe(replace('../../../img', '../../img/'))
    .pipe(sourcemaps.write('./'))
    .pipe(gulp.dest('./lib/css')));


gulp.task('build-css-prod', ()=>
  gulp.src(['./src/css/**/*.css',
    './node_modules/bootstrap/dist/css/bootstrap.css',
    './node_modules/bootstrap/dist/css/bootstrap-theme.css'])
    .pipe(sourcemaps.init({loadMaps: true}))
    .pipe(cleanCSS())
    .pipe(concat('style.min.css'))
    .pipe(replace('../../../fonts', '../../fonts'))
    .pipe(replace('../../../img', '../../img/'))
    .pipe(sourcemaps.write('./'))
    .pipe(gulp.dest('./lib/css')));

gulp.task('clean-css', ()=>
  del([
    'lib/css/**/*',
    '!lib/css/.gitignore',
  ]));


gulp.task('clean-scripts', ()=>
  del([
    'lib/js/**/*',
    '!lib/js/.gitignore',
  ]));

gulp.task('build-prod', ()=> {
  runSequence(['clean-css', 'clean-scripts'], ['build-css-prod', 'build-scripts-prod', 'copy-fonts']);
});
gulp.task('build-dev', ()=> {
  runSequence(['clean-css', 'clean-scripts'], ['build-css-dev', 'build-scripts-dev', 'copy-fonts']);
});

gulp.task('default', ['build']);

