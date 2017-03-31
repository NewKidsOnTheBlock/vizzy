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

    this.update = function(){
        return new Promise(function(resolve, reject){
            var buffer = analyze.frequencyBinCount;
            var data = new Uint8Array(buffer);
            analyze.getByteFrequencyData(data);

            var mdata = {band1: 0};

            //find the dominant frequency bin
            var max = 0;
            var index = -1;
            var average = 0.0;
            var beat = 0;
            var split = Math.floor(data.length/5);
            var freqCount = 0;
            var splitCount = 1;
            
            for (var i = 0; i < data.length; i++){
                if (data[i]>max){
                    max = data[i];
                    index = i;
                }
                average += data[i];
                freqCount++;
                mdata['band' + splitCount] += data[i];

                if(i % split === 0 && splitCount < 5) {
                    mdata['band' + splitCount] = mdata['band' + splitCount]/freqCount;
                    splitCount++;
                    mdata['band' + splitCount] = 0;
                    freqCount = 0;
                }
            }

            mdata['band' + splitCount] = mdata['band' + splitCount]/freqCount;

            //calculate the dominant frequency
            var frequency = (index * 44100)/ 1024.0;
            average = (average/data.length)/255.0;

            if(frequency < 330 && average >= .2){
                //subtract threshold from freq so lower frequencies rate higher
                beat = (Math.abs(frequency-330.0) * average)/330.0; //divide total by maximum possible value (freq thresh)
            }

            mdata.frequency = frequency;
            mdata.volume = average;
            mdata.beat = beat;
            resolve(mdata);
        });

    }
}
