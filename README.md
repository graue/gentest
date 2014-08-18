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
`add(y, x)` for any integers x and y. To test this, we could write a
function that accepts a *particular* pair of values for x and y, and
returns true if the property holds for those inputs:

```javascript
var ourProperty = function(x, y) {
  return add(x, y) === add(y, x);
};
```

Such a function is called a **property** in Gentest, but we're not
quite finished. We also need to tell Gentest what `x` and `y` are so
it can generate sample values. For now, let's restrict our input
domain to integers, which we can create using the `gentest.types.int`
generator.

```javascript
var t = gentest.types;

forAll([t.int, t.int], 'addition is commutative', function(x, y) {
  return add(x, y) === add(y, x);
});
```

We now have a complete example and can run the tests using the
`gentest` executable. `npm install -g gentest`, then run `gentest`
with your test file as an argument.


## Concepts and terms

A **property** is a parameterized test: a function that takes any
number of arguments and returns a boolean, together with a description
of how to generate that function's arguments.

A **test** is a particular test case, that is, a set of arguments to a
property.


## API

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

This allows you to combine generators in ways you couldn't with just
`fmap`. For example, say you're testing a function similar to
`Array.prototype.indexOf`, and you want arrays together with an
element from the array:

```javascript
var t = gentest.types;
function isNonempty(xs) { return xs.length > 0; }

// Helper: Generate non-empty arrays of ints.
var intArray = t.suchThat(
  isNonempty,
  t.arrayOf(t.int)
);

var arrayAndElement = t.bind(
  intArray,

  // This function takes an array *value*, generated by the inner
  // generator (intArray), and returns a *generator*: in this case,
  // of elements selected from the array, paired with the array
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

A common use case is non-empty arrays:

```javascript
function isNonempty(xs) { return xs.length > 0; }

var nonemptyArray = t.suchThat(
  isNonempty,
  t.arrayOf(t.int)
);
```

If you can, it's better to generate the values you want directly
instead of filtering for them. For example, this is a not-so-great way
to generate multiples of 3:

```js
var threesBad = t.suchThat(
  function(n) { return n%3 === 0; },
  t.int.nonNegative);
```

This is a better way, more reliable and efficient:

```js
var threesGood = t.fmap(
  function(n) { return n*3; },
  t.int.nonNegative);
```


## Writing your own generators

A design goal of Gentest is that you as a user should never have to
write your own generators from scratch. Instead, everything you need
to test should be expressible in terms of the primitives above and
the higher-order generators like `fmap` and `bind`.

By doing it this way you get shrinking and repeatability of test cases
automatically for your new types.

How does this work in practice? Let's say you have a rectangle class
which contains x and y coordinates, a width, a height, and a method to
test if it's colliding with another rectangle:

```js
var Rect = function(x, y, w, h) {
  this.x = x;
  this.y = y;
  this.w = w;
  this.h = h;
}
Rect.prototype.isColliding = function(other) { /* ... */ };
```

To make a `Rect`, you essentially just need to create x, y, width and
height values and pass them to the constructor. You can generate the
values using `tuple`:

```js
t.tuple([t.int,          t.int,          // x, y
         t.int.positive, t.int.positive  // width, height. We don't want
                                         // these to be 0 or negative!
        ]);
```

Then map a function over each generated value:

```js
var genRect =
  t.fmap(
    function(tuple) {
      return new Rect(tuple[0], tuple[1], tuple[2], tuple[3]);
    },
    t.tuple([t.int,          t.int,
             t.int.positive, t.int.positive]));
```

And now use `genRect` in your properties just like a built-in type:

```js
forAll([genRect], 'rectangles collide with themselves', function(rect) {
  return rect.isColliding(rect);
});
```

Avoid calling `Math.random` in your functions, since if you do so,
test runs won't be repeatable. All randomness should come from the
built-in generators.

If the generator you want seems impossible to write, check the
[issues](https://github.com/graue/gentest/issues) because something
may be missing. And feel free to ask for help. But in general, with
`fmap` and `bind` you have a lot of power to build more sophisticated
generators.


## Credits

gentest is heavily influenced by
[QuickCheck](http://www.haskell.org/haskellwiki/Introduction_to_QuickCheck2)
and [test.check](https://github.com/clojure/test.check).
