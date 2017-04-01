(function () {'use strict';

var os = require('os');
var fs = require('fs');

// Here is the starting point for your application code.
// All stuff below is just to show you how it works. You can delete all of it.

// Use new ES6 modules syntax for everything.
var remote = require('electron').remote; // native electron module
var electronApp = require('electron').remote.app;
var jetpack = require('fs-jetpack');
var d3 = require('d3');

const Vue = require('vue/dist/vue.common.js');
var musicBar = require('../src/components/musicbar').musicBar;

var Canvas = require('../src/components/canvas.js').Canvas;
var Shape = require('../src/components/shape.js').Shape;
var musicData = require('../src/components/musicdata.js').musicData;

var SLASH = (function() {
        if(process.platform === 'darwin' || process.platform === 'linux') {
            return '/';
        }
        else return '\\'
})();

var VIZZY_PATH = electronApp.getPath('userData') + SLASH + 'vizzies';

console.log(VIZZY_PATH);

Vue.swap = function(arr, x, y) {
   var origin = arr[x];
   arr.splice(x, 1, arr[y]);
   Vue.set(arr, y, origin);
};

const app = new Vue({
    el: ".app",
    data: {
        directoryCheck: jetpack.exists(VIZZY_PATH),
        vizzyDirectory: '',
        vizzies: [],
        vizzy: {
            id: "Placeholder",
            canvas: new Canvas(),
        },
        musicInit: false,
        state: {
            home: true,
            editor: false,
            player: false
        },
        selectedShape: {
            shape: null,
            typ: null,
            pos: null,
            or: null,
            siz: null,
            col: null,
            minColor: null,
            maxColor: null
        },
        editor: {
            editId: false,
            minColorSelected: true
        }
    },
    methods: {
        musicInitialize: function() {
            this.musicInit = true;
        },
        moveState: function(page, index) {
            if(this.state.editor || this.state.player) {
                //If we are leaving our editor/player state clear our svgs
                this.vizzy.canvas.clearShapeSvg();
            }

            if(this.state.editor) {
                //Save the vizzy if we are moving away from the editor back home.
                this.saveVizzy();
            }

            for (var property in this.state) {
                if (this.state.hasOwnProperty(property)) {
                    if(property === page) {
                        this.state[property] = true;
                    }
                    else {
                        this.state[property] = false;
                    }
                }
            }
            var app = this;
            window.setTimeout(function() {
                if(page === 'editor' || page === 'player') {
                    //Reset our selected shape
                    app.selectedShape = {
                        shape: null,
                        typ: null,
                        pos: null,
                        or: null,
                        siz: null,
                        col: null,
                        minColor: null,
                        maxColor: null
                    };
                    //If we are loading a saved vizzy
                    if(index === 0 || index) {
                        //Set our vizzy
                        app.setVizzy(index);
                    }
                    //If we are loading a new vizzy
                    else {
                        app.setVizzy(null, true);
                    }
                }
            },0);
        },
        newVizzy: function() {
            this.vizzy.id = 'Placeholder' + this.vizzies.length;
        },
        saveVizzy: function() {
            //Remove our existing file, and save the new one
            jetpack.remove(VIZZY_PATH + SLASH + this.vizzy.id + '.json');
            jetpack.write(VIZZY_PATH + SLASH + this.vizzy.id + '.json', this.vizzy);
            //Update our vizzy list so it is reflected on the home page
            this.updateVizzyList();
        },
        setVizzy: function(index, newVizzy) {
            //Create a new canvas, and set it's ID to our selected Vizzies ID
            this.vizzy.canvas = new Canvas();

            if (!newVizzy) {
                this.vizzy.id = this.vizzies[index].id;
            }

            //Grabbing our on screen canvas, and resizing and setting the DOM of our canvas class
            var svg = d3.select('svg');
            var svgCanvas = document.getElementById('svg');
            app.vizzy.canvas.resize(svgCanvas.clientWidth, svgCanvas.clientHeight);
            app.vizzy.canvas.setDomCanvas(svg);

            //Runs through all of the saved shapes and adds new shapes to our canvas. Also copies our saved shapes attributes to our new shapes
            for(var i = 0; i < this.vizzies[index].canvas.shapes.length; i++) {
                this.vizzy.canvas.add();
                for (var property in this.vizzies[index].canvas.shapes[i]) {
                    if (this.vizzies[index].canvas.shapes[i].hasOwnProperty(property)) {
                        this.vizzy.canvas.shapes[i][property] = this.vizzies[index].canvas.shapes[i][property];
                    }
                }
                this.vizzy.canvas.shapes[i].switchShapeType();
            }
        },
        updateVizzyList: function() {
            //Finds our stored vizzies and sets them to our vizzies array
            var foundVizzies = jetpack.list(VIZZY_PATH);
            var parsedVizzies = [];
            if (foundVizzies.length === 0) {
                console.log('no vizzies found');
            }
            else {
                for(var i = 0; i < foundVizzies.length; i++) {
                    parsedVizzies.push(JSON.parse(jetpack.read(VIZZY_PATH + SLASH + foundVizzies[i])));
                }
            }
            this.vizzies = parsedVizzies;
        },
        selectShape: function(index) {
            this.selectedShape.shape = this.vizzy.canvas.shapes[index];
            this.setColor();
            for (var i = 0; i < this.vizzy.canvas.shapes.length; i++) {
                this.vizzy.canvas.shapes[i].isSelected = false;
            }
            this.vizzy.canvas.shapes[index].isSelected = true;
        },
        moveBack: function(index) {
            this.selectedShape.shape = null;
            if(index !== 0) {
                Vue.swap(this.vizzy.canvas.shapes, index, index-1);
                this.selectShape(index-1);
            }
            this.vizzy.canvas.rearrangeShapes();
            
        },
        moveForward: function(index) {
            this.selectedShape.shape = null;
            if(index !== this.vizzy.canvas.shapes.length - 1) {
                Vue.swap(this.vizzy.canvas.shapes, index, index+1);
                this.selectShape(index+1);
            }
            this.vizzy.canvas.rearrangeShapes();
        },
        toggleShapePanel: function(type) {

            if(this.selectedShape[type]) {
                this.selectedShape[type] = null;
            }
            else {
                this.selectedShape[type] = 'block';
            }
        },
        addShape: function() {
            this.vizzy.canvas.add();
        },
        setColor: function() {
            var minRed = this.selectedShape.shape.minColor.red;
            var minGreen = this.selectedShape.shape.minColor.green;
            var minBlue = this.selectedShape.shape.minColor.blue;

            this.selectedShape.minColor = "rgb(" + minRed + ',' + minGreen + ',' + minBlue + ')';

            var maxRed = this.selectedShape.shape.maxColor.red;
            var maxGreen = this.selectedShape.shape.maxColor.green;
            var maxBlue = this.selectedShape.shape.maxColor.blue;

            this.selectedShape.maxColor = "rgb(" + maxRed + ',' + maxGreen + ',' + maxBlue + ')';
        }
    },
    mounted: function() {
        if (this.directoryCheck) {
            this.updateVizzyList();
        }
        else {
            jetpack.dir(VIZZY_PATH);
            this.vizzyDirectory = VIZZY_PATH;
        }

        //initialize audio context and create musicdata object
        var audioContext = new (window.AudioContext || window.webkitAudioContext)();
        var mdata = new musicData(audioContext);

        var app = this;

        function refresh(){
            //Only runs update if we are in the editor or play mode
            if(app.state.editor || app.state.player) {
                mdata.update().then((ret) => {
                    app.vizzy.canvas.update(ret);
                });
            }
            window.requestAnimationFrame(refresh);
        }

        window.requestAnimationFrame(refresh);
    }
});

}());
//# sourceMappingURL=app.js.map