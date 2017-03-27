var Vue = require('vue/dist/vue.common.js');
var jsmediatags = require('jsmediatags');
var fs = require('fs');
var jetpack = require('fs-jetpack'); // module loaded from npm
var firstBy = require('../helpers/thenBy.js').firstBy;
var { dialog, app } = require('electron').remote;

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
}

//Starting the view component
exports.musicBar = Vue.component('music-bar', {
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
            directory: app.getPath('userData'),
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
                })
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
                var promises = []
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
            if(this.library.length == 1 || (this.audio.currentTime / this.audio.duration) > 0.11){
                this.audio.currentTime = 0;
            }
            else if(this.index === 0) {
                this.index = this.library.length - 1;
            }
            else {
                this.index--;
            }

            var song = this.library[this.index]
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
            if(this.library.length == 1 ){
                this.audio.currentTime = 0;
            }
            else if(this.index === this.library.length - 1) {
                this.index = 0;
            }
            else {
                this.index++;
            }

            var song = this.library[this.index]
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
        }

        var tracker = document.getElementById('tracker');
        var container = document.getElementById('drag-container');

        tracker.addEventListener('mousedown', function() {
            musicBar.updateTracker();
            musicBar.dragging = 'block';
        }, false);

        container.addEventListener('mousemove', function() {
            if (musicBar.dragging === "block") {
                musicBar.updateTracker();
            };
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
