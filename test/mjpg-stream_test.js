var assert = require('assert'),
    fs = require('fs'),
    createStream = require('../lib/mjpg-stream').createStream


describe('axis', function() {

    beforeEach(function() {
        this.fileStream = fs.createReadStream(__dirname + '/data/video.mjpg')
    })

    describe('imageStream', function() {
        it('should return a valid stream of images', function(done) {
            var jpgStream = createStream()
            var jpgCount = 0

            this.fileStream.pipe(jpgStream)

            jpgStream.on('data', function(data) {
                assert.equal(data.readUInt16BE(0), 0xffd8)
                assert.equal(data.readUInt16BE(data.length-2), 0xffd9)
                jpgCount++
            })

            jpgStream.on('end', function() {
                assert.equal(jpgCount, 10)
                done()
            })

        })
    })

})