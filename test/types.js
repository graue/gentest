var assert = require('assert');
var gentest = require('../index');
var t = gentest.types;

function isInt(n) {
  return typeof n === 'number' && Math.floor(n) === n;
}

function isPositiveInt(n) {
  return isInt(n) && n > 0;
}

function isNonZeroInt(n) {
  return isInt(n) && n !== 0;
}

function isNonNegativeInt(n) {
  return isInt(n) && n >= 0;
}

describe('int', function() {
  it('generates ints', function() {
    var ints = gentest.sample(t.int, 1000);
    assert(ints.every(isInt));
  });
});

describe('int.nonNegative', function() {
  it('generates non-negative ints', function() {
    var ints = gentest.sample(t.int.nonNegative, 1000);
    assert(ints.every(isNonNegativeInt));
  });
});

describe('int.nonZero', function() {
  it('generates nonzero ints', function() {
    var ints = gentest.sample(t.int.nonZero, 1000);
    assert(ints.every(isNonZeroInt));
  });
});

describe('int.positive', function() {
  it('generates positive ints', function() {
    var ints = gentest.sample(t.int.positive, 1000);
    assert(ints.every(isPositiveInt));
  });
});

function isAsciiChar(c) {
  return typeof c === 'string' && c.length === 1 &&
    c.charCodeAt(0) >= 32 && c.charCodeAt(0) <= 126;
}

describe('char', function() {
  it('generates printable ASCII characters', function() {
    var chars = gentest.sample(t.char, 1000);
    assert(chars.every(isAsciiChar));
  });
});

function isAsciiString(s) {
  return typeof s === 'string' && s.split('').every(isAsciiChar);
}

describe('string', function() {
  it('generates strings', function() {
    var strs = gentest.sample(t.string, 300);
    assert(strs.every(isAsciiString));
  });
});

function isBool(b) {
  return b === true || b === false;
}

describe('bool', function() {
  it('generates booleans', function() {
    var bools = gentest.sample(t.bool, 1000);
    assert(bools.every(isBool));
  });
});

function isArrayOf(func) {
  return function(a) {
    return Array.isArray(a) && a.every(func);
  }
}

describe('arrayOf', function() {
  it('generates int arrays', function() {
    var as = gentest.sample(t.arrayOf(t.int), 50);
    assert(as.every(isArrayOf(isInt)));
  });

  it('generates string arrays', function() {
    var as = gentest.sample(t.arrayOf(t.string), 50);
    assert(as.every(isArrayOf(isAsciiString)));
  });

  it('generates nested arrays', function() {
    var as = gentest.sample(t.arrayOf(t.arrayOf(t.bool)), 50);
    assert(as.every(isArrayOf(isArrayOf(isBool))));
  });
});

describe('tuple', function() {
  it('generates tuples', function() {
    var tuples = gentest.sample(t.tuple([t.char, t.int, t.int, t.bool]), 50);
    assert(tuples.every(function(tup) {
      return isAsciiChar(tup[0]) && isInt(tup[1]) && isInt(tup[2]) &&
        isBool(tup[3]);
    }));
  });
});

describe('oneOf', function() {
  it('applied to int and bool, produces either int or bool', function() {
    var oneofs = gentest.sample(t.oneOf([t.int, t.bool]), 1000);
    assert(oneofs.every(function(a) {
      return isInt(a) || isBool(a);
    }));
  });
});

describe('elements', function() {
  it('picks from a set of constant values', function() {
    var fruits = ['apple', 'banana', 'cherry', 'peach', 'grapes'];
    var elements = gentest.sample(t.elements(fruits), 1000);
    assert(elements.every(function(a) {
      return fruits.indexOf(a) !== -1;
    }));
  });
});

describe('shape', function() {
  it('produces objects given a template', function() {
    var template = {
      name: t.string,
      age: t.int.positive
    };
    var as = gentest.sample(t.shape(template), 200);
    assert(as.every(function(a) {
      return Object.keys(a).length === 2 && isAsciiString(a.name) &&
        isPositiveInt(a.age);
    }));
  });
});

// TODO: test fmap, suchThat, bind
