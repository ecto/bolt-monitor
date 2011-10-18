/*
 * jeans
 * cam@onswipe.com
 */

var fs = require('fs');

var jeans = {
  _path: __dirname + '/../config/',
  _env: 'production',
  _pocket: {},
  _backpocket: {},

  // load data to memory
  load: function(env){
    if (!env || typeof env != 'string') env = jeans._env;
    try {
      var raw = fs.readFileSync(jeans.drawer());
      jeans._backpocket = jeans._pocket;
      jeans._pocket = JSON.parse(raw);
    } catch (e) {
      console.log(e);
    }
  },

  // save data to disk
  save: function(){
    var raw = JSON.stringify(jeans._pocket);
    return fs.writeFileSync(jeans.drawer(), raw);
  },

  // create working directory
  create: function(){
    fs.mkdirSync(jeans._path, 0755);
  },

  // return working filename
  drawer: function(){
    return jeans._path + jeans._env + '.json';
  }
}



// bootstrap
try {
  fs.statSync(jeans.drawer());
  jeans.load();
} catch (e) {
  jeans.create();
}



// public methods

module.exports.get = function get(key, fallback){
  if (!key) throw new Error('Must pass key to retreive');
  return jeans._pocket[key] || fallback;
}

module.exports.set = function set(key, value){
  if (!key || !value) throw new Error('Must pass key and value to set');
  jeans._pocket[key] = value;
  return jeans.save();
}

module.exports.env = function env(env){
  if (typeof env != 'string') throw new Error('Environment must be a string');
  jeans._env = env;
  return jeans.load(env);
}

module.exports.clean = function clean(env){
  return fs.writeFileSync(jeans.drawer(), '');
}
