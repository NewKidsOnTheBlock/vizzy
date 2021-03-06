var Shape = require('./shape.js').Shape;

exports.Canvas = function() {
	//Public variable
	this.shapes = [];
	this.domCanvas;

	//Private variables
	//This stores a DOM element for our canvas
	var ctx;
	var canvasWidth = 1920; 
	var canvasHeight = 1080;
	//These variables are for the on screen width and height of the canvas
	var screenCanvasWidth;
	var screenCanvasHeight;
	//These variables are for scaling our on screen canvas with our virtual canvas
	var xSize;
	var ySize;

	//Set our canvas to our svg element, also reappends our shape svgs to canvas if needed
	this.setDomCanvas = function(canvas) {
		this.domCanvas = canvas;
		ctx = this.domCanvas.getContext('2d');
		for (var i = 0; i < this.shapes.length; i++) {
			this.shapes[i].reappend(ctx);
		}
	}

	//Add shape to the canvas
	this.add = function() {
		//Creating a base ID for our shape
		var idNum = this.shapes.length + 1;
		//Adding it to ellipse for now, will depend on user input later
		var shapeName = "Shape " + idNum;
		//Creating the new shape, hand it our dom canvas
		var shape = new Shape(shapeName, ctx, {x: xSize, y: ySize});
		//Pushing the shape to our shapes array
		this.shapes.push(shape);
	}

	this.rearrangeShapes = function() {
		for(var i = 0; i < this.shapes.length; i++) {
			this.shapes[i].cleard3();
			this.shapes[i].reappend();
		}
	}

	//Will resize to canvas
	this.resize = function(width, height){
		screenCanvasWidth = width;
		screenCanvasHeight = height;

		xSize = screenCanvasWidth/canvasWidth;
		ySize = screenCanvasHeight/canvasHeight;

		for(var i = 0; i < this.shapes.length; i++) {
			this.shapes[i].updateShapeScale({x: xSize, y: ySize});
		}
	}

	this.clear = function() {
		if(ctx) {
			ctx.clearRect(0, 0, this.domCanvas.width, this.domCanvas.height);
		}
	}

	//Will go through array of shapes and place them on the canvas
	this.update = function(mdata) {
		var data = formatData(mdata);
		for (var i = 0; i < this.shapes.length; i++) {
			this.shapes[i].update(data);
		}
	}	

	//Formatting some frequency data for now
	var formatData = function(data) {
		var percentageData = {};
		percentageData.frequency = data.frequency/256;
		percentageData.volume = data.volume;
		percentageData.beat = data.beat/.5;
		for(var property in data) {
			if (data.hasOwnProperty(property) && property.includes('band')) {
				percentageData[property] = data[property]/256;
			}
		}
		return percentageData;
	}
}
