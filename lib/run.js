var PRNG = require('burtleprng');

// TODO: add a maxSize parameter somehow.
// Returns true if all tests passed.
function run(func, numTests, seed) {
  // Mess with arguments. Varargs are generators,
  // and numTests and seed are optional so may also be
  // generators.
  // (However, numTests must be provided if seed is.)
  var generators = [].slice.call(arguments, 3);

  var defaultSeed = Date.now();
  if (typeof seed === 'function') {
    generators.unshift(seed);
    seed = defaultSeed;
  } else if (typeof seed === 'undefined') {
    seed = defaultSeed;
  } else if (typeof seed !== 'number') {
    throw new TypeError('seed must be a number');
  }
  seed &= 0xffffffff;

  var DEFAULT_NUM_TESTS = 100;
  if (typeof numTests === 'function') {
    generators.unshift(numTests);
    numTests = DEFAULT_NUM_TESTS;
  } else if (typeof numTests === 'undefined') {
    // This suggests your tests use no generators at all,
    // which seems an unlikely case, but whatever.
    numTests = DEFAULT_NUM_TESTS;
  } else if (typeof numTests !== 'number' || numTests < 1) {
    throw new TypeError('numTests must be a positive number');
  }
  numTests >>>= 0;

  return _run(func, numTests, seed, generators);
}

function _run(func, numTests, seed, gens) {
  var prng = new PRNG(seed);
  var somethingFailed = false;

  for (var x = 0; x < numTests; x++) {
    var size = Math.floor(x/2) + 1;
    var values = gens.map(function(gen) {
      return gen(prng, size);
    });
    if (!func.apply(null, values)) {
      console.warn('Test failed! Test case:', values);
      somethingFailed = true;
    }
  }

  return !somethingFailed;
}

module.exports = run;
