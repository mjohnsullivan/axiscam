/**
 * VAPIX API Node wrapper
 */

var util = require('util'),
    url = require('url'),
    http = require('http'),
    https = require('https'),
    _ = require('underscore'),
    motion = require('./motion'),
    createJPGStream = require('./mjpg-stream').createStream

var imageSizes = {tiny: 'QCIF', small: '320x240', medium: '640x480', large: '800x600'}
var imageSize = imageSizes.small

/**
 * Wrapper for Axis camera VAPIX API
 *
 * url: the base URL for the camera
 * name: a name that's associated with the camera
 */
var AxisCam = function(options) {
    var that = this
    this.name = options.name

    // Record the url and protocol, ignore SSL certs
    this.url = url.parse(options.url)
    if (this.url.protocol.indexOf('https') === 0) {
        this.protocol = https
        this.url.rejectUnauthorized = false
    }
    else
        this.protocol = http

    // Set the size
    imageSize = imageSizes[options.size] || imageSize

    // Initialise the jpg stream
    this.jpgStream = createJPGStream()

    // Start the MJPEG stream
    this._createVideoStream()
}

/**
 * Make a HTTP GET to the camera using a specified path and query
 */
AxisCam.prototype._get = function(options, cb) {
    this.protocol.get(_.extend({}, this.url, {path: options.path}), function(res) {
        // Callback the stream if wanted
        if (options.stream)
            return cb(null, res)

        // Otherwise, read the data and callback that
        var cache = ''
        res.on('data', function(data) {
            cache += data.toString()
        })
        res.on('end', function() {
            return cb(null, cache)
        })
    })
}

/**
 * Starts the internal video stream capture from the camera
 * Will automatically reconnect when the stream is disconnected
 */
AxisCam.prototype._createVideoStream = function() {
    var that = this
    var reconnectDelay = 60 * 1000 // 60 seconds
    this.restartTimeoutId = null // Reset timeouts

    this._get({path: '/axis-cgi/mjpg/video.cgi?resolution=' + imageSize, stream: true}, function(err, vStream) {

        var restartTimeout = function() {
            // if (err) console.error(err)
            if (!that.restartTimeoutId) { // Only start timeout if there isn't one waiting
                that.restartTimeoutId = setTimeout(function() {
                    that._createVideoStream()
                }, reconnectDelay)
            }
        }

        vStream.on('error', restartTimeout)
        vStream.on('close', restartTimeout)
        vStream.on('end', restartTimeout)

        that.mjpgStream = vStream

        // Initialise the jpg stream
        // that.jpgStream = createJPGStream()

        // Record the latest image from the camera
        that._image = null
        that.jpgStream.on('data', function(image) {
            that._image = image
        })

        // Attach the stream
        vStream.pipe(that.jpgStream)
    })
}

/**
 * Returns a stream of JPG images (not an MJPG data stream)
 */
AxisCam.prototype.imageStream = function() {
    return this.jpgStream
}

/**
 * Returns a raw MJPG data stream
 */
AxisCam.prototype.videoStream = function() {
    return this.mjpgStream
}

/**
 * Streams a single image and then ends
 */
AxisCam.prototype.singleImageStream = function() {
}

/**
 * Returns the latest JPG image
 */
AxisCam.prototype.image = function(cb) {
    this.jpgStream.once('data', function(image) {
        cb(null, image)
    })
}

/**
 * Get the camera's time
 */
AxisCam.prototype.time = function(cb) {
    this._get({path: '/axis-cgi/date.cgi?action=get'}, function(err, time) {
        cb(null, new Date(time))
    })
}

/**
 * Returns a stream motion events from the camera
 */
AxisCam.prototype.createMotionStream = function(cb) {
    this._get({path: '/axis-cgi/motion/motiondata.cgi', stream: true}, function(err, stream) {
        cb(err, stream.pipe(motion.createStream()))
    })
}

/**
 * Use this to create a new AxisCam object
 */
var createClient = exports.createClient = function(options) {
    return new AxisCam(options)
}

/**
 * Some test code
 */
if (require.main === module) {
    var axis = createClient(JSON.parse(require('fs').readFileSync(__dirname + '/../settings.json')))
}