axiscam
=======

Axis (VAPIX) camera control in Node

API
---

###createImageStream

Streams an image from the camera

```javascript
var axis = require('lib/axis'),
    fs = require('fs')

var axisCam = axis.createImageStream().pipe(fs.createWriteStream('./image.jpg'))
```

###createVideoStream

Streams MJPEG

###createMotionStream

Creates a stream of javascript objects that represent a snapshot of the Axis camera's motion detection:

```javascript
{group: "0", level: 2, threshold: 10}
```

```javascript
var axis = require('lib/axis'),
    es = require('event-stream')

var axisCam = axis.createMotionStream().pipe(es.stringify()).pipe(process.stdout)
```