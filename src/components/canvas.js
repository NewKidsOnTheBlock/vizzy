exports.Canvas = function() {
	this.shapes = [];
	this.canvasWidth = 1920; 
	this.canvasHeight = 1080;
	this.screenCanvasWidth;
	this.screenCanvasHeight;

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
		this.screenCanvasWidth = width;
		this.screenCanvasHeight = height;
	}


}
