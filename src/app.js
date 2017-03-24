// Here is the starting point for your application code.
// All stuff below is just to show you how it works. You can delete all of it.

// Use new ES6 modules syntax for everything.
import os from 'os'; // native node.js module
import { remote } from 'electron'; // native electron module
import fs from 'fs';

const Vue = require('vue/dist/vue.common.js');
import musicBar from './components/musicbar';

var Canvas = require('../src/components/canvas.js').Canvas;

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
}

const app = new Vue({
    el: ".app",
    data: {
        vizzies: [0,0,0,0,0,0,0,0],
        canvas: new Canvas(),
        musicInit: false,
        state: {
            home: true,
            editor: false,
        },
        selectedShape: {
            shape: null,
            pos: null,
            or: null,
            siz: null,
            col: null,
        }
    },
    methods: {
        musicInitialize: function() {
            this.musicInit = true;
        },
        moveState: function(page) {
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
                if(page === 'editor') {
                    var svgCanvas = document.getElementById('svg');
                    app.canvas.resize(svgCanvas.clientWidth, svgCanvas.clientHeight);
                };
            },0);
            
        },
        selectShape: function(index) {
            this.selectedShape.shape = this.canvas.shapes[index];
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
