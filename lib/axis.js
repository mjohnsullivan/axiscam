/**
 * VAPIX API Node wrapper
 */

var url = require('url'),
    util = require('util'),
    events = require('events'),
    _ = require('underscore'),
    request = require('request'),
    motion = require('./motion3')

var sizes = {small: {resolution: 'QCIF'}, medium: {resolution: '320x240'}, large: {resolution: '640x480'}}
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
    if (options.motion) { // Motion events off by default
        this.detectMotion()
    }
}
util.inherits(AxisCam, events.EventEmitter)

/**
 * Starts motion detection and emits events when motion
 * exceeds the threshold on the camera
 */
AxisCam.prototype.detectMotion = function() {
    var that = this
    var reconnectDelay = 60 * 1000
    this.motionTimeoutId = null // Reset timeouts

    // Set up the motion stream if one doesn't exist already
    if (!this.motionStream) {
        this.motionStream = motion.createStream()

        this.motionStream.on('data', function(motion) {
            if (motion.level < motion.threshold)
                that.emit('motion', motion)
        })
    }

    var httpStream = request({
        url: this.buildURL('axis-cgi/motion/motiondata.cgi'),
        strictSSL: false,
        timeout: 5000
    })

    var startMotionTimeout = function(err) {
        if (err) console.error(err)
        if (!that.motionTimeoutId) { // Only start timeout if there isn't already one waiting
            console.log('Restarting motion detection in ' + reconnectDelay/1000 + ' seconds')
            that.motionTimeoutId = setTimeout(function() {
                that.detectMotion()
            }, reconnectDelay)
        }
    }

    httpStream.on('error', startMotionTimeout)
    httpStream.on('end', startMotionTimeout)

    httpStream.pipe(this.motionStream)
}

AxisCam.prototype.systemTime = function(cb) {
    request({
        url: this.buildURL('axis-cgi/date.cgi', {action: 'get'}), strictSSL: false
    }, function(err, res, body) {
        cb(err, new Date(body))
    })
}

AxisCam.prototype.buildURL = function(path, query) {
    return url.format(_.extend({}, this.url, {pathname: path, query: query}))
}

AxisCam.prototype.createImageStream = function(size) {
    return request({
        url: this.buildURL('axis-cgi/jpg/image.cgi', getSizeQuery(size)),
        strictSSL: false
    })
}

AxisCam.prototype.createVideoStream = function(size) {
    return request({
        url: this.buildURL('axis-cgi/mjpg/video.cgi', getSizeQuery(size)),
        strictSSL: false
    })
}

AxisCam.prototype.createAudioStream = function() {
    return request({
        url: this.buildURL('axis-cgi/audio/receive.cgi', {httptype: 'singlepart'}),
        strictSSL: false
    })
}

AxisCam.prototype.writeImages = function() {
    var FileOnWrite = require("file-on-write")

    var writer = new FileOnWrite({ 
    path: './video',
    ext: '.jpg'
    })

    this.createVideoStream().pipe(require('./mjpg-stream').createStream()).pipe(writer)
}

var createClient = exports.createClient = function(options) {
    return new AxisCam(options)
}

if (require.main === module) {
    var axis = createClient(JSON.parse(require('fs').readFileSync(__dirname + '/../settings.json')))
    
    axis.on('motion', function(data) {
        console.log(data)
    })

    //axis.createImageStream().pipe(require('fs').createWriteStream('./image.jpg'))
    axis.writeImages()
}