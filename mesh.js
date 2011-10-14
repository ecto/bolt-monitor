/*
 * Mesh server
 * Cam Pedersen
 * Sept 8, 2011
 * Written on a plane from SFO to JFK
 *
 * Keep a pool of all nodes, handling mesh protocol
 * Disperse event emissions to all nodes in mesh
 * Don't fuck up
 */

var crypto  = require('crypto'),
    express = require('express'),
    app     = express.createServer(),
    net     = require('net'),
    rack    = require('hat').rack(),
    pool    = [];

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

/*
 * HTTP server
 * Render a page displaying the status of the mesh
 */
app.get('/', function(req, res){
  res.render('index', {
    title: 'status'
  });
});

app.get('/pool', function(req, res){
  var p = [];
  for (var id in pool) {
    var c = {
      id: id,
      join: pool[id].join
    }
    p.push(c);
  }
  res.send(p);
});

app.listen(80);

var io = require('socket.io').listen(app);
io.set('log level', 0);

/*
 * TCP server
 * Handle all mesh nodes
 * Broadcast emissions
 * Send whispers discretely
 */
var server = net.createServer(function (c) {
  /*
   * Allow a node to connect
   * Generate an id for the node
   * Add node to pool
   * Send confirmation
   */
  var id = rack();
  c.write(id);
  c.on('error', erred);
  c.on('data', incoming);
  c.on('close', disconnect);
  c.id = id;
  pool[id] = {
    c: c,
    join: +new Date()
  }
  console.log(id + ' connected');
  io.sockets.emit('connect', id);
});

server.listen(1234, function(c){
  console.log('Mesh server started...');
});

server.on('error', function(e){
  console.log(e);
});

/*
 * Server socket experienced an error
 */
var erred = function(e){
  console.log(e);
}

/*
 * Allow a node to disconnect
 * Remove from pool and send confirmation
 */
var disconnect = function(){
  delete pool[this.id];
  io.sockets.emit('disconnect', this.id);
  console.log(this.id + ' disconnected');
}

/*
 * TCP server recieved data
 * Handle event emissions
 * Handle node whipsers
 */
var incoming = function(m){
  m = m.toString();
  try {
    var message = JSON.parse(m);
    console.log(message.id + ' emitted ' + message.hook);
    if (message.hook == 'BCHANGENAME') {
      console.log(message.id + ' requested name ' + message.name);
      pool[message.name] = pool[message.id];
      delete pool[message.id];
      pool[message.name].c.id = message.name;
      pool[message.name].c.write('BNAMEACCEPT');
      io.sockets.emit('changename', { old: message.id, now: message.name });
    } else {
      broadcast(m);
    }
    io.sockets.emit('broadcast', m);
  } catch (e) {
    console.log('Could not parse:');
    console.log(m);
    throw e;
  }
};

/*
 * Broadcast a message to all nodes
 */
function broadcast(message) {
  setTimeout(function(){ // to not wait for loop to finish
    for (var i in pool) {
      if (pool[i].c.writable) pool[i].c.write(message);
    }
  }, 1);
}

/*
 * Generate a unique name for a node
 */
function generateID(seed){
  var exists = false,
      uid    = '';

  uid = crypto
       .createHash('sha1')
       .update(pool.length.toString())
       .digest('base64');

  uid.length = 10;
  console.log(uid);

  for (var i in pool) {
    if (pool[i].name === raw) {
      exists = true;
      break;
    }
  }

  if (!exists) return uid;
  else generateID();
}

