function makeGen(func, init) {
  var Gen = function(prng) {
    this.prng = prng;
    if (init) init.call(this);
  };
  Gen.prototype.next = function(size) {
    return func.call(this, this.prng, size);
  };
  return Gen;
}

// Using the given PRNG, picks an int from low to high, inclusive.
function choose(prng, low, high) {
  return Math.floor(prng.float() * (high - low + 1) + low);
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
// Answer: Don't need a new PRNG for sub-generators. As long as you call
// sub-generators in a deterministic order, just share the same one!
// On second thought: Oops! We do need a new PRNG if we can't change the
// "size" of the existing "chooser". Maybe choose should be a pure function?
// Being stateless and all...

t.int = makeGen(function(rng, size) {
  return choose(rng, -size, size);
});

t.int.nonNegative = makeGen(function(rng, size) {
  return choose(rng, 0, size);
});

// t.arrayOf = function(ElementGen) {
//   return makeGen(function(rng, size) {
//     var elementGen = new ElementGen(new PRNG(rng.next()));
//     elementGen.next(
//   var gen = new Gen(

module.exports = t;
