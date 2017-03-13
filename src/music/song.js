var Song = function(data path) {
    this.artist = data.artist[0];
    this.album = data.album;
    this.title = data.title;
    this.number = data.track.no;
    this.albumImg = data.picture.data;
    this.albumImgExtension = data.picture.format;
}
