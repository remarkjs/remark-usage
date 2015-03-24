'use strict';

/*
 * Dependencies.
 */

var fs,
    path,
    mdast;

fs = require('fs');
path = require('path');
mdast = require('mdast');

/*
 * Methods.
 */

var exists,
    read,
    write,
    remove,
    resolve;

exists = fs.existsSync;
read = fs.readFileSync;
write = fs.writeFileSync;
remove = fs.unlinkSync;
resolve = path.resolve;

/*
 * List of locations to look for an example.
 */

var EXAMPLES;

EXAMPLES = [
    'docs/example.js',
    'doc/example.js',
    'examples',
    'example',
    'example.js'
];

/*
 * Expressions.
 */

var EXPRESSION_LOG,
    EXPRESSION_REQUIRE,
    EXPRESSION_COMMENT;

EXPRESSION_LOG = /(console\.log\()(.+)(\);?)/g;
EXPRESSION_REQUIRE = /(require\()(.+)(\);?)/g;
EXPRESSION_COMMENT = /^(\s*)(\/\/)(\s*)(.+)/;

/**
 * Intercept calls to `name` on `object`.
 *
 * @param {Object} object
 * @param {string} name
 * @param {function(args...)} callback
 * @return {Function} A method to stop intercepting.
 */
function intercept(object, name, callback) {
    var original;

    original = object[name];

    object[name] = callback;

    return function () {
        object[name] = original;
    };
}

/**
 * Get the value of `node`.
 *
 * @param {Node} node
 * @return {string}
 */
function getValue(node) {
    return node &&
        ('value' in node ? node.value :
        ('alt' in node ? node.alt : node.title)) || '';
}

/**
 * Returns the text content of a node.
 * Checks `alt` or `title` when no value or children
 * exist.
 *
 * @param {Node} node
 * @return {string}
 */
function toString(node) {
    return getValue(node) || node.children.map(toString).join('');
}

/**
 * Unquote a string.
 *
 * @param {string} value
 * @return {string}
 */
function unquote(value) {
    return value.replace(/^["']|["']$/g, '');
}

/**
 * Remove trailing EOLs at the end of a string.
 *
 * @param {string} value
 * @return {string}
 */
function removeTrailingEOLs(value) {
    return value.replace(/\n+$/g, '');
}

/**
 * Check if `node` is the main heading.
 *
 * @param {Node} node
 * @return {boolean}
 */
function isOpeningHeading(node, depth) {
    return depth === null && node && node.type === 'heading' &&
        /^usage$/i.test(toString(node));
}

/**
 * Check if `node` is the next heading.
 *
 * @param {Node} node
 * @param {number} depth
 * @return {boolean}
 */
function isClosingHeading(node, depth) {
    return depth && node && node.type === 'heading' && node.depth <= depth;
}

/**
 * Search a node for a main heading.
 *
 * @param {Node} root
 * @return {number?}
 */
function search(root) {
    var index,
        length,
        depth,
        child,
        headingIndex,
        closingIndex;

    index = -1;
    length = root.children.length;
    depth = null;

    while (++index < length) {
        child = root.children[index];

        if (isClosingHeading(child, depth)) {
            closingIndex = index;

            break;
        }

        if (isOpeningHeading(child, depth)) {
            headingIndex = index + 1;
            depth = child.depth;
        }
    }

    if (headingIndex) {
        if (!closingIndex) {
            closingIndex = length + 1;
        }

        root.children.splice(headingIndex, closingIndex - headingIndex);
    }

    return headingIndex || null;
}

/**
 * Preprocess `value` to add IDs to
 * `console.log` invocations.
 *
 * @param {string} value
 * @return {string}
 */
function preprocess(value) {
    var index;

    index = 0;

    value = value.replace(EXPRESSION_LOG, function ($0, $1, $2, $3) {
        index++;
        return $1 + '"mdast-usage-' + index + '",' + $2 + $3;
    });

    return value;
}

/**
 * Transform a script into an intermediate nodes,
 * removes the IDs from `console.log` invocations,
 * and resolves the main `require` call.
 *
 * @param {string} source
 * @return {Array.<Object>}
 */
function script(source, options) {
    var tokens;

    /*
     * Make sure the require to the main module
     * is showed as if it was a require from
     * `./node_modules`.
     *
     * For example, when the example file
     * (`test/example.js`) requires the main file (as
     * listed in `test/package.json`, `main: "module.js"`)
     * as `./module`, it is replaced with `test`.
     */

    source = source.replace(EXPRESSION_REQUIRE, function ($0, $1, $2, $3) {
        var filepath,
            quote;

        filepath = resolve(options.example, '../', unquote($2));

        if (options.main === filepath && options.name) {
            /*
             * Honour quote style.
             */

            quote = $2.charAt(0);

            return $1 + quote + options.name + quote + $3;
        }

        return $0;
    });

    /*
     * Transform comments into markdown:
     */

    tokens = [];

    source.split('\n').forEach(function (line) {
        var match;

        match = line.match(EXPRESSION_COMMENT);

        tokens.push({
            'type': match ? 'markdown' : 'javascript',
            'value': match ? match[4] : line
        });
    });

    return tokens;
}

/**
 * Transform a log into an mdast `code` node.
 *
 * @param {Object} info
 * @return {Node}
 */
function log(info) {
    return {
        'type': 'code',
        'lang': info.lang,
        'value': info.value
    };
}

/**
 * Post-process the example document.
 *
 * @param {string} value
 * @param {Object} logs
 * @return {Array.<Node>}
 */
function postprocess(value, logs, options) {
    var tokens,
        match,
        content,
        info,
        parameters,
        start,
        end,
        markdown;

    tokens = [];

    EXPRESSION_LOG.lastIndex = 0;
    start = 0;

    /* eslint-disable no-cond-assign */
    while (match = EXPRESSION_LOG.exec(value)) {
        end = EXPRESSION_LOG.lastIndex;

        content = value.slice(start, end - match[0].length);

        parameters = match[2].split(/\s*,\s*/);

        info = parameters[0];
        info = unquote(info.trim());
        info = logs[info];

        if (info && info.value) {
            tokens = tokens.concat(script(content, options), log(info));
        } else {
            parameters = parameters.slice(1).join(', ');

            tokens = tokens.concat(script(
                content + match[1] + parameters + match[3], options
            ));
        }

        start = end;
    }
    /* eslint-enable no-cond-assign */

    if (start < value.length) {
        tokens = tokens.concat(script(value.slice(start)));
    }

    markdown = [];

    tokens.forEach(function (token) {
        var prev,
            lang;

        if (token.type === 'markdown') {
            markdown = markdown.concat(mdast.parse(token.value).children);
        } else {
            prev = markdown[markdown.length - 1];
            lang = 'lang' in token ? token.lang : token.type;

            if (prev && prev.type === 'code' && prev.lang === lang) {
                prev.value += token.value ? '\n' + token.value : '';
            } else {
                markdown.push({
                    'type': 'code',
                    'lang': lang,
                    'value': token.value
                });
            }
        }
    });

    markdown = markdown.filter(function (token) {
        if ('value' in token) {
            token.value = removeTrailingEOLs(token.value);

            return token.value !== '';
        }

        return true;
    });

    return markdown;
}

/**
 * Construct a transformer based on `options`.
 *
 * @param {Object} options
 * @return {function(node)}
 */
function transformerFactory(options) {
    /**
     * Adds an example section based on a valid example
     * JavaScript document to a `Usage` section.
     *
     * @param {Node} node
     */
    return function (node) {
        var index,
            example,
            source,
            tmp,
            stop,
            logs;

        logs = {};

        index = search(node);

        if (index === null) {
            return;
        }

        example = options.example;

        if (!exists(example)) {
            throw new Error(
                'Missing example: `' + example + '`. ' +
                'Pass an `example` or use a file at: ' +
                EXAMPLES.join(', ')
            );
        }

        tmp = example + '-tmp';

        source = preprocess(read(example, 'utf-8'));

        write(tmp, source, 'utf-8');

        /*
         * TODO: better tmp file management.
         */

        stop = intercept(console, 'log', function (id, lang, value) {
            if (!value) {
                value = lang;
                lang = null;
            }

            if (typeof value === 'string' && typeof id === 'string') {
                logs[id] = {
                    'id': id,
                    'lang': lang,
                    'value': value
                };
            }
        });

        try {
            require(tmp);
        } catch (exception) {
            exception.message =
                'Invalid example `' + example + '`. ' +
                'Ensure example is a valid JavaScript file:\n\n' +
                exception.message;

            throw exception;
        } finally {
            stop();

            /* istanbul ignore next */
            if (exists(tmp)) {
                remove(tmp);
            }
        }

        /*
         * Add markdown.
         */

        node.children = [].concat(
            node.children.slice(0, index),
            postprocess(source, logs, options),
            node.children.slice(index)
        );
    };
}

/**
 * Adds an npm version badge to the main heading,
 * when available.
 *
 * @param {MDAST} _
 * @param {Object?} options
 * @return {function(Node)}
 */
function attacher(_, options) {
    var settings,
        pack,
        main,
        example,
        name,
        cwd;

    settings = {};

    if (options === null || options === undefined) {
        options = {};
    }

    cwd = options.cwd;

    if (cwd === null || cwd === undefined) {
        cwd = process.cwd();
    }

    try {
        pack = require(resolve(cwd, 'package.json'));
    } catch (exception) {
        pack = {};
    }

    name = options.name;

    if (name === null || name === undefined) {
        name = pack.name || null;
    }

    main = options.main;

    if (main === null || main === undefined) {
        main = resolve(cwd, pack.main || 'index.js');
    } else {
        main = require.resolve(resolve(cwd, main));
    }

    example = options.example;

    if (example === null || example === undefined) {
        EXAMPLES.some(function (filepath) {
            filepath = resolve(cwd, filepath);

            if (exists(filepath)) {
                example = require.resolve(filepath);
                return true;
            }
        });
    } else {
        example = require.resolve(resolve(cwd, example));
    }

    settings.cwd = cwd;
    settings.name = name;
    settings.main = main;
    settings.example = example;

    return transformerFactory(settings);
}

/*
 * Expose `attacher`.
 */

module.exports = attacher;
