/**
 * @author Titus Wormer
 * @copyright 2015 Titus Wormer
 * @license MIT
 * @module mdast:usage:test
 * @fileoverview Test suite for remark-usage.
 */

'use strict';

/* eslint-env mocha */

/*
 * Dependencies.
 */

var usage = require('..');
var mdast = require('mdast');
var path = require('path');
var fs = require('fs');
var assert = require('assert');

/*
 * Methods.
 */

var read = fs.readFileSync;
var exists = fs.existsSync;
var equal = assert.strictEqual;

/*
 * Tests.
 */

describe('remark-usage()', function () {
    it('should be a function', function () {
        equal(typeof usage, 'function');
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
 * @param {string} fixture - Name.
 */
function describeFixture(fixture) {
    it('should work on `' + fixture + '`', function () {
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
            result = mdast.use(usage, config).process(input);

            equal(result, output);
        } catch (exception) {
            if (fail) {
                fail = new RegExp(fail.replace(/-/, ' '), 'i');

                equal(fail.test(exception), true);
            } else {
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
