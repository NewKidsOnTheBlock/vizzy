var d3 = require('d3');

exports.Shape = function(name, ctx, canvasScale) {
	// public member variables
    this.id = name;
    this.positionLink = "band1";
    this.position = {
        minX: 960, //These initial values were better for testing on my machine with 
        maxX: 960, //the app at half size. Original values commented out above
        minY: 540,
        maxY: 540 
    };
    this.type = "ellipse";
    this.angleLink = "band1";
    this.minAngle = 0;
    this.maxAngle = 90;
    this.colorLink = "band1";
    this.minColor = {
        red: 255,
        green: 0,
        blue: 0
    };
    this.colorLink = "band1";
    this.minOpacity = 50;
    this.maxOpacity = 100;
    this.maxColor = {
        red: 0,
        green: 255,
        blue: 0
    }
    this.sizeLink = "band1";
    this.minWidth = 15;
    this.maxWidth = 30;
    this.minHeight = 10;
    this.maxHeight = 50;
    
    //Private variables
    //Declaring a shape as this so our private functions can access our public variables
    var shape = this;
    var x = 20;
    var y = 20;
    var rotX = 20;
    var rotY = 20;
    var height = 10;
    var width = 15;
    var angle = 0;
    var opacity = .5;
    var color = {
        red: 255,
        green: 0,
        blue: 0
    }
    //Our canvas context
    var canvasCtx = ctx;
    //This helps us scale our shapes to our canvas size                
    var scale = canvasScale;

    //This function is used to reappend our svgs, just in case they were deleted
    this.reappend = function(canvas) {
        if(canvas) {
            canvasCtx = canvas;
        }
        if(!d3Obj) {

        }
    }

    this.updateShapeScale = function(newScale) {
        scale = newScale;
    }

    //Our update function for our shapes
    this.update = function(data) {
        
        //Update all of our shape attributes
        updateSize(data[this.sizeLink]);
        updatePos(data[this.positionLink]);
        updateAng(data[this.angleLink]);
        updateCol(data[this.colorLink]);

        //Begin our canvas path and set the fill color
        canvasCtx.beginPath();
        canvasCtx.fillStyle = 'rgba(' + Math.floor(color.red) + ',' + Math.floor(color.green) + ',' + Math.floor(color.blue) + ',' + opacity + ')';
        //We need to check if this is an ellipse, or rect because the two shapes are drawn differently.
        if(this.type === 'ellipse') {
            canvasCtx.ellipse(x, y, width, height, angle * Math.PI / 180, 0, 2 * Math.PI);
            canvasCtx.fill();
        }
        else if(this.type === 'rect') {
            //Save our context so we can rotate the canvas
            canvasCtx.save();
            //Rotate the canvas according to the shapes position, and the restore our context so other shapes won't be rotated too
            canvasCtx.translate(x+width/2,y+height/2)
            canvasCtx.rotate(angle * Math.PI / 180);
            canvasCtx.fillRect(-width/2, -height/2, width, height);
            canvasCtx.restore();
        }
        //Close our canvas path, THIS IS NECESSARY
        canvasCtx.closePath();
    }

    //Function to update the size, right now I'm defaulting to frequency which is being passed directly
    var updateSize = function(data) {
        width = scale.y * (shape.minWidth + ((shape.maxWidth-shape.minWidth) * data));
        height = scale.x * (shape.minHeight + ((shape.maxHeight-shape.minHeight) * data));
    }

    //Function to update the position
    var updatePos = function(data) {
        x = scale.x * (shape.position.minX + ((shape.position.maxX-shape.position.minX) * data));
        y =  scale.y * (shape.position.minY + ((shape.position.maxY-shape.position.minY) * data));

        if (shape.type === 'rect') {
            x = x - width/2;
            y = y - height/2;
        }
    }

    //Function to update the angle
    var updateAng = function(data) {
        angle = shape.minAngle + ((shape.maxAngle-shape.minAngle) * data);

        if (shape.type === 'rect') {
            rotX = x + width/2;
            rotY = y + height/2;
        }
        else {
            rotX = x;
            rotY = y;
        }
    }

    //Function to update the color
    var updateCol = function(data) {
        bigData = data * 100000000;
        littleData = bigData % 16777215;

        color.red = shape.minColor.red + ((shape.maxColor.red-shape.minColor.red) * data);
        color.green = shape.minColor.green + ((shape.maxColor.green-shape.minColor.green) * data);
        color.blue = shape.minColor.blue + ((shape.maxColor.blue-shape.minColor.blue) * data);

        opacity = (shape.minOpacity + ((shape.maxOpacity-shape.minOpacity) * data))/100;
    }

}