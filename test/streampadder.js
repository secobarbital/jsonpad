var fs = require('fs'),
    should = require('should');

var StreamPadder = require('../lib/streampadder').StreamPadder,
    StreamString = require('../lib/streamstring').StreamString;

describe('StreamPadder', function() {
  it('should pad a stream', function(done) {
    var callback = 'console.log',
        input = fs.createReadStream(__filename),
        expected = callback + '(' + fs.readFileSync(__filename, 'utf8') + ')',
        padder = new StreamPadder('console.log'),
        stringer = new StreamString(theTest);

    function theTest(err, str) {
      should.not.exist(err);
      str.should.equal(expected);
      done()
    }

    input.pipe(padder).pipe(stringer);
  });
});
