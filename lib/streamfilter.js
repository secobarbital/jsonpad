var Stream = require('stream').Stream,
    util = require('util'),
    zlib = require('zlib');

function StreamFilter(callback) {
  var self = this;

  Stream.call(this);

  this.prologue = this.epilogue = function() {};
  this.readable = true;
  this.writable = true;

  if (callback) {
    self.prologue = function() {
      this.dst.write(callback + '(');
    };
    self.epilogue = function() {
      this.dst.write(')');
    };
  }

  self.on('pipe', function(src) {
    self.src = src;
    src.on('response', hookup);
  });

  function hookup(res) {
    if (self.dst.headers) {
      self.dst.headers['content-type'] = 'text/javascript';
    }

    if (self.dst.setHeader) {
      for (var i in res.headers) {
        if (!~['content-length', 'content-type'].indexOf(i)) {
          self.dst.setHeader(i, res.headers[i]);
        }
      }
      self.dst.setHeader('content-type', 'text/javascript');
    }
    self.dst.statusCode = res.statusCode;

    if ('gzip' === res.headers['content-encoding']) {
      self.zipper = zlib.createGzip();
      unzip();
    } else if ('deflate' === res.headers['content-encoding']) {
      self.zipper = zlib.createDeflate();
      unzip();
    }

    self.prologue();
  }

  function unzip() {
    self.zipper.pipe(self.dst);
    self.dst = zlib.createUnzip();
    self.dst.pipe(self.zipper, {end: false});
    self.dst.on('end', function() {
      self.zipper.write(')');
      self.zipper.end();
    });
    self.zipper.write(callback + '(');
    self.prologue = self.epilogue = function() {};
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

exports.StreamFilter = StreamFilter;
