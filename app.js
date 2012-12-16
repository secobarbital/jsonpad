var http = require('http'),
    parse = require('url').parse,
    request = require('request');

http.createServer(function (req, res) {
  var callback, client, target;

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

  client = req.pipe(request(target));
  if (!callback) {
    client.pipe(res);
  } else {
    res.setHeader('Content-Type', 'text/javascript');
    client.once('data', function(chunk) {
      res.write(callback + '(');
      res.write(chunk);
      client.on('data', function(chunk) {
        res.write(chunk);
      });
    });
    client.on('end', function() {
      res.end(');');
    });
    client.on('error', function(exception) {
      res.trigger('error', exception);
    });
  }
}).listen(process.env.PORT || 3000, '127.0.0.1');
