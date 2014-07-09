function makeGen(func) {
  var Gen = function(prng) {
    this.prng = prng;
  };
  Gen.prototype.next = function(size) {
    return func(this.prng, size);
  };
  return Gen;
}

// Generator that picks an int from low to high, inclusive, not sized.
function choose(low, high) {
  return makeGen(function(rng, _) {
    return Math.floor(rng.float() * (high - low + 1) + low);
  });
}

var t = {};

t.number = makeGen(function(rng, size) {
  return rng.float() * size*2 - size;
});

t.number.nonNegative = makeGen(function(rng, size) {
  return rng.float() * size;
});

// I got confused writing this so let's do it later
// t.suchThat = function(pred, Gen, maxTries) {
//   if (arguments.length < 3) maxTries = 10;
//   return makeGen(function(rng, size) {
//     var gen = new Gen(

// TODO: t.number.nonZero, t.number.positive

// Okay, weird. Why do I have to create a new PRNG
// for sub-generators? And isn't it gonna be slow to create a new
// sub-generator *per test* when I delegate? Is there a better architecture
// here?

// Don't think I should have to do this, but for now:
var PRNG = require('burtleprng');

t.int = makeGen(function(rng, size) {
  var C = choose(-size, size);
  return new C(new PRNG(rng.next())).next();
});

t.int.nonNegative = makeGen(function(rng, size) {
  var C = choose(0, size);
  return new C(new PRNG(rng.next())).next();
});

// Problem: the generator function passed to makeGen doesn't have state.
// What it really should do is the generator initialize itself by creating
// each subgenerator it needs. Since we can't do that, we're wastefully
// creating a new subgenerator for each composite value. That is silly.
// Instead of *just* overriding the (stateless, except for the PRNG)
// generator function, we must also override the initializer. We need to
// subclass Generator.

t.arrayOf = function(ElementGen) {
  return makeGen(function(rng, size) {
    var elementGen = new ElementGen(new PRNG(rng.next()));
    elementGen.next(
  var gen = new Gen(

module.exports = t;
