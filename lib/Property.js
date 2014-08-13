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
