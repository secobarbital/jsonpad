var http = require('http'),
    parse = require('url').parse,
    request = require('request'),
    StreamJsonP = require('./lib/streamjsonp').StreamJsonP;

var app = module.exports = http.createServer(function(req, res) {
  var callback, rec, target, url;

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

  rec = req.pipe(request(target));
  if (callback) {
    rec.pipe(new StreamJsonP(callback)).pipe(res);
  } else {
    rec.pipe(res);
  }
});

if ('undefined' === typeof beforeEach) app.listen(process.env.PORT || 3000);
