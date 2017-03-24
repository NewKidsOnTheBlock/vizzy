var Shape = function() {
	// public member variables
    this.position = [50,50];
    this.type = "square";
    this.color = "blue";
    this.rotation = 0;
    this.width = 20;
    this.max_width = 30;
    this.min_width = 15;
    this.height = 20;
    this.max_height = 50;
    this.min_height = 10;
    // this.d3_object =  corey fill this in

    update: function(data) {
        //assume data passed in is an integer from 0-100
        var freq = data.frequency;
        freq = freq/100;
        //simple toy algorithm, sets size to percentage of max size
        this.height = freq*this.max_height
        this.width = freq*this.max_width
    }

}