/**
 * MJPEG decoder for Axis cameras
 * Breaks the MJPEG stream into invidividual JPEG images
 */

var Transform = require('stream').Transform

Buffer.prototype.toByteArray = function () {
  return Array.prototype.slice.call(this, 0)
}

var MJPGStream = function() {
    Transform.call(this, {objectMode: true})
}

MJPGStream.prototype = Object.create(
  Transform.prototype, { constructor: { value: MJPGStream }})

MJPGStream.prototype._transform = function(data, encoding, cb) {
    // Step through the data, looking for start/end markers (SOI/EOI)
    for (var i = 0; i < data.length - 1; i++) {
        var num = data.readUInt16BE(i)
        if (num === 0xffd8) {
            this.imgBuff = []
        }
        else if (num === 0xffd9) {
            this.push(new Buffer(this.imgBuff.concat([0xff, 0xd9])))
            this.imgBuff = null
        }
        if (this.imgBuff)
            this.imgBuff.push(data[i])
    }
    cb()
}

exports.createStream = function() {
    return new MJPGStream()
}