var createServer = require('../');
var through = require('through');
var test = require('tap').test;
var net = require('net');

var server = createServer(function (req, res) {
    if (req.method === 'GET') {
        res.end('beep boop');
    }
    else {
        var rs = req.createRawStream();
        rs.pipe(process.stdout, { end : false });
        
        var bs = req.createRawBodyStream();
        bs.pipe(upper()).pipe(bs)
    }
});
server.listen(0);
var port = server.address().port;

server.on('listening', function () {
    test('simple GET', getTest);
    test('raw PUT', putTest);
    
    test(function (t) {
        server.close();
        t.end();
    });
});

function getTest (t) {
    t.plan(3);
    
    var c = net.connect(port);
    var data = '';
    c.on('data', function (buf) { data += buf });
    
    c.on('end', function () {
        var lines = data.split(/\r?\n/);
        t.equal(lines[0], 'HTTP/1.1 200 OK');
        t.ok(lines.some(function (line) {
            return line === 'beep boop'
        }));
        t.ok(lines.some(function (line) {
            return /^transfer-encoding:\s*chunked\s*$/i.test(line);
        }));
    });
    
    c.write([
        'GET / HTTP/1.1',
        'Host: beep.boop',
        '',
        ''
    ].join('\r\n'));
    c.end();
}

function putTest (t) {
    t.plan(1);
    t.pass();
}

function upper () {
    return through(function (buf) {
        this.emit('data', String(buf).toUpperCase());
    });
}