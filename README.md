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

Run mocha on the test directory. A dummy VAPIX API server is used to stub out the camera for testing
the Axis integration.

API
---

###videoStream

Streams raw MJPEG data; handy for proxying the MJPEG stream from the camera to other sources.

###imageStream

Streams Javascript objects that encapsulate a raw JPEG image; it effectively strips out the images
from the MJPEG stream, returning complete images sequentially.

```javascript
var axis = require('lib/axis'),
    fs = require('fs')

var axisCam = axis.createClient({url: 'https://<user>:<passwd>@<addr>'})
axisCam.imageStream(null, function(err, stream) {
    stream.pipe(fs.createWriteStream('./image.jpg'))
})
```

###image

Passes back the next image from the camera in the callback.

###createMotionStream

Creates a stream of javascript objects that represent the state of the Axis camera's motion detection:

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

###time

Passes back the camera's system time in the callback.