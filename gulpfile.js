var gulp = require('gulp');
var concat = require('gulp-concat');

gulp.task('default', function() {
  return gulp.src(['./src/Code.gs', './src/exports.js'])
    .pipe(concat('gasworker.js'))
    .pipe(gulp.dest('.'));
});
