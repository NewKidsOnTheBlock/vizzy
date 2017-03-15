(function () {'use strict';

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var os = require('os');
var electron = require('electron');
var fs = _interopDefault(require('fs'));
var jsmediatags = _interopDefault(require('jsmediatags'));
var jetpack = _interopDefault(require('fs-jetpack'));

const Vue$1 = require('vue/dist/vue.common.js');
const { dialog, app: app$1 } = require('electron').remote;

//Basic object for a song
var Song = function(data, path) {
    this.artist = data.artist;
    this.album = data.album;
    this.title = data.title;

    var image = data.picture;
    if(image) {
        var base64String = "";
        for (var i = 0; i < image.data.length; i++) {
            base64String += String.fromCharCode(image.data[i]);
        }
        var base64 = "data:" + image.format + ";base64," +
                window.btoa(base64String);
        this.picture = base64;
    }
    else {
        this.picture = './img/albumPlaceHolder.png';
    }
    // this.number = data.track.no;
    // this.albumImg = data.picture[0].data;
    // this.albumImgExtension = data.picture[0].format;

    this.path = path;
};

const musicBar = Vue$1.component('music-bar', {
    template: '#music-bar',
    props: ['musicInit'],
    data: function() {
        return {
            slash: (function() {
                if(process.platform === 'darwin' || process.platform === 'linux') {
                    return '/';
                }
                else return '\\'
            })(),
            flexOpt: 1,
            musicLoaded: false,
            audio: '',
            isPlaying: false,
            library: [],
            currentSong: {
                artist: 'No song',
                title: 'No title',
                picture: './img/albumPlaceHolder.png',
                path: './'
            },
            index: 0,
            percentageTime: 0,
            dragging: "none",
            directory: app$1.getPath('userData'),
            userPrefs: {},
        }
    },
    events: {
        fireOpenFileExplorer: function() {
            this.openFileExplorer();
        }
    },
    methods: {
        getMusicData: function(path) {
            var musicBar = this;
            return new Promise(function(resolve, reject) {
                jsmediatags.read(path, {
                    onSuccess: function(data) {
                        console.log(data.tags);
                        musicBar.library.push(new Song(data.tags, path));
                        resolve();
                    },
                    onError: function(error) {
                        console.log(':(', error.type, error.info);
                        reject();
                    }
                });
            });
        },
        searchDir: function(path, promises, callback) {
            var fileList = jetpack.list(path);
            for(var i = 0; i < fileList.length; i++) {
                var file = path + this.slash + fileList[i];

                if(fs.lstatSync(file).isDirectory()) {
                    this.searchDir(file, promises);
                }
                else if(file.substr(file.length - 4) === '.mp3') {
                    promises.push(this.getMusicData(file));
                }
                else {

                }
            }

            if(callback) {
                callback(promises);
            }
        },
        openFileExplorer: function() {
            var musicBar = this;
            dialog.showOpenDialog({properties: ['openDirectory']}, function(files) {
                var musicFolder = files[0];
                var promises = [];
                musicBar.searchDir(musicFolder, promises, function() {
                    Promise.all(promises).then(function() {
                        musicBar.currentSong = musicBar.library[0];
                        musicBar.musicLoaded = true;
                        musicBar.flexOpt = 'none';
                        musicBar.$emit('init');
                        musicBar.userPrefs.library = musicBar.library;
                        jetpack.write(musicBar.directory + musicBar.slash + 'vizzyPrefs.json', musicBar.userPrefs);
                        console.log('done');
                    });
                });
            });
        },
        play: function() {
            this.audio.play();
            this.isPlaying = true;
        },
        pause: function() {
            this.audio.pause();
            this.isPlaying = false;
        },
        prev: function() {
            if(this.index === 0) {
                this.index = this.library.length - 1;
            }
            else {
                this.index--;
            }

            var song = this.library[this.index];
            if(jetpack.exists(song.path)) {
                this.currentSong = song;
            }
            else {
                this.prev();
            }
            var musicBar = this;
            setTimeout(function() {
                musicBar.pause();
                musicBar.play();
            },100);
        },
        next: function() {
            if(this.index === this.library.length - 1) {
                this.index = 0;
            }
            else {
                this.index++;
            }

            var song = this.library[this.index];
            if(jetpack.exists(song.path)) {
                this.currentSong = song;
            }
            else {
                console.log('file does not exist skipping');
                this.next();
            }
            var musicBar = this;
            setTimeout(function() {
                musicBar.pause();
                musicBar.play();
            },100);
        },
        updateTracker: function() {
            if(this.musicLoaded) {
                var x = event.clientX;
                var width = window.innerWidth;

                var percentage = x/width;
                this.percentageTime = percentage * 100;
                this.audio.currentTime = this.audio.duration * percentage;
            }
        },
        checkPrefs: function() {
            if(jetpack.exists(this.directory + this.slash + 'vizzyPrefs.json')) {
                var prefs = JSON.parse(jetpack.read(this.directory + this.slash + 'vizzyPrefs.json', ['jsonWithDates']));
                console.log(prefs);
                this.library = prefs.library;
                this.currentSong = this.library[0];
                this.musicLoaded = true;
                this.flexOpt = 'none';
                this.$emit('init');
                console.log('preferences exist!');
            }
            else {
                console.log('preferences do not exist');
            }
        }
    },
    mounted: function () {
        this.checkPrefs();

        var musicBar = this;

        this.audio = document.getElementById('vizzy-audio');
        this.audio.onended = function() {
            musicBar.next();
        };

        var tracker = document.getElementById('tracker');
        var container = document.getElementById('drag-container');

        tracker.addEventListener('mousedown', function() {
            console.log('mouse down');
            musicBar.updateTracker();
            musicBar.dragging = 'block';
        }, false);

        container.addEventListener('mousemove', function() {
            if (musicBar.dragging === "block") {
                musicBar.updateTracker();
            }
        }, false);

        container.addEventListener('mouseup', function() {
            musicBar.dragging = 'none';
        }, false);

        function updateTime() {
            if(musicBar.isPlaying) {
                var currentTime = musicBar.audio.currentTime;
                var duration = musicBar.audio.duration;
                musicBar.percentageTime = (currentTime/duration) * 100;
            }
            window.requestAnimationFrame(updateTime);
        }

        window.requestAnimationFrame(updateTime);
    }
});

var musicBar$1 = {
    musicBar
};

// Here is the starting point for your application code.
// All stuff below is just to show you how it works. You can delete all of it.

// Use new ES6 modules syntax for everything.
const Vue = require('vue/dist/vue.common.js');
console.log(musicBar$1);

const app = new Vue({
    el: ".app",
    data: {
        musicInit: false,
        state: {
            home: false,
            editor: true,
        }
    },
    methods: {
        musicInitialize: function() {
            this.musicInit = true;
        }
    },
    mounted: function() {

    }
});

}());
//# sourceMappingURL=app.js.map