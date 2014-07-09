# gentest

Property-based, generative testing for JavaScript (inspired by
Haskell's
[QuickCheck](http://www.haskell.org/haskellwiki/Introduction_to_QuickCheck2)).

Don't handwrite unit tests. Save time and catch more bugs by writing
properties, and let the computer generate test cases for you!


## Basic example

Let's say we want to test this add function:

```javascript
function add(x, y) {
  return x + y;
}
```

We can begin by asking, "What properties should this function have?"
One property is that it's commutative; `add(x, y)` should equal
`add(y, x)` for any numbers x and y. To test this, we write a function
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
            gentest.types.number /* type of x */,
            gentest.types.number /* type of y */);
```

Output:

```
+++ OK, passed 100 tests.
```


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

    gentest.run(prop_isCommutative, t.number, t.number);
  });
});
```


## API

### gentest.run(property, [numTests], argumentTypes...)

Runs `numTests` test cases against `property`, passing in arguments
with each of the `argumentTypes`. If `numTests` is not provided, it
defaults to 100.

Throws a GentestFailure error if a test fails. The error object will
have a `testCase` attribute that holds an array of all the generated
arguments that led to the failing test.

### gentest.types

Contains the following type definitions, with built-in generators:

* `number`
* `number.nonNegative`
* `number.nonZero`
* `number.positive`
* `int`
* `int.nonNegative`
* `int.nonZero`
* `int.positive`
* `char`
* `string`
* `bool`

And these higher-order type definitions:

* `arrayOf(type)`
* `oneOf(types)`: may be any of the given types
* `shape(object)`: object, with each key mapped to a value of the
  respective type

### Writing your own type definitions

You'll want to write your own type definitions for any type not built
into JavaScript, and thus, not specified in gentest. It's easy! You
just use `arrayOf`, `oneOf` and `shape` to compose primitive types.

Eventually, we will need fmap, suchThat and other similar stuff,
because this isn't enough, but for now, that's it!
