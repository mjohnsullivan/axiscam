/**
 * VAPIX API Node wrapper
 */

var url = require('url'),
    util = require('util'),
    _ = require('underscore'),
    request = require('request'),
    motion = require('./motion')

var sizes = {small: {resolution: 'QCIF'}, medium: {resolution: '320x240'}, large: {resolution: '640x480'}}

var AxisCam = function(options) {
    this.url = url.parse(options.url)
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

AxisCam.prototype.createImageStream = function() {
    return request({
        url: this.buildURL('axis-cgi/jpg/image.cgi', sizes.medium),
        strictSSL: false
    })
}

AxisCam.prototype.createVideoStream = function() {
    return request({
        url: this.buildURL('axis-cgi/mjpg/video.cgi', sizes.medium),
        strictSSL: false
    })
}

AxisCam.prototype.createAudioStream = function() {
    return request({
        url: this.buildURL('axis-cgi/audio/receive.cgi', {httptype: 'singlepart'}),
        strictSSL: false
    })
}

AxisCam.prototype.createMotionStream = function(cb) {
    return request({
        url: this.buildURL('axis-cgi/motion/motiondata.cgi'),
        strictSSL: false
    }).pipe(motion.createStream())
}

var createClient = exports.createClient = function(options) {
    return new AxisCam(options)
}

if (require.main === module) {
    var axis = createClient(JSON.parse(require('fs').readFileSync(__dirname + '/../settings.json')))
    //axis.createImageStream().pipe(require('fs').createWriteStream('./image.jpg'))
}