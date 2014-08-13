// Basic generators and functions to combine them.

var RoseTree = require('./RoseTree');
var errors = require('./errors');
var shrink = require('./shrink');

var t = {};

// Returns a generator that ignores size and generates integers
// from low to high, inclusive, shrinking towards center, if
// provided.
t.choose = function(low, high, center) {
  if (arguments.length < 3) {
    center = low;
  }

  return function(rng, _size) {
    var n = Math.floor(rng.float() * (high - low + 1) + low);
    return new RoseTree(
      n,
      function() { return shrink.int(n, center); }
    );
  };
};

t.int = function(rng, size) {
  return t.choose(-size, size, 0)(rng, size);
};

t.int.nonNegative = function(rng, size) {
  return t.choose(0, size)(rng, size);
};

t.int.positive = function(rng, size) {
  return t.choose(1, size + 1)(rng, size);
};

t.suchThat = function(pred, gen, maxTries) {
  if (arguments.length < 3) maxTries = 10;

  return function(rng, size) {
    var triesLeft = maxTries;
    var tree;
    do {
      tree = gen(rng, size);
      if (pred(tree.root)) {
        return tree.filterSubtrees(pred);
      }
    } while(--triesLeft > 0);
    throw new errors.GentestError('suchThat: could not find a suitable value');
  };
};

function isNonzero(x) {
  return x !== 0;
}

t.int.nonZero = t.suchThat(isNonzero, t.int);

// FIXME: This should eventually generate non-ASCII characters, I guess.
t.char = function(rng, _size) {
  return t.choose(32, 126)(rng, _size).map(function(n) {
    return String.fromCharCode(n);
  });
};

t.arrayOf = function(elemGen) {
  return function(rng, size) {
    var len = t.int.nonNegative(rng, size).root;

    var elemTrees = new Array(len);
    for (var i = 0; i < len; i++) {
      elemTrees[i] = elemGen(rng, size);
    }

    return new RoseTree(
      elemTrees.map(function(tree) { return tree.root; }),
      function() {
        return shrink.array(elemTrees, true);
      }
    );
  };
};

t.tuple = function(gens) {
  var len = gens.length;
  return function(rng, size) {
    var elemTrees = new Array(len);
    for (var i = 0; i < len; i++) {
      elemTrees[i] = gens[i](rng, size);
    }

    return new RoseTree(
      elemTrees.map(function(tree) { return tree.root; }),
      function() {
        return shrink.array(elemTrees, false);
      }
    );
  };
};

// (a -> b) -> Gen a -> Gen b
// or
// (a -> b) -> (PRNG -> Int -> RoseTree a) -> (PRNG -> Int -> RoseTree b)
t.fmap = function(fun, gen) {
  return function(rng, size) {
    return gen(rng, size).map(fun);
  };
};

// Gen a -> (a -> Gen b) -> Gen b
// or
// (PRNG -> Int -> RoseTree a)
//  -> (a -> (PRNG -> Int -> RoseTree b))
//  -> (PRNG -> Int -> RoseTree b)
t.bind = function(gen, fun) {
  return function(rng, size) {
    return gen(rng, size).flatmap(function(value) {
      return fun(value)(rng, size);
    });
  };
};

t.string = t.fmap(function(chars) {
  return chars.join('');
}, t.arrayOf(t.char));

t.constantly = function(x) {
  return function(_rng, _size) {
    return new RoseTree(x);
  };
};

t.oneOf = function(gens) {
  if (gens.length < 1) {
    throw new errors.GentestError('Empty array passed to oneOf');
  }
  if (gens.length === 1) {
    return gens[0];
  }
  return t.bind(
    t.choose(0, gens.length-1),
    function(genIndex) {
      return gens[genIndex];
    }
  );
};

t.elements = function(elems) {
  if (elems.length < 1) {
    throw new errors.GentestError('Empty array passed to elements');
  }
  return t.oneOf(elems.map(t.constantly));
};

t.bool = t.elements([false, true]);

// Creates objects resembling the template `obj`, where each
// value in `obj` is a type generator.
t.shape = function(obj) {
  var attributeNames = [];
  var gens = [];

  Object.keys(obj).forEach(function(key) {
    attributeNames.push(key);
    gens.push(obj[key]);
  });

  var shapeify = function(tuple) {
    var obj = {};
    for (var i = 0; i < tuple.length; i++) {
      obj[attributeNames[i]] = tuple[i];
    }
    return obj;
  };

  return t.fmap(shapeify, t.tuple(gens));
};

module.exports = t;
