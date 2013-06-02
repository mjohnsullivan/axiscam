/**
 * Unit tests for the Axis API wrapper
 */

var assert = require('assert'),
    createClient = require('../lib/axis').createClient

describe('axis', function() {

    this.timeout(5000)

    beforeEach(function() {
        this.axisCam = createClient(JSON.parse(require('fs').readFileSync('./settings.json')))
    })

    describe('systemTime', function() {
        it('should provide the system time on the Axis camera', function(done) {
            this.axisCam.systemTime(function(err, time) {
                assert.ifError(err)
                assert(time instanceof Date)
                done()
            })

        })
    })

    describe('createImageStream', function() {
        it('should stream an image from an Axis camera', function(done) {
            this.axisCam.createImageStream(null, function(err, imageStream) {
                assert.ifError(err)

                var soi = false
                var buff

                imageStream.on('data', function(data) {
                    // Test for JPEG SOI
                    if (!soi) {
                        assert.equal(data.readUInt16BE(0), 0xffd8)
                        soi = true
                    }
                    buff = data
                })

                imageStream.on('end', function(data) {
                    // Test for JPEG EOI
                    assert.equal(buff.readUInt16BE(buff.length - 2), 0xffd9)
                    done()
                })
            })
        })
    })

})