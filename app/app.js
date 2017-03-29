(function () {'use strict';

var os = require('os');
var electron = require('electron');
var fs = require('fs');

// Here is the starting point for your application code.
// All stuff below is just to show you how it works. You can delete all of it.

// Use new ES6 modules syntax for everything.
var d3 = require('d3');

const Vue = require('vue/dist/vue.common.js');
var musicBar = require('../src/components/musicbar').musicBar;

var Canvas = require('../src/components/canvas.js').Canvas;
var musicData = require('../src/components/musicdata.js').musicData;

const app = new Vue({
    el: ".app",
    data: {
        vizzies: [0,0,0,0,0,0,0,0],
        canvas: new Canvas(),
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
        moveState: function(page) {
            if(this.state.editor || this.state.player) {
                //If we are leaving our editor/player state clear our svgs
                this.canvas.clearShapeSvg();
            }
            for (var property in this.state) {
                if (this.state.hasOwnProperty(property)) {
                    console.log(property);
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
                    var svg = d3.select('svg');
                    var svgCanvas = document.getElementById('svg');
                    app.canvas.resize(svgCanvas.clientWidth, svgCanvas.clientHeight);
                    app.canvas.setDomCanvas(svg);
                }
            },0);

        },
        selectShape: function(index) {
            this.selectedShape.shape = this.canvas.shapes[index];
            this.setColor();
            for (var i = 0; i < this.canvas.shapes.length; i++) {
                this.canvas.shapes[i].isSelected = false;
            }
            this.canvas.shapes[index].isSelected = true;
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
            this.canvas.add();
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
                    app.canvas.update(ret);
                });
            }
            window.requestAnimationFrame(refresh);
        }

        window.requestAnimationFrame(refresh);
    }
});

}());
//# sourceMappingURL=app.js.map