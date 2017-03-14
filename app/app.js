(function () {'use strict';

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var os = require('os');
var electron = require('electron');
var jetpack = _interopDefault(require('fs-jetpack'));
var fs = _interopDefault(require('fs'));
var jsmediatags = _interopDefault(require('jsmediatags'));

// Simple wrapper exposing environment variables to rest of the code.

var env = jetpack.cwd(__dirname).read('env.json', 'json');

// Here is the starting point for your application code.
// All stuff below is just to show you how it works. You can delete all of it.

// Use new ES6 modules syntax for everything.
const Vue = require('vue/dist/vue.common.js');
const {dialog} = require('electron').remote;

const app = new Vue({
    el: ".app",
    data: {
        hello: 'Hello Vue App',
        audio: '',
        musicInit: false,
        isPlaying: false,
        library: [],
        currentSong: {artist: 'No song', title: 'No title', path: './'},
        index: 0
    },
    methods: {
        openFileExplorer: function() {
            dialog.showOpenDialog({properties: ['openDirectory']}, function(files) {
                var musicFolder = files[0];
                searchDir(musicFolder, function() {
                });
            });
        },
        play: function() {
            this.audio.play();
            app.isPlaying = true;
        },
        pause: function() {
            this.audio.pause();
            app.isPlaying = false;
        },
        prev: function() {
            if(this.index === 0) {
                this.index = this.library.length - 1;
            }
            else {
                this.index--;
            }
            this.currentSong = this.library[this.index];
            setTimeout(function() {
                app.pause();
                app.play();
            },100);
        },
        next: function() {
            if(this.index === this.library.length - 1) {
                this.index = 0;
            }
            else {
                this.index++;
            }
            this.currentSong = this.library[this.index];
            setTimeout(function() {
                app.pause();
                app.play();
            },100);
        }
    },
    mounted: function() {
        this.audio = document.getElementById('vizzy-audio');
        console.log(this.audio);
    }
});

//Basic object for a song
var Song = function(data, path) {
    this.artist = data.artist;
    this.album = data.album;
    this.title = data.title;
    // this.number = data.track.no;
    // this.albumImg = data.picture[0].data;
    // this.albumImgExtension = data.picture[0].format;

    this.path = path;
};

var slash = (function() {
    if(process.platform === 'darwin') {
        return '/';
    }
    else return '\\'
})();

var getMusicData = function(path) {
    jsmediatags.read(path, {
        onSuccess: function(data) {
            app.library.push(new Song(data.tags, path));

            if(!app.musicInit) {
                app.currentSong = app.library[0];
                app.musicInit = true;
            }
        },
        onError: function(error) {
            console.log(':(', error.type, error.info);
        }
    });
};

//Function that will get music data, and populate the library with song objects
var searchDir = function(path, callback) {
    console.log(fs.lstatSync(path).isDirectory());
    var fileList = jetpack.list(path);
    for(var i = 0; i < fileList.length; i++) {
        var file = path + slash + fileList[i];

        if(fs.lstatSync(file).isDirectory()) {
            searchDir(file);
        }
        else if(file.substr(file.length - 4) === '.mp3') {
            getMusicData(file);
        }
        else {
            console.log(file);
        }
    }

    if(callback) {
        callback();
    }
};

}());
//# sourceMappingURL=app.js.map