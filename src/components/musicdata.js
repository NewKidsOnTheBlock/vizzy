exports.musicData = function(ctx, analyzeNode) {
    //initialize audio context & audio nodes
    var audioContext = ctx;
    var analyze = analyzeNode;
    var source = audioContext.createMediaElementSource(document.getElementById('vizzy-audio'));
    var analyze = audioContext.createAnalyser();
    analyze.fftsize=1024;
    analyze.smoothingTimeConstant=.5; //smoothing time is important for vizualization

    //connect audio nodes
    source.connect(analyze);
    analyze.connect(audioContext.destination);


    function averageFrequencySplits(freq) {
        for(var property in freq) {
            if(freq.hasOwnProperty(property)) {
                var total = 0;
                for(var i = 0; i < freq[property].length; i++) {
                    total+=freq[property][i];
                }
                freq[property] = total/freq[property].length;
            }
        }

        return freq;
    }

    //determines if freq is beat based on freq & loudness
    function isBeat(freq, avg){
        let beat = 0;
        if(freq < 330 && avg >= .2){
            //subtract threshold from freq so lower frequencies rate higher
            beat = (Math.abs(freq-330.0) * avg)/330.0; //divide total by maximum possible value (freq thresh)
        }
        return beat;
    }

    //updates music data
    this.update = function(){
        return new Promise(function(resolve, reject){
            //read fast fourier transform data from audio nodes
            let buffer = analyze.frequencyBinCount;
            let data = new Uint8Array(buffer);
            analyze.getByteFrequencyData(data);

            //create mdata object
            let mdata = {band1: 0};

            //these will be set in loop
            let max = 0;
            let index = -1;
            let average = 0.0;

            let split = Math.floor(data.length/5);
            let freqCount = 0;
            let splitCount = 1;

            //find the dominant frequency bin/bins/avg val
            for (let i = 0; i < data.length; i++){
                if (data[i]>max){
                    max = data[i];
                    index = i;
                }
                average += data[i];
                freqCount++;
                mdata['band' + splitCount] += data[i];

                //determine which split it is
                if(i % split === 0 && splitCount < 5) {
                    mdata['band' + splitCount] = mdata['band' + splitCount]/freqCount;
                    splitCount++;
                    mdata['band' + splitCount] = 0;
                    freqCount = 0;
                }
            }

            mdata['band' + splitCount] = mdata['band' + splitCount]/freqCount;

            //calculate the dominant frequency
            let frequency = (index * 44100)/ 1024.0;
            //calc average loudness
            average = (average/data.length)/255.0;

            //set mdata values & resolve
            mdata.frequency = frequency;
            mdata.volume = average;
            mdata.beat = isBeat(frequency, average);
            resolve(mdata)
        });

    }
}
