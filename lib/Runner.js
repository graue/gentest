"use strict";

// Test runner for properties.

var PRNG = require('burtleprng');
var errors = require('./errors');

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
  var write = options.silent ? function() {} :
                               process.stderr.write.bind(process.stderr);

  var propsRun = 0;
  var propsFailed = 0;

  var rng = new PRNG(seed);

  for (var i = 0; i < this._categories.length; i++) {
    var cat = this._categories[i];
    var catProps = cat.props;

    if (grep) {
      catProps = catProps.filter(function(prop) {
        return prop.name.indexOf(grep) !== -1;
      });
    }

    if (cat.length < 1) continue;

    if (cat.name) {
      write('\n' + cat.name + ':\n');
    }

    for (var j = 0; j < catProps.length; j++) {
      var prop = catProps[j];
      var success = true;
      var error;
      var testCaseTree;
      var failingCase;

      for (var k = 1; k <= numTests; k++) {
        write('\r' + k + '/' + numTests + ' ' + prop.name);
        var size = interpolate(1, maxSize, k/numTests);
        testCaseTree = prop.genTest(rng, size);
        var result = prop.runTest(testCaseTree);

        if (!result.success) {
          success = false;
          error = result.error;
          break;
        }
      }

      if (!success) {
        var iter = prop.shrinkFailingTest(testCaseTree);
        var numAttempts = 0;
        var numShrinks = 0;

        failingCase = testCaseTree.root;
        testCaseTree = null;  // Allow GC of unused parts of the tree.

        var ret;
        while (!((ret = iter.next()).done)) {
          var value = ret.value;
          numAttempts++;
          if (!value.result.success) {
            numShrinks++;
            failingCase = value.testArgs;
          }
          write('\r' + k + '/' + numTests + ' ' + prop.name +
                ', shrinking ' + numShrinks + '/' + numAttempts);
        }
      }

      write('\r' + (success ? '✓' : '✘') + ' ' + prop.name);
      propsRun++;
      if (success) {
        write(', passed ' + numTests + ' tests\n');
      } else {
        propsFailed++;
        write(', counterexample found:\n');
        write(failingCase.toString() + '\n');
        if (error) {
          write('exception raised: ' + (error.name || '(no name)') + '\n');
          write(error.stack + '\n');
        }
      }
    }
  }

  write('\n' + (propsFailed > 0 ? propsFailed + ' of ' : '') +
        propsRun + ' ' + (propsRun === 1 ? 'property' : 'properties') +
        ' ' + (propsFailed > 0 ? 'violated' : 'verified') + '.\n');
};

module.exports = Runner;
