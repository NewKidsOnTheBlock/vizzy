// Here is the starting point for your application code.
// All stuff below is just to show you how it works. You can delete all of it.

// Use new ES6 modules syntax for everything.
import os from 'os'; // native node.js module
import { remote } from 'electron'; // native electron module
import jetpack from 'fs-jetpack'; // module loaded from npm
import env from './env';
const Vue = require('vue/dist/vue.common.js');
const {dialog} = require('electron').remote;
console.log(dialog);

const app = new Vue({
    el: ".app",
    data: {
        hello: 'Hello Vue App',
    },
    methods: {
        openFileExplorer: function() {
            dialog.showOpenDialog({properties: ['openDirectory']}, function(folder) {
                console.log(folder);
            });
        }
    }
});
