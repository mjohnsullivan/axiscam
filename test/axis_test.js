/**
 * Unit tests for the Axis API wrapper
 */

var assert = require('assert'),
    util = require('util'),
    http = require('http'),
    vapixEmulator = require('./vapix_emulator'),
    createClient = require('../lib/axis').createClient


describe('axis', function() {

    before(function() {
        this.vapixServer = vapixEmulator.startServer()
    })

    after(function() {
        this.vapixServer.close()
    })

    beforeEach(function() {
        this.axisCam = createClient({url: 'http://localhost:3000'})
    })

    describe('createClient()', function() {
        it('should create a new AxisCam instance with an internal active mjpg stream', function(done) {
            var that = this
            assert(this.axisCam)
            assert(this.axisCam.jpgStream)
            this.axisCam.jpgStream.once('data', function(data) {
                // Check valid start/end bytes for JPG
                assert.equal(data.readUInt16BE(0), 0xffd8)
                assert.equal(data.readUInt16BE(data.length-2), 0xffd9)
                done()
            })
        })
    })

    describe('imageStream()', function() {
        it('should return a valid stream of images', function(done) {
            var jpgCount = 0

            this.axisCam.jpgStream.on('data', function(data) {
                assert.equal(data.readUInt16BE(0), 0xffd8)
                assert.equal(data.readUInt16BE(data.length-2), 0xffd9)
                jpgCount++
            })

            this.axisCam.jpgStream.on('end', function() {
                assert.equal(jpgCount, 10)
                done()
            })

        })
    })

    describe('_image', function() {
        it('should hold a valid jpg of the last received image', function(done) {
            var that = this
            assert(!this.axisCam._image) // should be null as no images have been received yet
            this.axisCam.jpgStream.once('data', function(data) {
                assert(that.axisCam._image)
                assert.equal(that.axisCam._image.readUInt16BE(0), 0xffd8)
                assert.equal(that.axisCam._image.readUInt16BE(data.length-2), 0xffd9)
                done()
            })
        })
    })

    describe('image()', function() {
        it('should return the next image received from the camera', function(done) {
            this.axisCam.image(function(err, image) {
                assert.ifError(err)
                assert(image)
                assert.equal(image.readUInt16BE(0), 0xffd8)
                assert.equal(image.readUInt16BE(image.length-2), 0xffd9)
                done()
            })
        })
    })

    describe('time()', function() {
        it('should return the camera\'s time', function(done) {
            this.axisCam.time(function(err, time) {
                assert.ifError(err)
                assert(time)
                assert.deepEqual(time, new Date('Jul 24, 2013 19:19:17'))
                done()
            })
        })
    })

    describe('createMotionStream()', function() {
        it('should create a stream of motion events', function(done) {
            this.axisCam.createMotionStream(function(err, motionStream) {
                assert.ifError(err)

                motionStream.on('data', function(data) {
                    assert(data)
                    assert.equal(data.group, 0)
                    assert.equal(data.level, 0)
                    assert.equal(data.threshold, 10)
                })

                motionStream.on('end', function() {
                    done()
                })
            })

        })
    })

})