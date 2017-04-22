//Grabbing our requirements from other files
var remote = require('electron').remote; // native electron module
var electronApp = require('electron').remote.app
var fs = require('fs');
var jetpack = require('fs-jetpack');
var d3 = require('d3');
var SvgSaver = require('../src/components/svgToPng.js').SvgSaver;
console.log(SvgSaver);

//Vue and its components
var Vue = require('vue/dist/vue.common.js');
var musicBar = require('../src/components/musicbar').musicBar;

//Our three main classes
var Canvas = require('../src/components/canvas.js').Canvas;
var Shape = require('../src/components/shape.js').Shape;
var musicData = require('../src/components/musicdata.js').musicData;

//Creating a global variable for a slash to append to our paths
var SLASH = (function() {
        if(process.platform === 'darwin' || process.platform === 'linux') {
            return '/';
        }
        else return '\\'
})();

//Path to our Vizzies
var VIZZY_PATH = electronApp.getPath('userData') + SLASH + 'vizzies';

//Creating a function for Vue for swapping places
Vue.swap = function(arr, x, y) {
   var origin = arr[x]
   arr.splice(x, 1, arr[y])
   Vue.set(arr, y, origin)
}

var app = new Vue({
    el: ".app",
    //These are all of the variables the application uses.
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
            player: false,
            sharing: false
        },
        popupState: {
            deleting: false,
            creating: false,
            posting: false,
            renaming: false,
            saving: false,
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
        },
        newVizzyName: '',
        shareMessage:'',
        saveName:'',
        existingViz:'',
        tempVizzy:'',
        shares: []
    },
    methods: {
        //This is called from our music bar to make sure we have music loaded into our application
        musicInitialize: function() {
            this.musicInit = true;
        },
        //uses fetch API to update this.shares array for sharing feed
        updateShareList: function(){
            this.shares = [];
            fetch('http://138.197.12.154:1729/api/posts',{
                method: 'get'
            }).then((res) => {
                return res.json();
            }).then((json) => {
                this.shares = json;
            })
        },
        //moves state to new View (page == v-if)
        moveState: function(page, index) {
            //Loop over our states and switch to the correct one
            if(page === 'sharing'){
                this.updateShareList();
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
            //We have to set a timeout function here to make sure that the state has been switched
            if(page === 'editor' || page === 'player') {
                window.setTimeout(function() {
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
                },0);
            }
        },
        //POSTs a vizzy to the Vizzy web API using XHR
        shareVizzy: function(vizzy){

            let req = new XMLHttpRequest();
            req.open("POST", "http://138.197.12.154:1729/api/posts");
            req.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
            let params = "message="+this.shareMessage+"&vizzy="+JSON.stringify(this.posting);

            //this function is asynchronously called upon req.response
            req.onload = function(){
                console.log(req.status);
                console.log(req.response);
            };

            req.send(params);
            this.popupState.posting=false;
        },
        //saves a vizzy from the sharing feed
        saveShare: function(vizzy){
            //parse shared vizzy to json, then write
            Promise.resolve(JSON.parse(vizzy)).then((json) => {
                let save = true;
                for (let i=0; i<this.vizzies.length; i++){
                    if (this.vizzies[i].id === json.id){
                        //vizzy exists, don't save
                        save = false;
                        break;
                    }
                }
                if (save){
                    jetpack.write(VIZZY_PATH + SLASH + json.id + '.json', json);
                    // //Update our vizzy list so it is reflected on the home page
                    this.updateVizzyList();
                    console.log("Saved vizzy "+json.id+"!");
                }
                //if popup open, perform actions to save renamed vizzy
                else if (this.popupState.saving){
                    if(this.saveName.length > 0){
                        json.id = this.saveName;
                        jetpack.write(VIZZY_PATH + SLASH + json.id + '.json', json);
                        this.updateVizzyList();
                        this.existingViz = '';
                        this.saveName = '';
                        this.tempVizzy = '';
                        this.popupState.saving = false;
                    }
                }
                //prompt user (this.popupState.saving = true opens a popup)
                else{
                    console.log("saving true");
                    this.tempVizzy = vizzy;
                    this.existingViz = json.id;
                    this.popupState.saving = true;
                }
            });
        },
        playShare: function(vizzy){
            this.saveShare(vizzy);
            Promise.resolve(JSON.parse(vizzy)).then((json) => {
                for (let i=0; i<this.vizzies.length; i++){
                    if (this.vizzies[i].id === json.id){
                        this.moveState('player', i);
                        break;
                    }
                }
            })

        },
        newVizzy: function() {
            //Creates a new vizzy and moves to the editor
            this.vizzy.id = this.newVizzyName || 'Placeholder' + this.vizzies.length;
            this.moveState('editor');
            this.newVizzyName = '';
            this.popupState.creating = false;
        },
        saveVizzy: function() {
            this.vizzy.pic = this.vizzy.canvas.domCanvas.toDataURL('png');
            //Remove our existing file, and save the new one
            jetpack.remove(VIZZY_PATH + SLASH + this.vizzy.id + '.json');
            jetpack.write(VIZZY_PATH + SLASH + this.vizzy.id + '.json', this.vizzy);
            //Update our vizzy list so it is reflected on the home page
            this.updateVizzyList();
            this.moveState('home');
        },
        //deletes selected vizzy, this.vizzy is determined by which box is clicked
        deleteVizzy: function() {
            //Remove our existing file, and save the new one
            jetpack.remove(VIZZY_PATH + SLASH + this.deleting + '.json');
            this.updateVizzyList();
            this.popupState.deleting = false;
        },
        renameVizzy: function() {
            jetpack.remove(VIZZY_PATH + SLASH + this.vizzies[this.popupState.renaming-1].id + '.json');
            this.vizzies[this.popupState.renaming-1].id = this.newVizzyName;
            jetpack.write(VIZZY_PATH + SLASH + this.newVizzyName + '.json', this.vizzies[this.popupState.renaming-1]);
            this.newVizzyName = '';
            this.updateVizzyList();
            this.popupState.renaming = false;
        },
        setVizzy: function(index, newVizzy) {
            //Create a new canvas, and set it's ID to our selected Vizzies ID
            this.vizzy.canvas = new Canvas();

            //Grabbing our on screen canvas, and resizing and setting the DOM of our canvas class
            var canvas = document.getElementById('canvas');
            canvas.width = canvas.clientWidth;
            canvas.height = canvas.clientHeight;
            //We also need to let our canvas class resize itself, and store the DOM canvas
            this.vizzy.canvas.resize(canvas.clientWidth, canvas.clientHeight);
            this.vizzy.canvas.setDomCanvas(canvas);

            if (!newVizzy) {
                this.vizzy.id = this.vizzies[index].id;
                //Runs through all of the saved shapes and adds new shapes to our canvas. Also copies our saved shapes attributes to our new shapes
                for(var i = 0; i < this.vizzies[index].canvas.shapes.length; i++) {
                    this.vizzy.canvas.add();
                    for (var property in this.vizzies[index].canvas.shapes[i]) {
                        if (this.vizzies[index].canvas.shapes[i].hasOwnProperty(property)) {
                            this.vizzy.canvas.shapes[i][property] = this.vizzies[index].canvas.shapes[i][property];
                        }
                    }
                }
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
        resolvePic: function(vizzy) {
            //This function is used to hand the picture of the Vizzy to the DOM
            return 'url(' + vizzy.pic || '' + ')';
        },
        //Selects the shape in the editor
        selectShape: function(index) {
            this.selectedShape.shape = this.vizzy.canvas.shapes[index];
            this.setColor();
            for (var i = 0; i < this.vizzy.canvas.shapes.length; i++) {
                this.vizzy.canvas.shapes[i].isSelected = false;
            }
            this.vizzy.canvas.shapes[index].isSelected = true;
        },
        //Moves a shape backwards in the editor
        moveBack: function(index) {
            this.selectedShape.shape = null;
            if(index !== 0) {
                Vue.swap(this.vizzy.canvas.shapes, index, index-1);
            }

        },
        //Moves a shape forwards in the editor
        moveForward: function(index) {
            this.selectedShape.shape = null;
            if(index !== this.vizzy.canvas.shapes.length - 1) {
                Vue.swap(this.vizzy.canvas.shapes, index, index+1);
                this.selectShape(index+1);
            }
            this.vizzy.canvas.rearrangeShapes();
        },
        //Used to toggle the shape editor panels
        toggleShapePanel: function(type) {

            if(this.selectedShape[type]) {
                this.selectedShape[type] = null;
            }
            else {
                this.selectedShape[type] = 'block';
            }
        },
        //Used to add a new shape to a Vizzy
        addShape: function() {
            this.vizzy.canvas.add();
        },
        //Used to set the colors of the color selectors
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
    //this function is called upon app init
    mounted: function() {
        //If we have a directory already created start Vizzy, otherwise create one
        if (this.directoryCheck) {
            this.updateVizzyList();
        }
        else {
            jetpack.dir(VIZZY_PATH);
            this.vizzyDirectory = VIZZY_PATH;
        }

        this.updateShareList();

        //initialize audio context and create musicdata
        var audioContext = new (window.AudioContext || window.webkitAudioContext)();
        var mdata = new musicData(audioContext);

        var app = this;

        //This function is used to update the canvas when music is playing.
        function refresh(){
            //Only runs update if we are in the editor or play mode
            if(app.state.editor || app.state.player) {
                mdata.update().then((ret) => {
                    app.vizzy.canvas.clear();
                    app.vizzy.canvas.update(ret);
                });
            }
            window.requestAnimationFrame(refresh);
        }

        window.requestAnimationFrame(refresh);
    }
});
