var Shape = require('./shape.js').Shape;

exports.Canvas = function() {
	//Public variable
	this.shapes = [];

	//Private variables
	//This stores a DOM element for our canvas
	var domCanvas;
	var canvasWidth = 1920; 
	var canvasHeight = 1080;
	//These variables are for the on screen width and height of the canvas
	var screenCanvasWidth;
	var screenCanvasHeight;
	//These variables are for scaling our on screen canvas with our virtual canvas
	var xSize;
	var ySize;

	//Set our canvas to our svg element, also reappends our shape svgs to canvas if needed
	this.setDomCanvas = function(svg) {
		domCanvas = svg;
		for (var i = 0; i < this.shapes.length; i++) {
			this.shapes[i].reappend(domCanvas);
		}
	}

	//Add shape to the canvas
	this.add = function() {
		//Creating a base ID for our shape
		var idNum = this.shapes.length + 1;
		//Adding it to ellipse for now, will depend on user input later
		var shapeName = "Ellipse " + idNum;
		//Creating the new shape, hand it our dom canvas
		var shape = new Shape(shapeName, domCanvas, {x: xSize, y: ySize});
		//Pushing the shape to our shapes array
		this.shapes.push(shape);
	}

	//Clears our shape svgs on editor exit
	this.clearShapeSvg = function() {
		for(var i = 0; i < this.shapes.length; i++) {
			this.shapes[i].cleard3();
		}
	}

	//Will resize to canvas
	this.resize = function(width, height){
		screenCanvasWidth = width;
		screenCanvasHeight = height;

		xSize = screenCanvasWidth/canvasWidth;
		ySize = screenCanvasHeight/canvasHeight;
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
		return percentageData;
	}
}
