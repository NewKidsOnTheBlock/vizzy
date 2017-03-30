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
                    if(index === 0 || index) {
                        console.log('setting saved vizzy');
                        app.setVizzy(index);
                    }
                    else {
                        console.log('new vizzy');
                        var svg = d3.select('svg');
                        var svgCanvas = document.getElementById('svg');
                        app.vizzy.canvas.resize(svgCanvas.clientWidth, svgCanvas.clientHeight);
                        app.vizzy.canvas.setDomCanvas(svg);
                    }
                }
            },0);

        },
        newVizzy: function() {
            this.vizzy.id = 'Placeholder' + this.vizzies.length;
        },
        saveVizzy: function() {
            jetpack.remove(VIZZY_PATH + SLASH + this.vizzy.id + '.json');
            console.log(this.vizzy);
            jetpack.write(VIZZY_PATH + SLASH + this.vizzy.id + '.json', this.vizzy);
            this.updateVizzyList();
            console.log('vizzy saved');
        },
        setVizzy: function(i) {
            this.vizzy.canvas = new Canvas();
            this.vizzy.id = this.vizzies[i].id;
            console.log(this.vizzies[i]);

            var svg = d3.select('svg');
            var svgCanvas = document.getElementById('svg');
            app.vizzy.canvas.resize(svgCanvas.clientWidth, svgCanvas.clientHeight);
            app.vizzy.canvas.setDomCanvas(svg);

            for(var j = 0; j < this.vizzies[i].canvas.shapes.length; j++) {
                this.vizzy.canvas.add();
                for (var property in this.vizzies[i].canvas.shapes[j]) {
                    if (this.vizzies[i].canvas.shapes[j].hasOwnProperty(property)) {
                        this.vizzy.canvas.shapes[j][property] = this.vizzies[i].canvas.shapes[j][property];
                        console.log(property);
                    }
                }
            }
            console.log(this.vizzy.canvas.shapes);
        },
        updateVizzyList: function() {
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

            console.log(this.selectedShape.minColor);
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

        //initialize audio context & audio nodes
        var audioContext = new (window.AudioContext || window.webkitAudioContext)();
        var source = audioContext.createMediaElementSource(document.getElementById('vizzy-audio'));
        var analyze = audioContext.createAnalyser();
        analyze.fftsize=1024;
        analyze.smoothingTimeConstant=.5; //smoothing time is important for vizualization

        //connect audio nodes
        source.connect(analyze);
        analyze.connect(audioContext.destination);

        var mdata = new musicData(audioContext, analyze);

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