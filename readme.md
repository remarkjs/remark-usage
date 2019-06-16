# remark-usage

[![Build][build-badge]][build]
[![Coverage][coverage-badge]][coverage]
[![Downloads][downloads-badge]][downloads]
[![Size][size-badge]][size]
[![Sponsors][sponsors-badge]][collective]
[![Backers][backers-badge]][collective]
[![Chat][chat-badge]][chat]

[**remark**][remark] plugin to add a [usage][] example to a readme.

## Install

[npm][]:

```sh
npm install remark-usage
```

## Usage

This section is rendered by this module from [example.js][example-js].

Dependencies:

```javascript
var fs = require('fs')
var remark = require('remark')
var usage = require('remark-usage') // This is changed from `./index.js` to `remark-usage`
```

Read and parse `readme.md`:

```javascript
var readme = fs.readFileSync('readme.md', 'utf-8')
var ast = remark()
  .use(usage)
  .parse(readme)
```

Log something with a language flag:

```markdown
[**remark**][remark] plugin to add a [usage][] example to a readme.
```

Or without language:

```
## Install
```

Log something which is never captured:

```javascript
function neverCalled() {
  console.log('javascript', 'alert("test")')
}
```

Log something which isn’t captured because it’s not a string.

```javascript
console.log(this)
```

## API

<!--lint enable code-block-style-->

### `remark().use(usage[, options])`

Add `example.js` to the `Usage` section in a readme.

Removes the current content between the heading containing the text “usage”, and
the next heading of the same (or higher) depth, and replaces it with the
example.

The example is run as JavaScript.
Line comments are parsed as Markdown.
Calls to `console.log()` are exposed as code blocks, containing the logged
values (optionally with a language flag).

It’s easiest to check out and compare [`example.js`][example-js] with the above
[Usage][] section.

*   Operate this from an npm package, or provide a `cwd`
*   Make sure no side effects occur when running `example.js`
*   Don’t do weird things.
    This is mostly regexes

##### `options`

###### `options.cwd`

Path to a directory containing a node module (`string?`).
Used to infer `name`, `main`, and `example`.

###### `options.name`

Name of the module (`string?`).
Inferred from `package.json`s `name` property.
Used to rewrite `require('.')` to `require('some-name')`.

###### `options.main`

Path to the main script (`string?`).
Resolved from `package.json`s `main` property (or `index.js`).
Used to rewrite `require('./index.js')` to `require('some-name')`.

###### `options.example`

Path to the example script (`string?`).
`remark-usage` checks for `docs/example.js`, `doc/example.js`,
`examples/index.js`, `example/index.js`, and `example.js`.

###### `options.heading`

Heading to look for (`string?`, default: `'usage'`).
Wrapped in `new RegExp('^(' + value + ')$', 'i');`.

## Contribute

See [`contributing.md`][contributing] in [`remarkjs/.github`][health] for ways
to get started.
See [`support.md`][support] for ways to get help.

This project has a [Code of Conduct][coc].
By interacting with this repository, organisation, or community you agree to
abide by its terms.

## License

[MIT][license] © [Titus Wormer][author]

<!-- Definitions -->

[build-badge]: https://img.shields.io/travis/remarkjs/remark-usage/master.svg

[build]: https://travis-ci.org/remarkjs/remark-usage

[coverage-badge]: https://img.shields.io/codecov/c/github/remarkjs/remark-usage.svg

[coverage]: https://codecov.io/github/remarkjs/remark-usage

[downloads-badge]: https://img.shields.io/npm/dm/remark-usage.svg

[downloads]: https://www.npmjs.com/package/remark-usage

[size-badge]: https://img.shields.io/bundlephobia/minzip/remark-usage.svg

[size]: https://bundlephobia.com/result?p=remark-usage

[sponsors-badge]: https://opencollective.com/unified/sponsors/badge.svg

[backers-badge]: https://opencollective.com/unified/backers/badge.svg

[collective]: https://opencollective.com/unified

[chat-badge]: https://img.shields.io/badge/join%20the%20community-on%20spectrum-7b16ff.svg

[chat]: https://spectrum.chat/unified/remark

[npm]: https://docs.npmjs.com/cli/install

[health]: https://github.com/remarkjs/.github

[contributing]: https://github.com/remarkjs/.github/blob/master/contributing.md

[support]: https://github.com/remarkjs/.github/blob/master/support.md

[coc]: https://github.com/remarkjs/.github/blob/master/code-of-conduct.md

[license]: license

[author]: https://wooorm.com

[remark]: https://github.com/remarkjs/remark

[usage]: #usage

[example-js]: example.js
