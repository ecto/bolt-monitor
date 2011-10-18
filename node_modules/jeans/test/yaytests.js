var vows   = require('vows'),
    assert = require('assert');
    jeans  = require('../lib/jeans');

vows.describe('jeans').addBatch({

  'something': {
    topic: function(){ return jeans },
    'is an object': function(jeans){
      assert.equal(typeof jeans, 'object');
    }
  }
  
}).export(module);
