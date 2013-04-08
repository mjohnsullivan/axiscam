/**
 * Parses out motion data from the Axis camera motion stream
 */
var util = require('util'),
    Stream = require('stream').Stream

var MotionLevelStream = function() {
    this.readable = true
    this.writable = true
}

util.inherits(MotionLevelStream, Stream)

MotionLevelStream.prototype.write = function(data) {
    var that = this
    // Important bit of the stream is: group=0;level=0;threshold=11;
    var match = data.toString().match(/group=\d+;level=\d+;threshold=\d+/g)
    match.forEach(function(motion) {
        var motionMatch = motion.match(/group=(\d+);level=(\d+);threshold=(\d+)/)
        that.emit('data', {level: motionMatch[2], threshold: motionMatch[3], group: motionMatch[1]})
    })
}

MotionLevelStream.prototype.end = function() {
    this.emit('end')
}

exports.createStream = function() {
    return new MotionLevelStream()
}