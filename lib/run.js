var PRNG = require('burtleprng');
var errors = require('./errors');
var types = require('./types');

require('./util/polyfills/Array.find');

function getRoot(tree) {
  return tree.root;
}

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

function findMinFailingCase(tree, prop) {
  var node = tree;
  var firstFailingChild;
  var pred = function(testCaseTree) {
    return !prop.apply(null, testCaseTree.root);
  };

  while ((firstFailingChild = node.children().find(pred)) !== undefined) {
    node = firstFailingChild;
  }

  return node;
}

function _run(func, numTests, seed, gens) {
  var prng = new PRNG(seed);
  var tupleGen = types.tuple(gens);

  for (var x = 0; x < numTests; x++) {
    var size = Math.floor(x/2) + 1;
    var tree = tupleGen(prng, size);
    var testCase = tree.root;
    if (!func.apply(null, testCase)) {
      var msg = 'property ' + (func.name ? func.name + ' ' : '') +
                'violated';
      var e = new errors.FailureError(msg);
      e.testCase = findMinFailingCase(tree, func).root;
      e.originalTestCase = testCase;
      e.property = func.name;
      throw e;
    }
  }

  return true;
}

module.exports = run;
