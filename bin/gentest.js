#!/usr/bin/env node

var PRNG = require('burtleprng');
var fs = require('fs');
var path = require('path');
var program = require('commander');

var Property = require('../lib/Property');
var Runner = require('../lib/Runner');

var write = process.stderr.write.bind(process.stderr);
var version = JSON.parse(fs.readFileSync(__dirname + '/../package.json',
                                         'utf8')).version;

program
  .version(version)
  .usage('[options] files')
  .option('-n, --num-tests <count>',
          'number of test cases per property',
          100)
  .option('-S, --max-size <n>',
          'max value of "size" parameter for generated values',
          50)
  .option('-g, --grep <pattern>',
          'only run tests matching <pattern>');

program.name = 'gentest';
program.parse(process.argv);

program.args.forEach(testFile);

function testFile(filename) {
  var runner = new Runner();

  global.forAll = function(params, name, fn) {
    runner.newProp(Property.forAll(params, name, fn));
  };

  global.describe = function(name, testFunc) {
    runner.newCategory(name);
    testFunc();
  };

  global.gentest = require('../');

  require(path.join(process.cwd(), filename));

  delete global.forAll;
  delete global.describe;
  delete global.gentest;

  write('Testing ' + filename + '\n');

  runner.run({
    grep: program.grep,
    numTests: program.numTests,
    maxSize: program.maxSize
  });
}
