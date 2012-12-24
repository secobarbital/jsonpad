var http = require('http'),
    fs = require('fs'),
    parse = require('url').parse,
    request = require('request');

var StreamJsonP = require('./lib/streamjsonp').StreamJsonP;

var app = module.exports = http.createServer(function(req, res) {
  function handleError(err, statusCode) {
    res.writeHead(statusCode || 500);
    res.end(err.toString());
  }

  var callback, client, padder, target, url;

  if ('GET' !== req.method) {
    return handleError('Come GET me', 405);
  }

  url = parse(req.url, true);

  if (url.query) {
    target = url.query.url;
    callback = url.query.callback;
  } else {
    res.setHeader('Content-Type', 'text/html');
    fs.createReadStream('index.html').pipe(res);
    return;
  }

  if (!callback || !target || target.toLowerCase().indexOf('http')) {
    return handleError('Give me a url and a callback', 400);
  }

  try {
    client = request(target);
    padder = new StreamJsonP(callback);

    client.on('error', handleError);
    padder.on('error', handleError);

    req.pipe(client).pipe(padder).pipe(res);
  } catch(err) {
    return handleError(err, 400);
  }
});

if ('undefined' === typeof beforeEach) app.listen(process.env.PORT || 3000);
