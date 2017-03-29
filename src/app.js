// Here is the starting point for your application code.
// All stuff below is just to show you how it works. You can delete all of it.

// Use new ES6 modules syntax for everything.
import os from 'os'; // native node.js module
import { remote } from 'electron'; // native electron module
import fs from 'fs';
var d3 = require('d3');

const Vue = require('vue/dist/vue.common.js');
var musicBar = require('../src/components/musicbar').musicBar;

var Canvas = require('../src/components/canvas.js').Canvas;

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
                };
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

        function musicData(){
            var buffer = analyze.frequencyBinCount;
            var data = new Uint8Array(buffer);
            analyze.getByteFrequencyData(data);

            //find the dominant frequency bin
            var max = 0;
            var index = -1;
            var average = 0.0;
            var beat = 0;

            for (var i = 0; i < data.length; i++){
                if (data[i]>max){
                    max = data[i];
                    index = i;
                }
                average += data[i];
            }
            
            //calculate the dominant frequency
            var frequency = (index * 44100)/ 1024.0;
            average = (average/data.length)/255.0;

            if(frequency < 330 && average >= .2){
                //subtract threshold from freq so lower frequencies rate higher
                beat = (Math.abs(frequency-330.0) * average)/330.0; //divide total by maximum possible value (freq thresh)
            }

            return {
                'frequency': data[0],
                'loudness': average,
                'beat': beat
            };
        }

        var app = this;

        function refresh(){
            //Only runs update if we are in the editor or play mode
            if(app.state.editor || app.state.player) {
                app.canvas.update(musicData());
            }
            window.requestAnimationFrame(refresh);
        }

        window.requestAnimationFrame(refresh);
    }
});
