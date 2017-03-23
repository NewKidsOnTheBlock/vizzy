// Here is the starting point for your application code.
// All stuff below is just to show you how it works. You can delete all of it.

// Use new ES6 modules syntax for everything.
import os from 'os'; // native node.js module
import { remote } from 'electron'; // native electron module
import fs from 'fs';

const Vue = require('vue/dist/vue.common.js');
import musicBar from './components/musicbar';

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
