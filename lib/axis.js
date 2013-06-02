/**
 * VAPIX API Node wrapper
 */

var util = require('util'),
    events = require('events'),
    url = require('url'),
    http = require('http'),
    https = require('https'),
    _ = require('underscore'),
    motion = require('./motion2')

var sizes = {small: 'QCIF', medium: '320x240', large: '640x480'}
var defaultSize = 'medium'

/**
 * Returns an object for VAPIX image/video size that can be used in url.format
 */
var getSizeQuery = function(size) {
    return sizes[_.contains(_.keys(sizes), size) ? size : defaultSize]
}

/**
 * Wrapper for Axis camera VAPIX API
 *
 * url: the base URL for the camera
 * name: a name that's associated with the camera
 */
var AxisCam = function(options) {
    this.url = url.parse(options.url)
    this.name = options.name
    // Record the protocol and ignore SSL certs
    if (this.url.protocol.indexOf('https') === 0) {
        this.protocol = https
        this.url.rejectUnauthorized = false
    }
    else
        this.protocol = http

    if (options.motion) { // Motion events off by default
        this.detectMotion()
    }
}
util.inherits(AxisCam, events.EventEmitter)

/**
 * Make a get request to the camera using the specified path and query
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
 * Starts motion detection and emits events when motion
 * exceeds the threshold on the camera
 */
AxisCam.prototype.detectMotion = function() {
    var that = this
    var reconnectDelay = 60 * 1000 // 60 seconds
    this.motionTimeoutId = null // Reset timeouts

    // Set up the motion stream if one doesn't exist already
    if (!this.motionStream) {
        this.motionStream = motion.createStream()

        this.motionStream.on('data', function(motion) {
            if (motion.level >= motion.threshold)
                that.emit('motion', motion)
        })
    }

    this._get({path: '/axis-cgi/jpg/image.cgi', stream: true}, function(err, httpStream) {

        var startMotionTimeout = function(err) {
            if (err) console.error(err)
            if (!that.motionTimeoutId) { // Only start timeout if there isn't one waiting
                console.log('Restarting motion detection in ' + reconnectDelay/1000 + ' seconds')
                that.motionTimeoutId = setTimeout(function() {
                    that.detectMotion()
                }, reconnectDelay)
            }
        }

        httpStream.on('error', startMotionTimeout)
        httpStream.on('end', startMotionTimeout)

        httpStream.pipe(this.motionStream)
    })
}

/**
 * Get the system time on the camera
 */
AxisCam.prototype.systemTime = function(cb) {
    this._get({path: '/axis-cgi/date.cgi?action=get'}, function(err, data) {
        cb(null, new Date(data))
    })
}

/**
 * Create a stream of a JPEG from the camera
 */
AxisCam.prototype.createImageStream = function(size, cb) {
    this._get({path: '/axis-cgi/jpg/image.cgi?resolution=' + (sizes[size] || sizes[defaultSize]), stream: true}, cb)
}

/**
 * Create a MJPEG stream of live video from the camera
 */
AxisCam.prototype.createVideoStream = function(size, cb) {
    this._get({path: '/axis-cgi/mjpg/video.cgi?resolution=' + (sizes[size] || sizes[defaultSize]), stream: true}, cb)
}

/**
 * Stream any motion events coming from the Axis camera
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
    
    axis.on('motion', function(data) {
        console.log(data)
    })
}