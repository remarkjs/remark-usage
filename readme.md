# remark-usage [![Build Status][travis-badge]][travis] [![Coverage Status][codecov-badge]][codecov]

Add a [usage][] example to a README.

## Installation

[npm][npm-install]:

```bash
npm install remark-usage
```

<!--lint disable code-block-style-->

## Usage

This section is rendered by this module from [example.js][example-js].

Dependencies:

```javascript
var fs = require('fs');
var remark = require('remark');
var usage = require('remark-usage'); // This is changed from `./index.js` to `remark-usage`
```

Read and parse `readme.md`:

```javascript
var readme = fs.readFileSync('readme.md', 'utf-8');
var ast = remark().use(usage).parse(readme);
```

Log something with a language flag:

```markdown
Add a [usage][] example to a README.
```

Or without language:

    ## Installation

Log something which is never captured:

```javascript
function neverCalled() {
    console.log('javascript', 'alert("test")');
}
```

Log something which isn’t captured because it’s not a string.

```javascript
console.log(this);
```

## API

<!--lint enable code-block-style-->

### `remark.use(usage[, options])`

Adds `example.js` to the `Usage` section in a `readme.md`.

Removes the current content between the heading containing the text “usage”,
and the next heading of the same (or higher) depth, and replaces it with
the example.

The example is run as JavaScript. Line comments are parsed as Markdown.
Calls to `console.log()` are exposed as code blocks, containing the logged
values (optionally with a language flag).

It’s easiest to check out and compare [`example.js`][example-js] with the
above [Usage][] section.

*   Operate this from an npm package, or provide a `cwd`;
*   Make sure no side effects occur when running `example.js`!
*   Don’t do weird things. This is mostly regexes!

Options:

*   `cwd` (`string?`) — Path to a directory containing a node module. Used
    to infer `name`, `main`, and `example`;

*   `name` (`string?`) — Name of the module. Inferred from `package.json`s
    `name` property. Used to rewrite `require('./index.js')` to
    `require('some-name')`;

*   `main` (`string?`) — Path to the main script. Resolved from `package.json`s
    `main` property (or `index.js`). Used to rewrite `require('./index.js')`
    to `require('some-name')`.

*   `example` (`string?`) — Path to the example script. **remark-usage** checks
    for `docs/example.js`, `doc/example.js`, `examples/index.js`,
    `example/index.js`, and `example.js`.

*   `heading` (`string?`, default: `"usage"`) — Heading to look for,
    wrapped in `new RegExp('^(' + value + ')$', 'i');`.

## License

[MIT][license] © [Titus Wormer][author]

<!-- Definitions -->

[travis-badge]: https://img.shields.io/travis/wooorm/remark-usage.svg

[travis]: https://travis-ci.org/wooorm/remark-usage

[codecov-badge]: https://img.shields.io/codecov/c/github/wooorm/remark-usage.svg

[codecov]: https://codecov.io/github/wooorm/remark-usage

[npm-install]: https://docs.npmjs.com/cli/install

[license]: LICENSE

[author]: http://wooorm.com

[usage]: #usage

[example-js]: example.js
