var d3 = require('d3');

exports.Shape = function(name, ctx, canvasScale) {
	// public member variables
    this.id = name;
    this.positionLink = "band1";
    this.position = {
        minX: 1000, //These initial values were better for testing on my machine with 
        maxX: 1000, //the app at half size. Original values commented out above
        minY: 500,
        maxY: 500 
    };
    this.type = "rect";
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
    
    // Private variables
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
    var canvasCtx = ctx;
    //This helps us scale our shapes to our canvas size                
    var scale = canvasScale;

    this.setProps = function() {
        x = 20;
        y = 20;
        height = 10;
        width = 15;
        angle = 0;
        color = {
            red: 255,
            green: 0,
            blue: 0
        }
    }

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

    this.switchShapeType = function() {
        console.log('switching to ' + this.type);
        d3Obj.remove();
        d3Obj = null;
        if (this.type === 'rect') {
            xAttr = 'x';
            yAttr = 'y';
            widthAttr = 'width';
            heightAttr = 'height';
        }
        else {
            xAttr = 'cx';
            yAttr = 'cy';
            widthAttr = 'rx';
            heightAttr = 'ry';
        }
        d3Obj = d3canvas.append(this.type)
                        .attr(widthAttr, this.minWidth)
                        .attr(heightAttr, this.minHeight)
                        .attr(xAttr, this.position.x)
                        .attr(yAttr, this.position.y);
    }

    //Our update function for our shapes
    this.update = function(data) {
        //assume data passed in is an integer from 0-100

        //simple toy algorithm, sets size to percentage of max size
        // this.height = freq*this.max_height
        // this.width = freq*this.max_width

        updateSize(data[this.sizeLink]);
        updatePos(data[this.positionLink]);
        updateAng(data[this.angleLink]);
        updateCol(data[this.colorLink]);

        //Update our d3Obj if it is available
        canvasCtx.fillStyle = 'rgba(' + Math.floor(color.red) + ',' + Math.floor(color.green) + ',' + Math.floor(color.blue) + ',' + opacity + ')';
        canvasCtx.fillRect(x, y, width, height);
    }

    //Function to update the size, right now I'm defaulting to frequency which is being passed directly
    var updateSize = function(data) {
        width = scale.y * (shape.minWidth + ((shape.maxWidth-shape.minWidth) * data));
        height = scale.x * (shape.minHeight + ((shape.maxHeight-shape.minHeight) * data));
    }

    //Function to update the position, default to frequency
    var updatePos = function(data) {
        x = scale.x * (shape.position.minX + ((shape.position.maxX-shape.position.minX) * data));
        y =  scale.y * (shape.position.minY + ((shape.position.maxY-shape.position.minY) * data));

        if (shape.type === 'rect') {
            x = x - width/2;
            y = y - height/2;
        }
    }

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

    //Function to update the color, default to frequency
    var updateCol = function(data) {
        bigData = data * 100000000;
        littleData = bigData % 16777215;

        color.red = shape.minColor.red + ((shape.maxColor.red-shape.minColor.red) * data);
        color.green = shape.minColor.green + ((shape.maxColor.green-shape.minColor.green) * data);
        color.blue = shape.minColor.blue + ((shape.maxColor.blue-shape.minColor.blue) * data);

        opacity = (shape.minOpacity + ((shape.maxOpacity-shape.minOpacity) * data))/100;
    }

}