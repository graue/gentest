# gentest

Property-based, generative testing for JavaScript.

Don't handwrite unit tests. Save time and catch more bugs by writing
properties, and let the computer generate test cases for you!

(This is a work in progress. Consider it "[Stability 1:
Experimental](http://nodejs.org/api/documentation.html#documentation_stability_index)" for the time
being. Feedback welcome.)


## Basic example

Let's say we want to test this add function:

```javascript
function add(x, y) {
  return x + y;
}
```

We can begin by asking, "What properties should this function have?"
One property is that it's commutative; `add(x, y)` should equal
`add(y, x)` for any integers x and y. To test this, we write a function
that accepts a *particular* pair of values for x and y, and returns
true if the property holds for those inputs:

```javascript
var prop_isCommutative = function(x, y) {
  return add(x, y) === add(y, x);
};
```

Now, to test the property we call `gentest.run`, passing it the
property, and a description of the types of the property's arguments
(`x` and `y`):

```javascript
gentest.run(prop_isCommutative,
            gentest.types.int /* type of x */,
            gentest.types.int /* type of y */);
```

gentest then runs 100 tests, and complains if any of them fail.


## Integrating with test frameworks

gentest plays well with test frameworks. Here's a complete version of
the above example combined with
[Mocha](http://visionmedia.github.io/mocha/)'s BDD interface.

```javascript
var gentest = require('gentest');
var t = gentest.types;

function add(x, y) {
  return x + y;
}

describe('addition', function() {
  it('is commutative', function() {
    var prop_isCommutative = function(x, y) {
      return add(x, y) === add(y, x);
    };

    gentest.run(prop_isCommutative, t.int, t.int);
  });
});
```


## API

### gentest.run(property, [numTests], argumentTypes...)

Runs `numTests` test cases against `property`, passing in arguments
with each of the `argumentTypes`. If `numTests` is not provided, it
defaults to 100.

Throws a gentest.FailureError if a test fails. The error object will
have a `testCase` attribute that holds an array of all the generated
arguments that led to the failing test.

In many cases, gentest can "shrink" a failing test case to produce a
smaller one. If this happens, the `testCase` attribute will be the
minimal test case gentest was able to come up with, and the
`originalTestCase` attribute will hold the original, un-shrunk test
case that was generated at random.

### gentest.sample(type, [count])

Generates sample values of the given type.

### gentest.types

Contains the following type definitions, with built-in generators:

* `int`
* `int.nonNegative`
* `int.nonZero`
* `int.positive`
* `char`
* `string`
* `bool`


```javascript
gentest.sample(gentest.types.int);
// -> [ 0, 0, -1, 1, 0, 2, -2, 1, -2, -4 ]

gentest.sample(gentest.types.string);
// -> [ '', '', '', 'V', 'N', '{C', '(P', 'jb', 'I{=y', 'Ss' ]
```

And these higher-order type definitions:

#### arrayOf(type)

Produces arrays of the argument type.

```javascript
gentest.sample(gentest.types.arrayOf(gentest.types.bool));
// ->
// [ [],
//   [],
//   [ false ],
//   [ false ],
//   [ false ],
//   [ false ],
//   [ false, true, true ],
//   [ true, true, true ],
//   [ false,
//     false,
//     true,
//     true ],
//   [] ]
```

#### tuple(types)

Produces arrays that have one each of the given types, in order.

```javascript
var t = gentest.types;
gentest.sample(t.tuple([t.int, t.int, t.bool, t.string]))
// ->
// [ [ -1, -1, true, '' ],
//   [ 0, 0, true, 'B' ],
//   [ 2, 1, true, '!B' ],
//   [ 0, 0, true, '' ],
//   [ 2, 2, false, '\'D' ],
//   [ 2, 2, true, '@+' ],
//   [ 3, 1, true, '7gR]' ],
//   [ -2, 0, true, 'Z' ],
//   [ 0, -4, false, 'rr$:' ],
//   [ 5, 4, true, '' ] ]
```

#### oneOf(types)

Produces any of the given types.

```javascript
gentest.sample(gentest.types.oneOf([gentest.types.bool, gentest.types.int]));
// ->
// [ 0,
//   true,
//   1,
//   false,
//   true,
//   true,
//   true,
//   -1,
//   0,
//   -4 ]
```

#### constantly(x)

Returns a generator that always yields the constant value `x`.

#### elements(elems)

Any of the given elements.

```javascript
var foods = gentest.types.elements(['pizza', 'chocolate', 'sushi']);
gentest.sample(foods);
// ->
// [ 'sushi',
//   'pizza',
//   'pizza',
//   'chocolate',
//   'sushi',
//   'pizza',
//   'chocolate',
//   'chocolate',
//   'chocolate',
//   'sushi' ]
```

#### shape(object)

Produces objects, with each key mapped to a value of the respective
type.

```javascript
var person = gentest.types.shape({
  name: gentest.types.string,
  age: gentest.types.int.positive
});
gentest.sample(person);
// ->
// [ { name: '', age: 1 },
//   { name: '', age: 1 },
//   { name: 'y', age: 1 },
//   { name: '$', age: 2 },
//   { name: 'v', age: 3 },
//   { name: '~', age: 2 },
//   { name: 'vA', age: 2 },
//   { name: 'u', age: 4 },
//   { name: 'QWb', age: 2 },
//   { name: '5,r', age: 3 } ]
```

#### fmap(fun, type)

Maps a function over the generated values of the given type.

```javascript
var powersOfTwo = gentest.types.fmap(function(n) {
  return Math.pow(2, n);
}, gentest.types.int.nonNegative);

gentest.sample(powersOfTwo);
// -> [ 1, 1, 2, 2, 8, 4, 16, 32, 8, 2 ]
```

#### bind(type, fun)

A cousin of `fmap` where each generated value of `type` is mapped to a
second *generator*, which is then sampled.

```javascript
var t = gentest.types;
function isNonempty(xs) { return xs.length > 0; }

var intArray = t.suchThat(
  isNonempty,
  t.arrayOf(t.int.nonZero)
);

var arrayAndElement = t.bind(
  intArray,
  // This function takes an array *value*, generated by the outer
  // generator (intArray), and returns a *generator*: in this case,
  // an element selected from the array, together with the array
  // itself.
  function(ints) {
    return t.tuple([t.elements(ints), t.constantly(ints)]);
  }
);

gentest.sample(arrayAndElement);
// ->
// [ [ -1, [ -1 ] ],
//   [ -2, [ -2, 2 ] ],
//   [ -2, [ -3, -2, 2 ] ],
//   [  1, [ -3, 1 ] ],
//   [ -4, [ -4, -1, 2, -4 ] ],
//   [  2, [ 2 ] ],
//   [  4, [ 4, -5 ] ],
//   [ -2, [ 1, -2, -4, -1, -4, -2 ] ],
//   [  3, [ -4, 6, -5, 6, 3 ] ],
//   [ -6, [ -6, 1, 6, -3, -6 ] ] ]
```

#### suchThat(pred, type, [maxTries])

Produces values of `type` that pass the predicate `pred`. This should
be a predicate that will pass most of the time; you can't use this to
select for relatively rare values like prime numbers, perfect squares,
strings with balanced parentheses, etc.

This is used internally to implement `int.nonZero`:

```javascript
function isNonzero(x) {
  return x !== 0;
}
t.int.nonZero = t.suchThat(isNonzero, t.int);
```


## Credits

gentest is heavily influenced by
[QuickCheck](http://www.haskell.org/haskellwiki/Introduction_to_QuickCheck2)
and [test.check](https://github.com/clojure/test.check).
