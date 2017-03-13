(function () {'use strict';

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var os = require('os');
var electron = require('electron');
var jetpack = _interopDefault(require('fs-jetpack'));

// Simple wrapper exposing environment variables to rest of the code.

// The variables have been written to `env.json` by the build process.
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
    },
    methods: {
        openFileExplorer: function() {
            dialog.showOpenDialog({properties: ['openDirectory']}, function(folder) {
                console.log(folder);
            });
        }
    }
});

}());
//# sourceMappingURL=app.js.map