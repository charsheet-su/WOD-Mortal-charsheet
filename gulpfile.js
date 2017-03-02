const gulp        = require('gulp'),
      sourcemaps  = require('gulp-sourcemaps'),
      source      = require('vinyl-source-stream'),
      buffer      = require('vinyl-buffer'),
      browserify  = require('browserify'),
      // watchify    = require('watchify'),
      // cleanCSS    = require('gulp-clean-css'),
      del         = require('del'),
      // uglify      = require('gulp-uglifyjs'),
      runSequence = require('run-sequence'),
      babelify    = require('babelify'),
      replace     = require('gulp-replace');

// const babel = require('gulp-babel');
const concat = require('gulp-concat');

gulp.task('build-scripts', ()=>
  /* return gulp.src('./src/js/index.js')
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


  /* return browserify({insertGlobals: true,entries: './src/js/index.js', debug: true})
   .transform(babelify)
   .bundle()
   .pipe(source('index.js'))
   .pipe(gulp.dest('./lib/js'));*/

  browserify({entries: './src/js/index.js', debug: true})
    .transform(babelify)
    .bundle()
    .pipe(source('index.js'))
    .pipe(buffer())
    // .pipe(uglify())
    .pipe(sourcemaps.init({loadMaps: true}))
    .pipe(sourcemaps.write('./'))
    .pipe(gulp.dest('./lib/js')));

gulp.task('build-css', ()=>
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

gulp.task('build', ()=> {
  runSequence(['clean-css', 'clean-scripts'], ['build-css', 'build-scripts']);
});

gulp.task('default', ['build']);

