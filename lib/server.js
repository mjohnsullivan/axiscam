/**
 * HTTP server to Axis camera
 */

var http = require('http'),
    url = require('url'),
    es = require('event-stream')
    
var axis = require('./axis').createClient(JSON.parse(require('fs').readFileSync(__dirname + '/../settings.json')))

var raise500 = function(res) {
    res.statusCode = 500
    res.setHeader('Content-Type', 'text/plain')
    res.end('Error on server')
}

var handlers = {
    '/': function(req, res) {
        res.writeHead(200, {'Content-Type': 'application/json'})
        res.end(JSON.stringify({
            version: require('../package.json').version,
            time: new Date,
            message: 'Welcome to AxisCam'
        }))
    },
    '/time': function(req, res) {
        res.statusCode = 200
        res.setHeader('Content-Type', 'text/plain')
        axis.time(function(err, time) {
            if (err) return raise500(res)
            res.end(time.toString())
        })
    },
    '/image': function(req, res, query) {
        res.statusCode = 200
        res.setHeader('Content-Type', 'image/jpeg')
        res.setHeader('cache-control', 'no-cache')
        res.setHeader('pragma', 'no-cache')
        axis.createImageStream(query.size, function(err, stream) {
            if (err) return raise500(res)
            stream.pipe(res)
        })
    },
    '/video': function(req, res, query) {
        res.statusCode = 200
        res.setHeader('cache-control', 'no-cache')
        res.setHeader('pragma', 'no-cache')
        res.setHeader('Content-Type', 'multipart/x-mixed-replace; boundary=myboundary')

        axis.createVideoStream(query.size, function(err, stream) {
            if (err) return raise500(res)
            stream.pipe(res)
        })
        // axis.createVideoStream(query.size).pipe(res)
    },
    '/motion': function(req, res) {
        res.statusCode = 200
        res.setHeader('Content-Type', 'text/plain')
        axis.createMotionStream(function(err, stream) {
            if (err) return raise500(res)
            stream.pipe(es.stringify()).pipe(res)  
        })
    }
}

var route = function(req, res) {
    var uri = url.parse(req.url, true)
    var query = uri.query
    var path = uri.pathname

    if (handlers[path])
        handlers[path](req, res, query)
    else {
        // console.log('Invalid URL requested: ' + path);
        res.writeHead(404, {'Content-Type': 'text/html'})
        res.end('<h1>404</h1><p>Page not found</p>')
    }
}

http.createServer(route).listen(1337, '0.0.0.0')

console.log('Server running at http://127.0.0.1:1337/')