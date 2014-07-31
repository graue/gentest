// A small wrapper for thunks that caches the realized value.
//
// Public API:
//  .get(): Forces evaluation and returns the value.

var Thunk = function(f) {
  if (!(this instanceof Thunk)) {
    return new Thunk(f);
  }

  this._f = f;
  this._realized = false;
  return this;
};

Thunk.prototype = {
  get: function() {
    if (!this._realized) {
      this._value = this._f();
      this._realized = true;
      this._f = null;  // Allow closure to be garbage-collected.
    }
    return this._value;
  }
};

module.exports = Thunk;
