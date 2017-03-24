var Canvas = function() {
	this.shapes = [];
	this.canvasWidth = 1920; 
	this.canvasHeight = 1080;

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
		canvasWidth = width;
		canvasHeight = height;
	}


}
