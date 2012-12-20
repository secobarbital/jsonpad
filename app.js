var http = require('http'),
    parse = require('url').parse,
    request = require('request'),
    zlib = require('zlib');

function handleClientResponse(req, res, callback) {
  return function(rec) {
    var client;

    res.setHeader('Content-Type', 'text/javascript');
    res.write(callback + '(');
    switch (rec.headers['content-encoding']) {
      case 'gzip':
        client = rec.pipe(zlib.createGunzip());
        break;
      case 'deflate':
        client = rec.pipe(zlib.createDeflate());
        break;
      default:
        client = rec;
        break;
    }
    client.on('end', function() {
      res.end(')');
    });
    client.pipe(res, {end: false});
  };
}

http.createServer(function (req, res) {
  var callback, client, target;

  url = parse(req.url, true);
  target = decodeURIComponent(url.pathname.substring(1));

  if (target.indexOf('http')) {
    res.writeHead(404);
    res.end();
    return;
  }

  if (url.query) {
    callback = url.query.callback;
  }

  if (!callback) {
    req.pipe(request(target)).pipe(res);
  } else {
    target = parse(target);
    target.headers = req.headers;
    req.pipe(require(target.protocol.replace(':', '')).request(target, handleClientResponse(req, res, callback)));
  }
}).listen(process.env.PORT || 3000, '127.0.0.1');
