'use strict';

var fs = require('fs');
var path = require('path');
var test = require('tape');
var remark = require('remark');
var hidden = require('is-hidden');
var negate = require('negate');
var usage = require('..');

var read = fs.readFileSync;
var exists = fs.existsSync;

test('remark-usage()', function (t) {
  t.equal(typeof usage, 'function', 'should be a function');

  t.doesNotThrow(function () {
    usage(remark);
  }, 'should not throw if not passed options');

  t.end();
});

var ROOT = path.join(__dirname, 'fixtures');
var fixtures = fs.readdirSync(ROOT).filter(negate(hidden));

test('Fixtures', function (t) {
  fixtures.forEach(function (fixture) {
    var filepath = ROOT + '/' + fixture;
    var config = filepath + '/config.json';
    var output = filepath + '/output.md';
    var input;
    var result;
    var fail;

    config = exists(config) ? require(config) : {};
    output = exists(output) ? read(output, 'utf-8') : '';

    input = read(filepath + '/readme.md', 'utf-8');

    config.cwd = filepath;

    fail = fixture.indexOf('fail-') === 0 ? fixture.slice(5) : '';

    try {
      result = remark().use(usage, config).process(input).toString();

      t.equal(result, output, 'should work on `' + fixture + '`');
    } catch (err) {
      if (!fail) {
        throw err;
      }

      fail = new RegExp(fail.replace(/-/, ' '), 'i');

      t.equal(
        fail.test(err),
        true,
        'should fail on `' + fixture + '`'
      );
    }
  });

  t.end();
});
