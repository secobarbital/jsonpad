var Buffer = require('buffer').Buffer,
    http = require('http'),
    parse = require('url').parse,
    request = require('request'),
    zlib = require('zlib');

var Stream = require('stream').Stream,
    util = require('util');

function StreamFilter(callback) {
  var self = this;

  Stream.call(this);

  this.prologue = this.epilogue = function() {};
  this.readable = true;
  this.writable = true;

  if (callback) {
    self.prologue = function() {
      self.dst.write(new Buffer(callback + '('));
    };
    self.epilogue = function() {
      self.dst.write(new Buffer(')'));
    };
  }

  self.on('pipe', function(src) {
    self.src = src;
    src.on('response', hookup);
  });

  function hookup(res) {
    if (self.dst.setHeader) {
      for (var i in res.headers) {
        if (!~['content-length', 'content-type', 'content-encoding'].indexOf(i)) {
          self.dst.setHeader(i, res.headers[i]);
        }
      }
      self.dst.setHeader('content-type', 'text/javascript');
    }
    self.dst.statusCode = res.statusCode;
    self.prologue();
    if (~['gzip', 'deflate'].indexOf(res.headers['content-encoding'])) zipup();
  }

  function zipup() {
    var finalDst = self.dst;
    self.dst = zlib.createUnzip();
    self.dst.on('data', function(chunk) {
      finalDst.write(chunk);
    });
    self.dst.on('end', function() {
      finalDst.write(new Buffer(')'));
      finalDst.end();
    });
    self.epilogue = function() {};
  }
}
util.inherits(StreamFilter, Stream);

StreamFilter.prototype.pipe = function(dst) {
  this.dst = dst;
  return dst;
}

StreamFilter.prototype.write = function(chunk) {
  this.dst.write(chunk);
}

StreamFilter.prototype.end = function(chunk) {
  if (chunk) this.write(chunk);
  this.epilogue();
  this.dst.end();
}

http.createServer(function (req, res) {
  var callback, target, rec;

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
  if (!callback) {
    rec.pipe(res);
  } else {
    rec.pipe(new StreamFilter(callback)).pipe(res);
  }
}).listen(process.env.PORT || 3000, '127.0.0.1');
