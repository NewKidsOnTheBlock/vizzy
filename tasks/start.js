'use strict';

var childProcess = require('child_process');
var electron = require('electron');
var gulp = require('gulp');
var connect = require('electron-connect').server.create();

gulp.task('start', ['build', 'watch'], function () {
    // Start browser process
    connect.start();

    // Restart browser process
    gulp.watch('./app/app.js', connect.reload);

    // Reload renderer process
    gulp.watch(['./app/app.html', './app/stylesheets/main.css'], connect.reload);
});
