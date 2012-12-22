var Buffer = require('buffer').Buffer,
    http = require('http'),
    request = require('request'),
    should = require('should'),
    zlib = require('zlib');

var app = require('../app'),
    tpp = http.createServer(serveJson),
    json = '{"success":true}';

function serveJson(req, res) {
  var accepts = req.headers['accept-encoding'] || '',
      zipper;

  res.setHeader('Content-Type', 'application/json');

  if (~accepts.indexOf('gzip')) {
    res.setHeader('Content-Encoding', 'gzip');
    zipper = zlib.createGzip();
  } else if (~accepts.indexOf('deflate')) {
    res.setHeader('Content-Encoding', 'deflate');
    zipper = zlib.createDeflate();
  }

  if (zipper) {
    zipper.pipe(res);
    res = zipper;
  }

  res.end(json);
}

describe('jsonp', function() {
  var base, tase;

  before(function(done) {
    app.listen(0, function() {
      base = 'http://localhost:' + app.address().port;
      done();
    });
  });

  before(function(done) {
    tpp.listen(0, function() {
      tase = 'http://localhost:' + tpp.address().port;
      done();
    });
  });

  describe('without callback', function() {
    it('should support plain json', function(done) {
      var url = base + '/' + encodeURIComponent(tase);
      request(url, {json: true}, function(err, res, body) {
        should.not.exist(err);
        res.should.have.status(200);
        res.should.have.header('content-type', 'application/json');
        body.success.should.be.true;
        done();
      });
    });

    it('should support gzip', function(done) {
      var url = base + '/' + encodeURIComponent(tase),
          options = {headers: {'accept-encoding': 'gzip'}, json: true},
          req = request(url, options),
          unzipped = req.pipe(zlib.createGunzip()),
          chunks = [];

      req.on('response', function(res) {
        res.should.have.header('content-type', 'application/json');
        res.should.have.header('content-encoding', 'gzip');
        res.should.have.status(200);
      });

      unzipped.on('data', function(chunk) {
        chunks.push(chunk);
      });

      unzipped.on('end', function() {
        var body = Buffer.concat(chunks);
        JSON.parse(body).success.should.be.true;
        done();
      });
    });
  });

  describe('with callback', function() {
    it('should support plain json', function(done) {
      request(base + '/' + encodeURIComponent(tase) + '?callback=console.log', function(err, res, body) {
        should.not.exist(err);
        res.should.have.status(200);
        res.should.have.header('content-type', 'text/javascript');
        body.match(/console\.log\((.*)\)/)[1].should.equal(json);
        done();
      });
    });

    it('should support gzip', function(done) {
      var url = base + '/' + encodeURIComponent(tase) + '?callback=console.log',
          options = {headers: {'accept-encoding': 'gzip'}},
          req = request(url, options),
          unzipped = req.pipe(zlib.createGunzip()),
          chunks = [];

      req.on('response', function(res) {
        res.should.have.header('content-type', 'text/javascript');
        res.should.have.header('content-encoding', 'gzip');
        res.should.have.status(200);
      });

      unzipped.on('data', function(chunk) {
        chunks.push(chunk);
      });

      unzipped.on('end', function() {
        var body = Buffer.concat(chunks).toString();
        body.match(/console\.log\((.*)\)/)[1].should.equal(json);
        done();
      });
    });
  });
});
