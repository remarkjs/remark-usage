'use strict';

/* eslint-env mocha */

/*
 * Dependencies.
 */

var usage = require('../index.js');
var mdast = require('mdast');
var path = require('path');
var fs = require('fs');
var diff = require('diff');
var chalk = require('chalk');
var assert = require('assert');

/*
 * Methods.
 */

var read = fs.readFileSync;
var exists = fs.existsSync;

/*
 * Tests.
 */

describe('mdast-usage()', function () {
    it('should be a function', function () {
        assert(typeof usage === 'function');
    });

    it('should not throw if not passed options', function () {
        assert.doesNotThrow(function () {
            usage(mdast);
        });
    });
});

/*
 * Constants..
 */

var ROOT = path.join(__dirname, 'fixtures');

/**
 * Describe a fixtures.
 *
 * @param {string} fixture
 */
function describeFixture(fixture) {
    it('should work on `' + fixture + '`', function () {
        var filepath = ROOT + '/' + fixture;
        var config = filepath + '/config.json';
        var output = filepath + '/Output.md';
        var input;
        var result;
        var fail;
        var difference;

        config = exists(config) ? require(config) : {};
        output = exists(output) ? read(output, 'utf-8') : '';

        input = read(filepath + '/Readme.md', 'utf-8');

        config.cwd = filepath;

        fail = fixture.indexOf('fail-') === 0 ? fixture.slice(5) : '';

        try {
            result = mdast.use(usage, config).process(input);

            assert(result === output);
        } catch (exception) {
            if (fail) {
                fail = new RegExp(fail.replace(/-/, ' '), 'i');

                assert(fail.test(exception));
            } else {
                difference = diff.diffLines(output, result);

                difference.forEach(function (change) {
                    var colour = change.added ?
                        'green' : change.removed ? 'red' : 'dim';

                    process.stderr.write(chalk[colour](change.value));
                });

                throw exception;
            }
        }
    });
}

/*
 * Gather fixtures.
 */

var fixtures = fs.readdirSync(ROOT);

fixtures = fixtures.filter(function (filepath) {
    return filepath.indexOf('.') !== 0;
});

describe('Fixtures', function () {
    fixtures.forEach(describeFixture);
});
