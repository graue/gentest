var PRNG = require('burtleprng');

// TODO: add a maxSize parameter somehow.
// Returns true if all tests passed.
function run(func, numTests, seed) {
  // Mess with arguments. Varargs are generator constructors,
  // and numTests and seed are optional so may also be
  // generator constructors.
  // (However, numTests must be provided if seed is.)
  var Generators = arguments.slice(3);

  var defaultSeed = Date.now();
  if (typeof seed === 'object') {
    Generators.unshift(seed);
    seed = defaultSeed;
  } else if (typeof seed === 'undefined') {
    seed = defaultSeed;
  } else if (typeof seed !== 'number') {
    throw new TypeError('Seed must be a number');
  }
  seed &= 0xffffffff;

  var DEFAULT_NUM_TESTS = 100;
  if (typeof numTests === 'object') {
    Generators.unshift(numTests);
    numTests = DEFAULT_NUM_TESTS;
  } else if (typeof numTests === 'undefined') {
    // This suggests your tests use no generators at all,
    // which seems an unlikely case, but whatever.
    numTests = DEFAULT_NUM_TESTS;
  } else if (typeof numTests !== 'number' || numTests < 1) {
    throw new TypeError('numTests must be a positive number');
  }
  numTests >>>= 0;

  return _run(func, numTests, seed, Generators);
}

function _run(func, numTests, seed, Generators) {
  var prng = new PRNG(seed);

  var gens = Generators.map(function(Cons) {
    return new Cons(new PRNG(prng.next()));
  });

  var somethingFailed = false;

  for (var x = 0; x < numTests; x++) {
    var size = Math.floor(x/2);
    var values = gens.map(function(gen) {
      return gen.next(size);
    });
    if (!func.apply(null, values)) {
      console.warn('Test failed! Test case:', values);
      somethingFailed = true;
    }
  }

  return !somethingFailed;
}

module.exports = run;
