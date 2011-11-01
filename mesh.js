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
    knife   = require('knife'),
    ekg     = require('ekg'),
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

ekg.on('proc', function(proc){
  console.log(proc.cpuPercent);
  if (proc.cpuPercent > 0.8) {
    console.log('Process eating too much CPU. Exiting.');
    process.exit();
  }
});
ekg.start(1000);

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

var messageBuffer = '';

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
  var reply = {
    id: 'server',
    hook: 'BINIT',
    data: {
      id: id
    }
  }
  c.write(JSON.stringify(reply));
  c.on('error', erred);
  c.on('data', incoming);
  c.on('close', disconnect);
  c.id = id;
  pool[id] = {
    c: c,
    join: +new Date()
  }
  console.log(id + ' connected from ' + c.remoteAddress);
  io.sockets.emit('connection', id);
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
  console.log('---------------------------');
  console.log(arguments);
  console.log('---------------------------');
}

/*
 * Allow a node to disconnect
 * Remove from pool and send confirmation
 */
var disconnect = function(){
  delete pool[this.id];
  io.sockets.emit('disconnection', this.id);
  console.log(this.id + ' disconnected');
}

/*
 * TCP server recieved data
 */
var incoming = function(m){
  m = m.toString();
  messageBuffer += m;
  var raw = knife.parse(messageBuffer);
  for (var i in raw.result) {
    processMessage(raw.result[i]);
  }
  messageBuffer = raw.remainder;
}

/*
 * Handle event emissions
 * Handle node whipsers
 */
var processMessage = function(m){
  try {
    console.log(m.id + ' emitted ' + m.hook);
    if (m.hook == 'BCHANGENAME') {
      console.log(m.id + ' requested name ' + m.data.name);
      var found = false,
          name;
      for (var i in pool) {
        if (pool[i].c.id == m.data.name) {
          found = true;
          break;
        }
      }
      if (found) {
        name = m.data.name + '-' + rack();
      } else {
        name = m.data.name;
      }
      pool[name] = pool[m.id];
      delete pool[m.id];
      pool[name].c.id = name;
      var reply = {
        id: 'server',
        hook: 'BNAMEACCEPT',
        data: {
          name: name
        }
      }
      pool[name].c.write(JSON.stringify(reply));
      io.sockets.emit('changename', {
        old: m.id,
        now: name
      });
      delete name;
    } else {
      broadcast(m);
    }
  } catch (e) {
    console.log('Could not parse:');
    console.log(m);
  }
};

/*
 * Broadcast a message to all nodes
 */
function broadcast(message) {
  setTimeout(function(){ // to not wait for loop to finish
    if (typeof message != 'string') message = JSON.stringify(message);
    for (var i in pool) {
      if (pool[i].c.writable) pool[i].c.write(message);
    }
    io.sockets.emit('broadcast', message);
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

