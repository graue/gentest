// Routines to shrink primitive types, returning a rose tree of
// "smaller" values of that type, with more drastic shrinking
// possibilities appearing first.

var RoseTree = require('./RoseTree');


// Bear with me... the next two functions may look a little
// confusing, but they enable the individual shrink functions
// to avoid dealing directly with rose trees.
//
// XXX: Is this approach still worthwhile given I only ended up
// using these on one shrink function?


// Given array and fun, returns an array of rose trees where each
// tree's root is the element and its children are fun(element).
// [a] -> (a -> [a]) -> RoseTree a
function arrayToRoseTrees(array, fun) {
  return array.map(function(element) {
    return new RoseTree(element, function() { return fun(element); });
  });
}

// Takes a shrink function that returns a list of smaller values,
// and returns a shrink function that returns a rose tree, with
// the same shrink function used for further shrinks.
//
// (a -> [a]) -> (a -> [RoseTree a])
// ... with a caveat:
//
// If f takes 2 or more args, we assume the first arg is the value
// to shrink and we replace that in recursive calls while propagating
// the rest.
function roseify(f) {
  var roseified = function() {
    var restArgs = [].slice.call(arguments, 1);
    return arrayToRoseTrees(
      f.apply(null, arguments),
      function(value) {
        return roseified.apply(null, [value].concat(restArgs));
      }
    );
  };
  return roseified;
}


// Now that we have roseify, we'll write all our shrink functions
// to simply return lists, then wrap each shrink function with
// roseify.

function roundTowardZero(x) {
  if (x < 0) {
    return Math.ceil(x);
  }
  return Math.floor(x);
}

// Shrink integer n towards center.
// If n !== center, at least center and the integer one closer to center
// are guaranteed to be tried.
exports.int = roseify(function(n, center) {
  var diff = center - n;
  var out = [];
  while (Math.abs(diff) >= 1) {
    out.push(n + roundTowardZero(diff));
    diff /= 2;
  }
  return out;
});

// Array shrinking takes an array of rose trees, so we can use the
// shrunken versions of each individual element.
// If tryRemoving is falsy, we will only shrink individual elements,
// not attempt removing elements. This makes the same shrink function
// suitable for tuples (i.e. fixed-length, heterogeneous arrays).
// shrink.array :: [RoseTree a] -> Bool -> [RoseTree [a]]
exports.array = function(xtrees, tryRemoving) {
  var withElemsRemoved = []; // [[RoseTree a]]
  var withElemsShrunk = []; // [[RoseTree a]]
  var i;

  // For each element, push a modified array with that element removed
  // to withElemsRemoved, and potentially many modified arrays with that
  // element shrunk to withElemsShrunk.
  xtrees.forEach(function(xtree, index) {
    var xtreesBefore = xtrees.slice(0, index);
    var xtreesAfter  = xtrees.slice(index + 1);

    if (tryRemoving) {
      withElemsRemoved.push(xtreesBefore.concat(xtreesAfter));
    }

    xtree.children().forEach(function(childNode) {
      var withAnElemShrunk = xtreesBefore.concat([childNode])
                                         .concat(xtreesAfter);
      withElemsShrunk.push(withAnElemShrunk);
    });
  });

  // xtreesToArray :: [RoseTree a] -> RoseTree [a]
  // FIXME: This is duplication of code in types.arrayOf.
  var xtreesToArray = function(xts) {
    return new RoseTree(
      xts.map(function(tree) { return tree.root; }),
      function() {
        return exports.array(xts, tryRemoving);
      }
    );
  };

  return withElemsRemoved.concat(withElemsShrunk).map(xtreesToArray);
};
