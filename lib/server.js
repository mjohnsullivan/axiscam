/**
 * HTTP server to Axis camera
 */

var http = require('http'),
    url = require('url')
    
var axis = require('./axis').createClient(JSON.parse(require('fs').readFileSync(__dirname + '/../settings.json')))

var handlers = {
    '/': function(req, res) {
        res.writeHead(200, {'Content-Type': 'application/json'});
        res.end(JSON.stringify({
            version: require('../package.json').version,
            time: new Date,
            message: 'Welcome to AxisCam'
        }));
    },
    '/image': function(req, res) {
        res.statusCode = 200
        res.setHeader('Content-Type', 'img/jpeg')
        axis.createImageStream().pipe(res)
    },
    '/video': function(req, res) {
        res.statusCode = 200
        res.setHeader('Content-Type', 'img/jpeg')
        axis.createVideoStream().pipe(res)
    },
    '/audio': function(req, res) {
        res.statusCode = 200
        res.setHeader('Content-Type', 'audio/basic')
        axis.createAudioStream().pipe(res)
        setTimeout(function() { res.end() }, 10000)
    }
};

var route = function(req, res) {
    var uri = url.parse(req.url, true)
    var path = uri.pathname

    if (handlers[path])
        handlers[path](req, res)
    else {
        // console.log('Invalid URL requested: ' + path);
        res.writeHead(404, {'Content-Type': 'text/html'})
        res.end('<h1>404</h1><p>Page not found</p>')
    }
};

http.createServer(route).listen(1337, '127.0.0.1')

console.log('Server running at http://127.0.0.1:1337/')