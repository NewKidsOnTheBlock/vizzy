var d3 = require('d3');

exports.Shape = function(name, canvas, canvasScale) {
	// public member variables
    this.id = name;
    this.position = {
        minX: 30,
        maxX: 50,
        minY: 30,
        maxY: 50
    };
    this.type = "square";
    this.color = "blue";
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
    //Our d3 object
    var d3Obj = canvas.append('ellipse')
                    .attr('rx', this.minWidth)
                    .attr('ry', this.minHeight)
                    .attr('cx', this.position.x)
                    .attr('cy', this.position.y);
    //This helps us scale our shapes to our canvas size                
    var scale = canvasScale;

    //Public functions
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

    //Our update function for our shapes
    this.update = function(data) {
        //assume data passed in is an integer from 0-100
        var freq = data.frequency;

        //simple toy algorithm, sets size to percentage of max size
        // this.height = freq*this.max_height
        // this.width = freq*this.max_width

        updateSize(freq);
        updatePos(freq);

        //Update our d3Obj if it is available
        if(d3Obj) {
            d3Obj.attr('rx', width)
                .attr('ry', height)
                .attr('cx', x)
                .attr('cy', y);
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
        y = scale.y * (shape.position.minY + ((shape.position.maxY-shape.position.minY) * data));
    }

}