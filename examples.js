// FIXME: this file should probably not be here


var gentest = require('./index');


function add(x,y) { return x + y; }
function prop_isCommutative(x,y) {
  console.log('test adding', x, 'and', y);
  return add(x,y) === add(y,x);
}
gentest.run(prop_isCommutative, gentest.types.int, gentest.types.int)



function ascending(array) {
  for (var i = 0; i < array.length-1; i++) {
    if (array[i] > array[i+1]) return false;
  }
  return true;
}

function prop_sortSorts(xs) {
  console.log('testing', xs);
  var xs_ = xs.slice();
  xs_.sort();
  return ascending(xs_);
}

gentest.run(prop_sortSorts, 20, gentest.types.arrayOf(gentest.types.string));




var gentest = require('./index');
function test(x) { console.log('testing', x); return true; }
var t = gentest.types;
gentest.run(test, 20, t.arrayOf(t.bool))
