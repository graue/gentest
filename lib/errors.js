// Remove library code from the provided stack trace.
// This is a bit voodoo since the precise contents of the stack trace
// string vary by browser vendor.
//
// Example: We want to keep the first line and every line starting from
// "at Context.<anonymous>" (note that it's in a different project),
// but elide lines 2-6 in between.
//
// Error: property (anonymous function) failed to hold
//     at FailureError.Error (<anonymous>)
//     at FailureError.GentestError (/home/sf/code/immutable/node_modules/gentest/lib/errors.js:22:41)
//     at new FailureError (/home/sf/code/immutable/node_modules/gentest/lib/errors.js:32:38)
//     at _run (/home/sf/code/immutable/node_modules/gentest/lib/run.js:59:15)
//     at Object.run (/home/sf/code/immutable/node_modules/gentest/lib/run.js:37:10)
//     at Context.<anonymous> (/home/sf/code/immutable/test/index.js:44:20)
//     [... more lines not shown ...]
//
// TODO: Test to make sure this does reasonable things in browsers
// as well as Node.
//
function cleanupStack(str, errorName) {
  if (typeof str !== 'string') return str;

  var isLibraryCode = function(line) {
    return line.match(/\/gentest\//) ||
           line.match(/at( new)? (\w+)Error/);
  };

  var lines = str.split(/\n/);
  var i = 1;
  while (i < lines.length && isLibraryCode(lines[i])) {
    i++;
  }
  return [lines[0]].concat(lines.slice(i)).join('\n');
}

var ErrorSubclass = function ErrorSubclass() {};
ErrorSubclass.prototype = Error.prototype;

var GentestError = function GentestError() {
  if (!this instanceof GentestError) {
    throw new TypeError('GentestError must be called via new');
  }
  var tmp = Error.prototype.constructor.apply(this, arguments);
  if (tmp.stack) {
    this.stack = cleanupStack(tmp.stack).replace(/^Error/, 'GentestError');
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
