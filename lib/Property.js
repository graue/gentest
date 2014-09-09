"use strict";

// Create properties from functions.

var errors = require('./errors');
var types = require('./types');

var Property = function(func, name, gen) {
  if (!(this instanceof Property)) {
    return new Property(func, name, gen);
  }

  if (typeof func !== 'function' ||
      typeof name !== 'string' ||
      typeof gen !== 'function') {
    throw new errors.GentestError('Property constructor called with ' +
                                  'invalid arguments');
  }

  this._func = func;
  this.name = name;
  this._gen = gen;
};

// Generate a test case for the property.
Property.prototype.genTest = function(rng, size) {
  if (typeof size !== 'number' || size < 1) {
    throw new errors.GentestError('size must be a positive integer');
  }
  size |= 0;
  return this._gen(rng, size);
};

// Run a test case as returned from genTest.
// Returns an object:
// {
//   success: [boolean],
//   error: [if an uncaught exception was raised, the exception],
// }
Property.prototype.runTest = function(testCase) {
  var result = {};

  try {
    result.success = this._func.apply(null, testCase.root);
  } catch(e) {
    result.success = false;
    result.error = e;
  }

  return result;
};

// Returns an iterator (compliant with the ES6 iterator protocol) over
// shrunk versions of the failing `testCase`. This should be a test
// case returned by `.genTest` and which has resulted in a `{success:
// false}` return value from `.runTest`.
//
// Concretely, calling `.next()` on the returned iterator causes a
// shrunk test case to be executed, if any remain to be tried. The
// iterator will return something like:
//
// {
//   done: false,
//   value: {
//     testArgs: [the arguments tested],
//     result: [same as return value of .runTest()]
//   }
// }
//
// When the iterator finishes by returning `{done: true}`, the last
// value it produced where `result.success === false` (or the original
// `testCase`, if no such value was produced) should be considered the
// minimum failing test case.
//
Property.prototype.shrinkFailingTest = function(testCase) {
  // Implementation note: This would be clearer with coroutines (aka ES6
  // "generators" — unfortunate clash of terminology there). This function
  // basically fakes a coroutine, which requires explicitly keeping track
  // of the state between return values, namely:
  var node = testCase;  // The node whose children we are exploring.
  var childIndex = 0;   // The index of the child to explore next.
  var prop = this;      // (constant) Reference to `this`.

  return {next: function() {
    if (childIndex >= node.children().length) {
      return {done: true};
    }

    var child = node.children()[childIndex];
    var result = prop.runTest(child);
    if (!result.success) {
      node = child;
      childIndex = 0;
    } else {
      childIndex++;
    }

    return {
      done: false,
      value: {
        testArgs: child.root,
        result: result
      }
    };
  }};
};

// Implement the forAll(args, name, func) sugar, returning a Property.
Property.forAll = function(args, name, func) {
  // `args` may be an array of generators (positional arguments to `func`),
  // or an object with generators as values (named members of a single
  // object passed to `func`). Either way, we give the Property constructor
  // a single generator that generates an array of arguments.
  var gen = Array.isArray(args) ? types.tuple(args)
                                : types.tuple(types.shape(args));

  return new Property(func, name, gen);
};

module.exports = Property;
