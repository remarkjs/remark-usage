# remark-usage [![Build Status](https://img.shields.io/travis/wooorm/remark-usage.svg)](https://travis-ci.org/wooorm/remark-usage) [![Coverage Status](https://img.shields.io/codecov/c/github/wooorm/remark-usage.svg)](https://codecov.io/github/wooorm/remark-usage)

Add a [usage](#usage) example to a README.

> :warning: **mdast is currently being renamed to remark** :warning:
> 
> This means all plug-ins and relating projects change too, causing many
> changes across the ecosystem. Expect the dust to settle in roughly a day.
> 
> See this project at the previous stable commit
> [c4a51d1](https://github.com/wooorm/remark-github/commit/c4a51d1).

## Installation

[npm](https://docs.npmjs.com/cli/install):

```bash
npm install remark-usage
```

<!--lint disable code-block-style-->

## Usage

This section is rendered by this module from [example.js](example.js).

Require dependencies:

```javascript
var fs = require('fs');
var remark = require('remark');
```

Require usage:

```javascript
/*
 * The below is changed because a require to the main
 * module file is detected.
 */
var usage = require('remark-usage'); // This is changed from `./index.js` to `remark-usage`
```

Read and parse `readme.md`:

```javascript
var readme = fs.readFileSync('readme.md', 'utf-8');
var ast = remark.use(usage).parse(readme);
```

Log something with a language flag:

```markdown
Add a [usage](#usage) example to a README.
```

Or without language:

    ## Installation

Log something which is never captured:

```javascript
function neverCalled() {
    console.log('javascript', 'alert("test")');
}
```

Log something which isn’t captured because it’s not not a string.

```javascript
console.log(this);
```

## API

<!--lint enable code-block-style-->

### [remark](https://github.com/wooorm/remark#api).[use](https://github.com/wooorm/remark#remarkuseplugin-options)(usage, options)

Adds `example.js` to the `Usage` section in a `readme.md`.

Removes the current content between the heading containing the text “usage”,
and the next heading of the same (or higher) depth, and replaces it with
the example.

The example is run as JavaScript. Line comments are parsed as Markdown.
Calls to `console.log()` are exposed as code blocks, containing the logged
values (optionally with a language flag).

It’s easiest to check out and compare [`example.js`](example.js) with the
above [Usage](#usage) section.

*   Operate this from an npm package, or provide a `cwd`;
*   Make sure no side effects occur when running `example.js`!
*   Don’t do weird things. This is mostly regexes!

You can provide options to [`remark.use()`](https://github.com/wooorm/remark#remarkuseplugin-options):

Options:

*   `cwd` (string?) — Path to a directory containing a node module. Used
    to infer `name`, `main`, and `example`;

*   `name` (string?) — Name of the module. Inferred from `package.json`s
    `name` property. Used to rewrite `require('./index.js')` to
    `require('some-name')`;

*   `main` (string?) — Path to the main script. Resolved from `package.json`s
    `main` property (or `index.js`). Used to rewrite `require('./index.js')`
    to `require('some-name')`.

*   `example` (string?) — Path to the example script. **remark-usage** checks
    for `docs/example.js`, `doc/example.js`, `examples/index.js`,
    `example/index.js`, and `example.js`.

## License

[MIT](LICENSE) © [Titus Wormer](http://wooorm.com)
