var errors = require('./errors');

// Using the given PRNG, picks an int from low to high, inclusive.
function choose(prng, low, high) {
  return Math.floor(prng.float() * (high - low + 1) + low);
}

var t = {};

t.number = function(rng, size) {
  return rng.float() * size*2 - size;
};

t.number.nonNegative = function(rng, size) {
  return rng.float() * size;
};

t.suchThat = function(pred, gen, maxTries) {
  if (arguments.length < 3) maxTries = 10;

  return function(rng, size) {
    var triesLeft = maxTries;
    var val;
    do {
      val = gen(rng, size);
      if (pred(val)) {
        return val;
      }
    } while(--triesLeft > 0);
    throw new errors.GentestError('suchThat: could not find a suitable value');
  };
};

function isNonzero(x) {
  return x !== 0;
}

t.number.nonZero = t.suchThat(isNonzero, t.number);
t.number.positive = t.suchThat(isNonzero, t.number.nonNegative);

t.int = function(rng, size) {
  return choose(rng, -size, size);
};

t.int.nonNegative = function(rng, size) {
  return choose(rng, 0, size);
};

t.int.nonZero = t.suchThat(isNonzero, t.int);

t.int.positive = function(rng, size) {
  return choose(rng, 1, size + 1);
};

// FIXME: This should eventually generate non-ASCII characters, I guess.
t.char = function(rng, _) {
  return String.fromCharCode(choose(rng, 32, 126));
};

t.arrayOf = function(elemGen) {
  return function(rng, size) {
    var len = t.int.nonNegative(rng, size);
    var array = new Array(len);
    for (var i = 0; i < len; i++) {
      array[i] = elemGen(rng, size);
    }
    return array;
  };
};

t.fmap = function(fun, gen) {
  return function(rng, size) {
    return fun(gen(rng, size));
  };
};

t.string = t.fmap(function(chars) {
  return chars.join('');
}, t.arrayOf(t.char));

function constantly(x) {
  return function(_, _) {
    return x;
  };
}

t.oneOf = function(gens) {
  return function(rng, size) {
    var which = choose(rng, 0, gens.length-1);
    return gens[which](rng, size);
  };
};

t.elements = function(elems) {
  return t.oneOf(elems.map(constantly));
};

t.bool = t.elements([false, true]);

t.shape = function(obj) {
  return function(rng, size) {
    var out = {};
    Object.keys(obj).forEach(function(key) {
      out[key] = obj[key](rng, size);
    });
    return out;
  };
};

module.exports = t;
