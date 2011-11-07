/*
 * Bolt monitor
 * Cam Pedersen
 * Nov 7, 2011
 */

var express = require('express'),
    app     = express.createServer(),
    redis   = require('redis');

app.configure(function(){
  app.set('views', __dirname + '/views');
  app.set('view engine', 'ejs');
  app.use(express.logger());
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(express.cookieParser());
  app.use(express.session({ secret: 'your secret here' }));
  app.use(app.router);
  app.use(express.static(__dirname + '/public'));
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true })); 
});

app.get('/', function(req, res){
  res.render('index', {
    title: 'bolt status'
  });
});

app.listen(80);

var io = require('socket.io').listen(app);
io.set('log level', 0);

var r = redis.createClient();

r.psubscribe('bolt::*');

r.on('pmessage', function(){
  console.log(arguments);
});
