# remark-usage

[![Build][build-badge]][build]
[![Coverage][coverage-badge]][coverage]
[![Downloads][downloads-badge]][downloads]
[![Size][size-badge]][size]
[![Sponsors][sponsors-badge]][collective]
[![Backers][backers-badge]][collective]
[![Chat][chat-badge]][chat]

[**remark**][remark] plugin to add a [usage][] example to a readme.

## Contents

*   [What is this?](#what-is-this)
*   [When should I use this?](#when-should-i-use-this)
*   [Install](#install)
*   [Use](#use)
*   [API](#api)
    *   [`unified().use(remarkUsage[, options])`](#unifieduseremarkusage-options)
*   [Types](#types)
*   [Compatibility](#compatibility)
*   [Security](#security)
*   [Related](#related)
*   [Contribute](#contribute)
*   [License](#license)

## What is this?

This package is a [unified][] ([remark][]) plugin to add a Usage section to
markdown.

unified is an AST (abstract syntax tree) based transform project.
**remark** is everything unified that relates to markdown.
The layer under remark is called mdast, which is only concerned with syntax
trees.
Another layer underneath is micromark, which is only concerned with parsing.
This package is a small wrapper to integrate all of these.

## When should I use this?

You can use this on readmes of npm packages to keep the docs in sync with the
project through an actual code sample.

## Install

This package is [ESM only](https://gist.github.com/sindresorhus/a39789f98801d908bbc7ff3ecc99d99c).
In Node.js (12.20+, 14.14+, 16.0+), install with [npm][]:

```sh
npm install remark-usage
```

## Use

> This section is rendered by this module from [`example.js`](example.js).
> Turtles all the way down.  🐢🐢🐢

Say we are making a module that exports just enough Pi (3.14159).
We’re documenting it with a readme file, [`example/readme.md`](./example/readme.md):

```markdown
# PI

More than enough 🍰

## Usage

## License

MIT
```

…and an example script to document it [`example/example.js`](./example/example.js):

```js
// Load dependencies:
import {pi} from './index.js'

// Logging `pi` yields:
console.log('txt', pi)
```

…If we use `remark-usage`, we can generate the `Usage` section

```javascript
import {readSync} from 'to-vfile'
import {remark} from 'remark'
import remarkUsage from 'remark-usage'

const file = readSync({path: 'readme.md', cwd: 'example'})

const result = await remark().use(remarkUsage).process(file)
```

Now, printing `result` (the newly generated readme) yields:

````markdown
# PI

More than enough 🍰

## Usage

Load dependencies:

```javascript
import {pi} from 'pi'
```

Logging `pi` yields:

```txt
3.14159
```

## License

MIT
````

## API

This package exports no identifiers.
The default export is `remarkUsage`.

### `unified().use(remarkUsage[, options])`

Add `example.js` to the `Usage` section in a readme.

Replaces the current content between the heading containing the text “usage”
(configurable) and the next heading of the same (or higher) rank with the
example.

The example is run in Node.js.
Make sure no side effects occur when running `example.js`.
Line comments are parsed as markdown.
Calls to `console.log()` are exposed as code blocks, containing the logged
values (optionally with a language flag).

It may help to compare [`example.js`][example-js] with the above [use][usage]
section.

You can ignore lines like so:

```js
// remark-usage-ignore-next
const two = sum(1, 1)

// remark-usage-ignore-next 3
function sum(a, b) {
  return a + b
}
```

…if no `skip` is given, 1 line is skipped.

##### `options`

###### `options.heading`

Heading to look for (`string?`, default: `'usage'`).
Wrapped in `new RegExp('^(' + value + ')$', 'i');`.

###### `options.example`

Path to the example (`string?`).
If given, resolved from [`file.cwd`][file-cwd].
If not given, the following values are attempted and resolved from `file.cwd`:
`'./example.js'`, `'./example/index.js'`, `'./examples.js'`,
`'./examples/index.js'`, `'./doc/example.js'`, `'./doc/example/index.js'`,
`'./docs/example.js'`, `'./docs/example/index.js'`.
The first that exists, is used.

###### `options.name`

Name of the module (`string?`, default: `pkg.name`, optional).
Used to rewrite `require('.')` to `require('name')`.

###### `options.main`

Path to the main file (`string?`, default: `pkg.main` or `'.'`, optional).
If given, resolved from [`file.cwd`][file-cwd].
If inferred from `package.json`, resolved relating to that package root.
Used to rewrite `require('.')` to `require('name')`.

## Types

This package is fully typed with [TypeScript][].
It exports an `Options` type, which specifies the interface of the accepted
options.

## Compatibility

Projects maintained by the unified collective are compatible with all maintained
versions of Node.js.
As of now, that is Node.js 12.20+, 14.14+, and 16.0+.
Our projects sometimes work with older versions, but this is not guaranteed.

This plugin works with remark 12+ and `remark-cli` 8+.

## Security

Use of `remark-usage` is unsafe because `main` and `example` are executed.
This could become dangerous if an attacker was able to inject code into those
files or their dependencies.

## Related

*   [`remark-toc`](https://github.com/remarkjs/remark-toc)
    — add a table of contents (TOC)
*   [`remark-license`](https://github.com/remarkjs/remark-license)
    — add a license section
*   [`remark-contributors`](https://github.com/remarkjs/remark-contributors)
    — add a contributors section

## Contribute

See [`contributing.md`][contributing] in [`remarkjs/.github`][health] for ways
to get started.
See [`support.md`][support] for ways to get help.

This project has a [code of conduct][coc].
By interacting with this repository, organization, or community you agree to
abide by its terms.

## License

[MIT][license] © [Titus Wormer][author]

<!-- Definitions -->

[build-badge]: https://github.com/remarkjs/remark-usage/workflows/main/badge.svg

[build]: https://github.com/remarkjs/remark-usage/actions

[coverage-badge]: https://img.shields.io/codecov/c/github/remarkjs/remark-usage.svg

[coverage]: https://codecov.io/github/remarkjs/remark-usage

[downloads-badge]: https://img.shields.io/npm/dm/remark-usage.svg

[downloads]: https://www.npmjs.com/package/remark-usage

[size-badge]: https://img.shields.io/bundlephobia/minzip/remark-usage.svg

[size]: https://bundlephobia.com/result?p=remark-usage

[sponsors-badge]: https://opencollective.com/unified/sponsors/badge.svg

[backers-badge]: https://opencollective.com/unified/backers/badge.svg

[collective]: https://opencollective.com/unified

[chat-badge]: https://img.shields.io/badge/chat-discussions-success.svg

[chat]: https://github.com/remarkjs/remark/discussions

[npm]: https://docs.npmjs.com/cli/install

[health]: https://github.com/remarkjs/.github

[contributing]: https://github.com/remarkjs/.github/blob/HEAD/contributing.md

[support]: https://github.com/remarkjs/.github/blob/HEAD/support.md

[coc]: https://github.com/remarkjs/.github/blob/HEAD/code-of-conduct.md

[license]: license

[author]: https://wooorm.com

[unified]: https://github.com/unifiedjs/unified

[remark]: https://github.com/remarkjs/remark

[typescript]: https://www.typescriptlang.org

[file-cwd]: https://github.com/vfile/vfile#vfilecwd

[usage]: #use

[example-js]: example.js
