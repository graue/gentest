// Test runner for properties.

var PRNG = require('burtleprng');
var errors = require('./errors');

var write = process.stderr.write.bind(process.stderr);

var Runner = function() {
  this._currentCategory = [];
  this._categories = [{props: this._currentCategory}];
};

Runner.prototype.newCategory = function(name) {
  this._currentCategory = [];
  this._categories.push({name: name, props: this._currentCategory});
};

Runner.prototype.newProp = function(prop) {
  // prop should be an instance of Property
  this._currentCategory.push(prop);
};

// Given float `ratio` in [0, 1], return integer value in [min, max].
// interpolate(min, max, 0.0) === min
// interpolate(min, max, 1.0) === max
function interpolate(min, max, ratio) {
  return Math.floor(ratio * ((max + 0.5) - min) + min);
}

Runner.prototype.run = function(options) {
  var seed = ((options.seed || Date.now()) & 0xffffffff) | 0;
  var grep = options.grep;
  var numTests = options.numTests || 100;
  var maxSize = options.maxSize || 50;

  var rng = new PRNG(seed);

  for (var i = 0; i < this._categories.length; i++) {
    var cat = this._categories[i];

    if (grep) {
      cat = cat.filter(function(prop) {
        return prop.name.indexOf(grep) !== -1;
      });
    }

    if (cat.length < 1) continue;

    if (cat.name) {
      write('\n' + cat.name + ':\n');
    }

    for (var j = 0; j < cat.props.length; j++) {
      var prop = cat.props[j];
      var success = true;
      var error;
      var failingTestCase;

      for (var k = 1; k <= numTests; k++) {
        write('\r' + k + '/' + numTests + ' ' + prop.name);
        var size = interpolate(1, maxSize, k/numTests);
        var testCase = prop.genTest(rng, size);
        var result = prop.runTest(testCase);

        if (!result.success) {
          success = false;
          error = result.error;
          failingTestCase = testCase;
          break;
        }
      }

      write('\r' + (success ? '✓' : '✘') + ' ' + prop.name);
      if (success) {
        write(', passed ' + numTests + ' tests\n');
      } else {
        write(', counterexample found:\n');
        write(failingTestCase.root.toString() + '\n');
        if (error) {
          write('exception raised: ' + (error.name || '(no name)') + '\n');
          write(error.stack + '\n');
        }
      }
    }
  }
}

module.exports = Runner;
