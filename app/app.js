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

//Starting the view component
const musicBar = Vue$1.component('music-bar', {
    //Giving it an ID from our html for the template
    template: '#music-bar',
    //Getting the music initialized from the main application
    props: ['musicInit'],
    //All the data our component uses
    data: function() {
        return {
            //Getting a forward slash or backslash depending on operating system
            slash: (function() {
                if(process.platform === 'darwin' || process.platform === 'linux') {
                    return '/';
                }
                else return '\\'
            })(),
            //Our flex option for taking up the whole page
            flexOpt: 1,
            //Bool for if our music is loaded
            musicLoaded: false,
            //creating placeholder for our html audio
            audio: null,
            //Bool for is the player is playing
            isPlaying: false,
            //Array for our library
            library: [],
            //String to set the style of the library view, defaults to none
            libraryView: 'none',
            //Finding how big our library should be
            libraryHeight: (window.innerHeight - 100) + 'px',
            //Object for current song to display in music bar
            currentSong: {
                artist: 'No song',
                title: 'No title',
                picture: './img/albumPlaceHolder.png',
                path: './'
            },
            //Our index for songs
            index: 0,
            //Our percentage of time in the song
            percentageTime: 0,
            //String to set the style of a dragging div in order to drag through songs
            dragging: "none",
            //Getting our directory
            directory: app$1.getPath('userData'),
            //Empty object for user prefs
            userPrefs: {},
        }
    },
    //Methods the music bar uses
    methods: {
        //Gets our music data from file handed to it
        getMusicData: function(path) {
            //Setting a variable for the application
            var musicBar = this;
            //Hands back a promise to be resolved
            return new Promise(function(resolve, reject) {
                //using jsmediatags to read our music file data
                jsmediatags.read(path, {
                    onSuccess: function(data) {
                        musicBar.library.push(new Song(data.tags, path));
                        //Resolve the promise
                        resolve();
                    },
                    onError: function(error) {
                        reject();
                    }
                });
            });
        },
        //Function to search our directory, takes a path, an empty array for promises, and a callback function
        searchDir: function(path, promises, callback) {
            //Getting an array of our files
            var fileList = jetpack.list(path);
            for(var i = 0; i < fileList.length; i++) {
                //Getting the path of the file in list
                var file = path + this.slash + fileList[i];

                //If the file we are given is actually a folder
                if(fs.lstatSync(file).isDirectory()) {
                    //Recurse and run search directory again
                    this.searchDir(file, promises);
                }
                //If the file is an mp3
                else if(file.substr(file.length - 4) === '.mp3') {
                    //Push returned data to our promise array
                    promises.push(this.getMusicData(file));
                }
            }

            //If there is a callback
            if(callback) {
                //Run our callback function
                callback(promises);
            }
        },
        //Function to sort our library
        sortLibrary: function() {
            this.library.sort(
                firstBy(function (v) { return v.artist })
                .thenBy("album")
                .thenBy("track")
            );
        },
        //Function that opens our file explorer
        openFileExplorer: function() {
            //Settign up a variable for our application
            var musicBar = this;
            //Open up a file explorer
            dialog.showOpenDialog({properties: ['openDirectory']}, function(files) {
                //Getting the path to our files
                var musicFolder = files[0];
                //Creating an empty array for promises
                var promises = [];
                //Run our search directory function, give it a callback
                musicBar.searchDir(musicFolder, promises, function() {
                    //This checks all of the promises that were added to our promise array
                    Promise.all(promises).then(function() {
                        //Run all of the necessary functions to start the music bar up
                        musicBar.sortLibrary();
                        musicBar.currentSong = musicBar.library[0];
                        musicBar.musicLoaded = true;
                        musicBar.flexOpt = 'none';
                        //Sending a message to our main application that the music bar is ready to go
                        musicBar.$emit('init');
                        //Saving a library preference to our user preferences
                        musicBar.userPrefs.library = musicBar.library;
                        //Save our user preferences to our applications directory
                        jetpack.write(musicBar.directory + musicBar.slash + 'vizzyPrefs.json', musicBar.userPrefs);
                    });
                });
            });
        },
        //The next functions are self explanatory. This is referring to the application itself.
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
            this.reset();
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
            this.reset();
        },
        setCurrentSong: function(i) {
            this.currentSong = this.library[i];
            this.reset();
        },
        reset: function() {
            var musicBar = this;
            setTimeout(function() {
                musicBar.pause();
                musicBar.play();
            },100);
        },
        //Updating the song tracker
        updateTracker: function() {
            if(this.musicLoaded) {
                //Getting the x position of the mouse
                var x = event.clientX;
                var width = window.innerWidth;

                var percentage = x/width;
                this.percentageTime = percentage * 100;
                this.audio.currentTime = this.audio.duration * percentage;
            }
        },
        //Check if our preferences exist
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
            }
        },
    },
    //This runs when the application is mounted
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

// Here is the starting point for your application code.
// All stuff below is just to show you how it works. You can delete all of it.

// Use new ES6 modules syntax for everything.
const Vue = require('vue/dist/vue.common.js');
var dummyCanvas = {
    shapes: [
        {
            id: "Circle",
            minWidth: 10,
            maxWidth: 20,
            minHeight: 10,
            maxHeight: 20,
        },
        {
            id: "Circle 1",
            minWidth: 10,
            maxWidth: 20,
            minHeight: 10,
            maxHeight: 20,
        },
        {
            id: "Circle 2",
            minWidth: 10,
            maxWidth: 20,
            minHeight: 10,
            maxHeight: 20,
        },
        {
            id: "Circle 3",
            minWidth: 10,
            maxWidth: 20,
            minHeight: 10,
            maxHeight: 20,
        },
        {
            id: "Circle 4",
            minWidth: 10,
            maxWidth: 20,
            minHeight: 10,
            maxHeight: 20,
        },
    ]
};

const app = new Vue({
    el: ".app",
    data: {
        canvas: dummyCanvas,
        musicInit: false,
        state: {
            home: false,
            editor: true,
        },
        selectedShape: ''
    },
    methods: {
        musicInitialize: function() {
            this.musicInit = true;
        },
        selectShape: function(i) {
            this.selectedShape = this.canvas.shapes[i];
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
            //console.log(musicData())
            window.requestAnimationFrame(refresh);
        }

        window.requestAnimationFrame(refresh);
    }
});

}());
//# sourceMappingURL=app.js.map