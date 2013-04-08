/**
 * Unit tests for the Axis API wrapper
 */

var assert = require('assert'),
    createClient = require('../lib/axis').createClient

describe('axis', function() {

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

})