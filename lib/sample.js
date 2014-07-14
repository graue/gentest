var PRNG = require('burtleprng');

var DEFAULT_COUNT = 10;

// TODO: should this have a size parameter? Should gentest.run be modified
// to use this routine instead of doing its own sampling?
function sample(gen, count) {
  if (arguments.length < 2) {
    count = DEFAULT_COUNT;
  }

  var rng = new PRNG(Date.now() & 0xffffffff);
  var results = new Array(count);
  for (var i = 0; i < count; i++) {
    results[i] = gen(rng, Math.floor(i/2) + 1);
  }
  return results;
}

module.exports = sample;
