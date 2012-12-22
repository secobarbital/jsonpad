var fs = require('fs'),
    should = require('should');

var StreamString = require('../lib/streamstring').StreamString;

describe('StreamString', function() {
  it('should return a string representation of a stream', function(done) {
    var ss = new StreamString(function(err, str) {
      should.not.exist(err);
      fs.readFile(__filename, 'utf8', function(err, data) {
        should.not.exist(err);
        str.should.equal(data);
        done();
      });
    });
    fs.createReadStream(__filename).pipe(ss);
  });

  it('should support writing strings and buffers', function(done) {
    var ss = new StreamString(function(err, str) {
      should.not.exist(err);
      str.should.equal('stringbufferend');
      done();
    });
    ss.write('string');
    ss.write(new Buffer('buffer'));
    ss.end('end');
  });
});
