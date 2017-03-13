(function () {'use strict';

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var os = require('os');
var electron = require('electron');
var jetpack = _interopDefault(require('fs-jetpack'));
var fs = _interopDefault(require('fs'));
var mm = _interopDefault(require('musicmetadata'));

// Simple wrapper exposing environment variables to rest of the code.

var env = jetpack.cwd(__dirname).read('env.json', 'json');

// Here is the starting point for your application code.
// All stuff below is just to show you how it works. You can delete all of it.

// Use new ES6 modules syntax for everything.
const Vue = require('vue/dist/vue.common.js');
const {dialog} = require('electron').remote;
console.log(dialog);

const app = new Vue({
    el: ".app",
    data: {
        hello: 'Hello Vue App',
        audio: document.getElementById('vizzy-audio'),
        library: [],
        currentSong: {path: './'},
    },
    methods: {
        openFileExplorer: function() {
            dialog.showOpenDialog({properties: ['openDirectory']}, function(files) {
                var musicFolder = files[0];
                getMusicData(musicFolder, function() {
                    console.log(app.library);
                    app.currentSong = app.library[0];
                    app.audio.play();
                });
            });
        }
    }
});

//Basic object for a song
var Song = function(data, path) {
    this.artist = data.artist[0];
    this.album = data.album;
    this.title = data.title;
    this.number = data.track.no;
    this.albumImg = data.picture[0].data;
    this.albumImgExtension = data.picture[0].format;

    this.path = path;
};

//Function that will get music data, and populate the library with song objects
var getMusicData = function(path, callback) {
    console.log(fs.lstatSync(path).isDirectory());
    var fileList = jetpack.list(path);
    for(var i = 0; i < fileList.length; i++) {
        var file = path + "\\" + fileList[i];

        if(fs.lstatSync(file).isDirectory()) {
            getMusicData(file);
        }
        else if(file.includes('.mp3')) {
            var stream = fs.createReadStream(file);
            mm(stream, function(err, data) {
                stream.close();
                app.library.push(new Song(data, file));

                if(callback) {
                    callback();
                }
            });
        }
    }
};

}());
//# sourceMappingURL=app.js.map