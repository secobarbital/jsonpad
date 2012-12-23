var Stream = require('stream').Stream,
    util = require('util');

exports.StreamPadder = StreamPadder;

function StreamPadder(callback) {
  Stream.call(this);
  this.readable = true;
  this.writable = true;

  this.prologue = callback + '(';
  this.epilogue = ')';
  this.length = this.prologue.length + this.epilogue.length;
}
util.inherits(StreamPadder, Stream);

StreamPadder.prototype.pipe = function(dst) {
  this.dst = dst;
  return dst;
};

StreamPadder.prototype.write = function(chunk, encoding) {
  this.dst.write(this.prologue);
  this.dst.write(chunk, encoding);
  delete this.prologue;
};

StreamPadder.prototype.end = function(chunk, encoding) {
  if (chunk) this.dst.write(chunk, encoding);
  this.dst.write(this.epilogue);
  this.dst.end();
};
