// From MDN wiki - public domain
//
// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/find
//
// "Code samples added on or after August 20, 2010 are in the public domain. No
// licensing notice is necessary, but if you need one, you can use: 'Any
// copyright is dedicated to the Public Domain.
// http://creativecommons.org/publicdomain/zero/1.0/'."
//
// https://developer.mozilla.org/en-US/docs/MDN/About#Copyrights_and_licenses

if (!Array.prototype.find) {
  Object.defineProperty(Array.prototype, 'find', {
    enumerable: false,
    configurable: true,
    writable: true,
    value: function(predicate) {
      if (this == null) {
        throw new TypeError('Array.prototype.find called on null or undefined');
      }
      if (typeof predicate !== 'function') {
        throw new TypeError('predicate must be a function');
      }
      var list = Object(this);
      var length = list.length >>> 0;
      var thisArg = arguments[1];
      var value;

      for (var i = 0; i < length; i++) {
        if (i in list) {
          value = list[i];
          if (predicate.call(thisArg, value, i, list)) {
            return value;
          }
        }
      }
      return undefined;
    }
  });
}
