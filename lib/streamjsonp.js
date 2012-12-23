var Stream = require('stream').Stream,
    util = require('util'),
    zlib = require('zlib');

var StreamPadder = require('./streampadder').StreamPadder;

exports.StreamJsonP = StreamJsonP;

function StreamJsonP(callback) {
  Stream.call(this);

  this.readable = true;
  this.writable = true;

  var self = this;

  self.on('pipe', function(src) {
    src.on('response', function(res) {
      var dst = self.dst,
          padder = new StreamPadder(callback),
          encoding = res.headers['content-encoding'],
          length = res.headers['content-length'];

      if (dst.setHeader) {
        for (var i in res.headers) {
          dst.setHeader(i, res.headers[i]);
        }
        dst.setHeader('content-type', 'text/javascript');
      }
      dst.statusCode = res.statusCode;

      if (~['gzip', 'deflate'].indexOf(encoding)) {
        var unzipper = zlib.createUnzip(),
            zipName = encoding.replace(/./, function(f) { return f.toUpperCase() }),
            zipper = zlib['create' + zipName]();

        dst.removeHeader('content-length');
        self.dst = unzipper;
        unzipper.pipe(padder).pipe(zipper).pipe(dst);
      } else {
        if (length) dst.setHeader('content-length', length + padder.length);
        self.dst = padder;
        padder.pipe(dst);
      }
    });
  });
}
util.inherits(StreamJsonP, Stream);

StreamJsonP.prototype.pipe = function(dst) {
  this.dst = dst;
  return dst;
}

StreamJsonP.prototype.write = function() {
  this.dst.write.apply(this.dst, arguments);
}

StreamJsonP.prototype.end = function() {
  this.dst.end.apply(this.dst, arguments);
}
