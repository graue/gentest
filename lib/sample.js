"use strict";

var PRNG = require('burtleprng');

var DEFAULT_COUNT = 10;

function getRoot(tree) {
  return tree.root;
}

// TODO: should this have a size parameter? Should gentest.run be modified
// to use this routine instead of doing its own sampling?
// raw is a secret undocumented option to enable debugging gentest itself.
// If true, this returns the entire tree for each generated value so shrunk
// versions can be examined.
function sample(gen, count, raw) {
  if (arguments.length < 2) {
    count = DEFAULT_COUNT;
  }

  var rng = new PRNG(Date.now() & 0xffffffff);
  var results = new Array(count);
  for (var i = 0; i < count; i++) {
    results[i] = gen(rng, Math.floor(i/2) + 1);
  }
  return raw ? results : results.map(getRoot);
}

module.exports = sample;
