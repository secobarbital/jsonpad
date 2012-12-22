var Buffer = require('buffer').Buffer,
    Stream = require('stream').Stream,
    util = require('util');

exports.StreamString = StreamString;

function StreamString(callback) {
  Stream.call(this);

  this.callback = callback;
  this.chunks = [];
  this.writable = true;
}
util.inherits(StreamString, Stream);

StreamString.prototype.write = function(chunk, encoding) {
  if ('string' === typeof chunk) chunk = new Buffer(chunk, encoding);
  this.chunks.push(chunk);
};

StreamString.prototype.end = function(chunk, encoding) {
  if ('string' === typeof chunk) chunk = new Buffer(chunk, encoding);
  if (chunk) this.chunks.push(chunk);
  this.callback(null, Buffer.concat(this.chunks).toString());
};
