var assert = require('assert');

var Runner = require('../lib/Runner');
var Property = require('../lib/Property');
var t = require('../lib/types');

describe('test runner', function() {
  it('tests all properties the given number of times', function() {
    var NUM_PROPS = 40;
    var tested = [];
    var runner = new Runner();

    for (var i = 0; i < NUM_PROPS; i++) {
      (function() {
        var j = i;  // Create a new binding
        tested[j] = 0;
        runner.newProp(Property.forAll([t.int], '', function(n) {
          assert(typeof n === 'number' && (n|0) === n);
          tested[j]++;
          return true;
        }));
      })();
    }

    runner.run({silent: true, numTests: 53});

    assert.equal(tested.length, NUM_PROPS);
    assert(tested.every(function(n) { return n === 53; }));
  });
});
