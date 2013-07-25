/**
 * VAPIX API emulator
 */

var url = require('url'),
    http = require('http'),
    fs = require('fs')

var HOST = 'localhost'
var PORT = 3000

/**
 * Routes an incoming request to the correct handler
 */
var route = function(req, res) {
    var path = url.parse(req.url).pathname
    var query = url.parse(req.url, true).query

    if (path === '/axis-cgi/mjpg/video.cgi') {
        res.statusCode = 200
        res.setHeader('cache-control', 'no-cache')
        res.setHeader('pragma', 'no-cache')
        res.setHeader('Content-Type', 'multipart/x-mixed-replace; boundary=myboundary')
        fs.createReadStream(__dirname + '/data/video.mjpg').pipe(res)
    }
    else if (path === '/axis-cgi/date.cgi' && query.action === 'get') {
        res.writeHead(404, {'Content-Type': 'text/plain'})
        res.end('Jul 24, 2013 19:19:17')
    }
    else if (path === '/axis-cgi/motion/motiondata.cgi') {
        var counter = 0
        // Emit a motion event every half second
        res.writeHead(404, {'Content-Type': 'text/plain'})
        var emitMotion = function() {
            res.write('group=0;level=0;threshold=10;\n')
            if (++counter < 10)
                setTimeout(emitMotion, 100)
            else
                res.end()
        }
        emitMotion()
    }
    else {
        res.writeHead(404, {'Content-Type': 'text/html'})
        res.end('<h1>404</h1><p>Page not found</p>')
    }
}

/**
 * Start the HTTP server
 */
var startServer = exports.startServer = function() {
    return http.createServer(route).listen(PORT, HOST)
}

if (require.main === module) {
    startServer()
}