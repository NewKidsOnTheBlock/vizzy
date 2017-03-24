exports.Canvas = function() {
	this.shapes = [];
	var canvasWidth = 1920; 
	var canvasHeight = 1080;
	var screenCanvasWidth;
	var screenCanvasHeight;
	var xSize;
	var ySize;

	//Add shape to the canvas
	this.add = function(shape){
		shapes.push(shape);
	}

	//Will go through array of shapes and place them on the canvas
	this.update = function(mdata) {
		for (var i = 0; i < this.shapes.length; i++) {
			this.shapes[i].update(mdata);
		}
	}	

	//Will resize to canvas
	this.resize = function(width, height){
		screenCanvasWidth = width;
		screenCanvasHeight = height;

		xSize = screenCanvasWidth/canvasWidth;
		ySize = screenCanvasHeight/canvasHeight;

		console.log(xSize, ySize);
	}
}
