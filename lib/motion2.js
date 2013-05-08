/**
 * Parses out motion data from the Axis camera motion stream
 * Implemented with the new Node streams using prototypes
 */
var Transform = require('stream').Transform

var MotionLevelStream = function() {
    Transform.call(this, {objectMode: true})
}

MotionLevelStream.prototype = Object.create(
  Transform.prototype, { constructor: { value: MotionLevelStream }})

MotionLevelStream.prototype._transform = function(data, encoding, cb) {
    var that = this
    // Important bit of the stream is: group=0;level=0;threshold=11;
    var match = data.toString().match(/group=\d+;level=\d+;threshold=\d+/g)
    if (match)
        match.forEach(function(motion) {
            var motionMatch = motion.match(/group=(\d+);level=(\d+);threshold=(\d+)/)
            that.push({ group: Number(motionMatch[1]),
                        level: Number(motionMatch[2]),
                        threshold: Number(motionMatch[3]),
                        ts: new Date })
        })
    cb()
}

exports.createStream = function() {
    return new MotionLevelStream()
}