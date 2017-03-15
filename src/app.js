// Here is the starting point for your application code.
// All stuff below is just to show you how it works. You can delete all of it.

// Use new ES6 modules syntax for everything.
import os from 'os'; // native node.js module
import { remote } from 'electron'; // native electron module
import fs from 'fs';

const Vue = require('vue/dist/vue.common.js');
import musicBar from './components/musicbar';

console.log(musicBar);

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

    }
});
