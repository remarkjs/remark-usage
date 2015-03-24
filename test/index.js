'use strict';

/*
 * Dependencies.
 */

var usage,
    mdast,
    path,
    fs,
    diff,
    chalk,
    assert;

usage = require('../index.js');
mdast = require('mdast');
path = require('path');
fs = require('fs');
diff = require('diff');
chalk = require('chalk');
assert = require('assert');

/*
 * Methods.
 */

var read,
    exists;

read = fs.readFileSync;
exists = fs.existsSync;

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

var ROOT;

ROOT = path.join(__dirname, 'fixtures');

/**
 * Describe a fixtures.
 *
 * @param {string} fixture
 */
function describeFixture(fixture) {
    it('should work on `' + fixture + '`', function () {
        var filepath,
            config,
            output,
            input,
            result,
            fail,
            difference;

        filepath = ROOT + '/' + fixture;

        config = filepath + '/config.json';
        output = filepath + '/Output.md';

        config = exists(config) ? require(config) : {};
        output = exists(output) ? read(output, 'utf-8') : '';

        input = read(filepath + '/Readme.md', 'utf-8');

        config.cwd = filepath;

        fail = fixture.indexOf('fail-') === 0 ? fixture.slice(5) : '';

        try {
            result = mdast.stringify(mdast.use(usage, config).parse(input));

            assert(result === output);
        } catch (exception) {
            if (fail) {
                fail = new RegExp(fail.replace(/-/, ' '), 'i');

                assert(fail.test(exception));
            } else {
                difference = diff.diffLines(output, result);

                difference.forEach(function (change) {
                    var colour;

                    colour = change.added ?
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

var fixtures;

fixtures = fs.readdirSync(ROOT);

fixtures = fixtures.filter(function (filepath) {
    return filepath.indexOf('.') !== 0;
});

describe('Fixtures', function () {
    fixtures.forEach(describeFixture);
});
