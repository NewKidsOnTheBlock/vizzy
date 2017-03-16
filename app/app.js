(function () {'use strict';

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var os = require('os');
var electron = require('electron');
var fs = _interopDefault(require('fs'));
var jsmediatags = _interopDefault(require('jsmediatags'));
var jetpack = _interopDefault(require('fs-jetpack'));

/***
   Copyright 2013 Teun Duynstee

   Licensed under the Apache License, Version 2.0 (the "License");
   you may not use this file except in compliance with the License.
   You may obtain a copy of the License at

     http://www.apache.org/licenses/LICENSE-2.0

   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.
*/
var firstBy = (function() {

    function identity(v){return v;}

    function ignoreCase(v){return typeof(v)==="string" ? v.toLowerCase() : v;}

    function makeCompareFunction(f, opt){
        opt = typeof(opt)==="number" ? {direction:opt} : opt||{};
        if(typeof(f)!="function"){
            var prop = f;
            // make unary function
            f = function(v1){return !!v1[prop] ? v1[prop] : "";};
        }
        if(f.length === 1) {
            // f is a unary function mapping a single item to its sort score
            var uf = f;
            var preprocess = opt.ignoreCase?ignoreCase:identity;
            f = function(v1,v2) {return preprocess(uf(v1)) < preprocess(uf(v2)) ? -1 : preprocess(uf(v1)) > preprocess(uf(v2)) ? 1 : 0;};
        }
        if(opt.direction === -1) return function(v1,v2){return -f(v1,v2)};
        return f;
    }

    /* adds a secondary compare function to the target function (`this` context)
       which is applied in case the first one returns 0 (equal)
       returns a new compare function, which has a `thenBy` method as well */
    function tb(func, opt) {
        var x = typeof(this) == "function" ? this : false;
        var y = makeCompareFunction(func, opt);
        var f = x ? function(a, b) {
                        return x(a,b) || y(a,b);
                    }
                  : y;
        f.thenBy = tb;
        return f;
    }
    return tb;
})();

const Vue$1 = require('vue/dist/vue.common.js');
const { dialog, app: app$1 } = require('electron').remote;

console.log(app$1.getPath('userData'));
//Basic object for a song
var Song = function(data, path) {
    this.artist = data.artist || 'Unknown Artist';
    this.album = data.album || 'Unknown Album';
    this.title = data.title || 'Unknown Title';
    this.track = parseInt(data.track) || 0;

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
        sortLibrary: function() {
            this.library.sort(
                firstBy(function (v) { return v.artist })
                .thenBy("album")
                .thenBy("track")
            );
            console.log(this.library);
        },
        openFileExplorer: function() {
            var musicBar = this;
            dialog.showOpenDialog({properties: ['openDirectory']}, function(files) {
                var musicFolder = files[0];
                var promises = [];
                musicBar.searchDir(musicFolder, promises, function() {
                    Promise.all(promises).then(function() {
                        musicBar.sortLibrary();
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
                this.sortLibrary();
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

        //initialize audio context & audio nodes
        var audioContext = new (window.AudioContext || window.webkitAudioContext)();
        var source = audioContext.createMediaElementSource(document.getElementById('vizzy-audio'));
        var analyze = audioContext.createAnalyser();
        analyze.fftsize=2048;
        analyze.smoothingTimeConstant=.5; //smoothing time is important for vizualization

        //connect audio nodes
        source.connect(analyze);
        analyze.connect(audioContext.destination);

        function musicData(){
            var buffer = analyze.frequencyBinCount;
            var data = new Uint8Array(buffer);
            analyze.getByteFrequencyData(data);

            //find the dominant frequency bin
            var max = 0;
            var index = -1;
            for (var i = 0; i < buffer; i++){
                if (data[i]>max){
                    max = data[i];
                    index = i;
                }
            }
            //calculate the dominant frequency
            var frequency = (index * 44100)/ 2048.0;

            return {
                'frequency': frequency
            };
        }

        function refresh(){
            console.log(musicData());
            window.requestAnimationFrame(refresh);
        }

        window.requestAnimationFrame(refresh);
    }
});

}());
//# sourceMappingURL=app.js.map