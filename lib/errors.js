var ErrorSubclass = function ErrorSubclass() {};
ErrorSubclass.prototype = Error.prototype;

var GentestError = function GentestError() {
  if (!this instanceof GentestError) {
    throw new TypeError('GentestError must be called via new');
  }
  var tmp = Error.prototype.constructor.apply(this, arguments);
  if (tmp.stack) {
    this.stack = tmp.stack.replace(/^Error/, 'GentestError');
  }
  if (tmp.message) {
    this.message = tmp.message;
  }
  this.name = 'GentestError';
  return this;
};
GentestError.prototype = new ErrorSubclass();
GentestError.prototype.constructor = GentestError;

var FailureError = function FailureError() {
  GentestError.prototype.constructor.apply(this, arguments);
  if (this.stack) {
    this.stack = this.stack.replace(/^GentestError/, 'FailureError');
  }
  this.name = 'FailureError';
};
FailureError.prototype = new GentestError();
FailureError.prototype.constructor = FailureError;

exports.GentestError = GentestError;
exports.FailureError = FailureError;
