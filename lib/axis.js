/**
 * VAPIX API Node wrapper
 */

var util = require('util'),
    url = require('url'),
    http = require('http'),
    https = require('https'),
    _ = require('underscore'),
    motion = require('./motion2'),
    createJPGStream = require('./mjpg-stream').createStream

var imageSizes = {small: 'QCIF', medium: '320x240', large: '640x480'}
var imageSize = imageSizes.large

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

    // Record the latest image from the camers
    this._image = null
    this.jpgStream.on('data', function(image) {
        that._image = image
    })

    // Start the MJPEG stream
    this._createVideoStream(function(err, stream) {
        if (err) return console.error('Can\'t start internal video stream')
        that.mjpgStream = stream
        stream.pipe(that.jpgStream)
    })
}

/**
 * Make a HTTP GET to the camera using a specified path and query
 */
AxisCam.prototype._get = function(options, cb) {
    this.protocol.get(_.extend({}, this.url, {path: options.path}), function(res) {
        // Callback the stream if that's what's wanted
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
 * Create a MJPEG stream of live video from the camera
 * This is a stream of raw MJPG data
 */
AxisCam.prototype._createVideoStream = function(cb) {
    this._get({path: '/axis-cgi/mjpg/video.cgi?resolution=' + imageSize, stream: true}, cb)
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