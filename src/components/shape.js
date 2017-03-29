var d3 = require('d3');

exports.Shape = function(name, canvas, canvasScale) {
	// public member variables
    this.id = name;
    this.position = {
     /* minX: 30,
        maxX: 50,
        minY: 30,
        maxY: 50 */
        minX: 1000, //These initial values were better for testing on my machine with 
        maxX: 1000, //the app at half size. Original values commented out above
        minY: 500,
        maxY: 500 
    };
    this.type = "square";
    this.minAngle = 0;
    this.maxAngle = 90;
    this.minColor = {
        red: 255,
        green: 0,
        blue: 0
    };
    this.maxColor = {
        red: 0,
        green: 255,
        blue: 0
    }
    this.rotation = 0;
    this.minWidth = 15;
    this.maxWidth = 30;
    this.minHeight = 10;
    this.maxHeight = 50;
    
    // Private variables
    //Declaring a shape as this so our private functions can access our public variables
    var shape = this;
    var x = 20;
    var y = 20;
    var height = 10;
    var width = 15;
    var angle = 0;
    var colorHex = "#0000ff";
    var color = {
        red: 255,
        green: 0,
        blue: 0
    }
    //Our d3 object
    var d3Obj = canvas.append('ellipse')
                    .attr('rx', this.minWidth)
                    .attr('ry', this.minHeight)
                    .attr('cx', this.position.x)
                    .attr('cy', this.position.y);
    //This helps us scale our shapes to our canvas size                
    var scale = canvasScale;

    //Public functionsheight
    //This function is used to clear our d3object when the editor is exited, just in case
    this.cleard3 = function() {
        d3Obj = null;
    }

    //This function is used to reappend our svgs, just in case they were deleted
    this.reappend = function(canvas) {
        if(!d3Obj) {
            console.log('append');
            d3Obj = canvas.append('ellipse')
                        .attr('rx', this.minWidth)
                        .attr('ry', this.minHeight)
                        .attr('cx', this.position.x)
                        .attr('cy', this.position.y);
        }
    }

    this.updateShapeScale = function(newScale) {
        scale = newScale;
    }

    //Our update function for our shapes
    this.update = function(data) {
        //assume data passed in is an integer from 0-100
        var freq = data.frequency;

        //simple toy algorithm, sets size to percentage of max size
        // this.height = freq*this.max_height
        // this.width = freq*this.max_width

        updateSize(freq);
        updatePos(freq);
        updateAng(freq);
        updateCol(freq);

        //Update our d3Obj if it is available
        if(d3Obj) {
            d3Obj.attr('rx', width)
                .attr('ry', height)
                .attr('cx', x)
                .attr('cy', y)
                .attr("transform", "rotate(" + angle + "," + x + "," + y + ")")
                .style('fill', d3.rgb(color.red, color.green, color.blue));
        };

    }

    //Function to update the size, right now I'm defaulting to frequency which is being passed directly
    var updateSize = function(data) {
        height = shape.minHeight + ((shape.maxHeight-shape.minHeight) * data);
        width = shape.minWidth + ((shape.maxWidth-shape.minWidth) * data);
    }

    //Function to update the position, default to frequency
    var updatePos = function(data) {
        x = scale.x * (shape.position.minX + ((shape.position.maxX-shape.position.minX) * data));
        y =  scale.y * (1080 -(shape.position.minY + ((shape.position.maxY-shape.position.minY) * data)));
    }

    //helper function for updateCol
    function decimalToHexString(number){
        if (number < 0){
            number = 0xFFFFFFFF + number + 1;
        }

    return number.toString(16).toUpperCase();
}

    var updateAng = function(data) {
        angle = shape.minAngle + ((shape.maxAngle-shape.minAngle) * data);
    }

    //Function to update the color, default to frequency
    var updateCol = function(data) {
        bigData = data * 100000000;
        littleData = bigData % 16777215;

        color.red = shape.minColor.red + ((shape.maxColor.red-shape.minColor.red) * data);
        color.green = shape.minColor.green + ((shape.maxColor.green-shape.minColor.green) * data);
        color.blue = shape.minColor.blue + ((shape.maxColor.blue-shape.minColor.blue) * data);

        
        // can do something like this \/ to have more control over the colors
       /* littleData = bigData % 225;

        if(bigData > 50000000){
             r = (littleData + 75) % 255;
             g = (littleData*.3);
             b = (littleData*.5);
             rHex = decimalToHexString(r);
             gHex = decimalToHexString(g);
             bHex = decimalToHexString(b);
        }
        else if(bigData > 35000000){
             b = (littleData + 75) % 255;
             g = (littleData*.5);
             r = (littleData*.3) ;
             rHex = decimalToHexString(r);
             gHex = decimalToHexString(g);
             bHex = decimalToHexString(b);

        }
        else{
             g = (littleData +75) % 255;
             b = (littleData*.5);
             r = (littleData*.3);
             rHex = decimalToHexString(r);
             gHex = decimalToHexString(g);
             bHex = decimalToHexString(b);
        }
        colorHex = rHex + bHex + gHex;*/

        colorHex = decimalToHexString(littleData);     
    }

}