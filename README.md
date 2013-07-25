[![Build Status](https://travis-ci.org/mjohnsullivan/axiscam.png)](http://travis-ci.org/mjohnsullivan/axiscam)

AxisCam
=======

Axis (VAPIX) camera control in Node

Run
---

To run, make a settings.json file in the root folder:

```json
{
    "url": "https://<user>:<passwd>@<addr>",
    "name": "Name for the camera",
    "motion": false
}
```

This provides the address and credentials for the camera, an optional name and whether to emit
any detected motion events (defaults to false). 

Test
----

To run the tests, create a settings.json file in the test folder to point to a test camera.

Motion Detection
----------------

If motion detection is activted, a motion stream is automatically started and any motion messages
where the motion value exceeds the threshold value is emitted.

```javascript
var axis = require('lib/axis'),
    util = require('util')

var axisCam = axis.createClient({url: 'https://<user>:<passwd>@<addr>'})

axis.on('motion', function(data) {
        util.inspect(data)
})
```

API
---

###createImageStream

Streams an image from the camera:

```javascript
var axis = require('lib/axis'),
    fs = require('fs')

var axisCam = axis.createClient({url: 'https://<user>:<passwd>@<addr>'})
axisCam.createImageStream(null, function(err, stream) {
    stream.pipe(fs.createWriteStream('./image.jpg'))  
})
```

###createVideoStream

Streams MJPEG

###createMotionStream

Creates a stream of javascript objects that represent a snapshot of the Axis camera's motion detection:

```javascript
{group: 0, level: 2, threshold: 10}
```

```javascript
var axis = require('lib/axis'),
    es = require('event-stream')

var axisCam = axis.createClient({url: 'https://<user>:<passwd>@<addr>'})
axisCam.createMotionStream(function(err, stream) {
    stream.pipe(es.stringify()).pipe(process.stdout)  
})
```