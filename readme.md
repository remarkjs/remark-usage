# remark-usage

[![Build][build-badge]][build]
[![Coverage][coverage-badge]][coverage]
[![Downloads][downloads-badge]][downloads]
[![Sponsors][sponsors-badge]][collective]
[![Backers][backers-badge]][collective]
[![Chat][chat-badge]][chat]

**[remark][]** plugin to add a [usage][section-use] example to a readme.

## Contents

*   [What is this?](#what-is-this)
*   [When should I use this?](#when-should-i-use-this)
*   [Install](#install)
*   [Use](#use)
*   [API](#api)
    *   [`unified().use(remarkUsage[, options])`](#unifieduseremarkusage-options)
    *   [`Options`](#options)
*   [Types](#types)
*   [Compatibility](#compatibility)
*   [Security](#security)
*   [Related](#related)
*   [Contribute](#contribute)
*   [License](#license)

## What is this?

This package is a [unified][] ([remark][]) plugin to add a usage section to
markdown.

## When should I use this?

You can use this on readmes of npm packages to keep the docs in sync with the
project through an actual code sample.

## Install

This package is [ESM only][esm].
In Node.js (version 16+), install with [npm][]:

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

…if we use `remark-usage`, we can generate the `Usage` section

```javascript
import {remark} from 'remark'
import remarkUsage from 'remark-usage'
import {read} from 'to-vfile'

const file = await read({path: 'readme.md', cwd: 'example'})

await remark().use(remarkUsage).process(file)
```

…then printing `file` (the newly generated readme) yields:

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
The default export is [`remarkUsage`][api-remark-usage].

### `unified().use(remarkUsage[, options])`

Add a usage example to a readme.

Looks for the first heading matching `options.heading` (case insensitive),
removes everything between it and an equal or higher next heading, and replaces
that with an example.

The example runs in Node.js (so no side effects!).
Line comments (`//`) are turned into markdown.
Calls to `console.log()` are exposed as code blocks, containing the logged
values, so `console.log(1 + 1)` becomes `2`.
Use a string as the first argument to `log` to use as the language for the code.

You can ignore lines with `remark-usage-ignore-next`:

```js
// remark-usage-ignore-next
const two = sum(1, 1)

// remark-usage-ignore-next 3
function sum(a, b) {
  return a + b
}
```

…if no `skip` is given, 1 line is skipped.

###### Parameters

*   `options` ([`Options`][api-options], optional)
    — configuration

###### Returns

Transform ([`Transformer`][unified-transformer]).

### `Options`

Configuration (TypeScript type).

###### Fields

*   `example` (`string`, optional)
    — path to example file (optional);
    resolved from `file.cwd`;
    defaults to the first example that exists: `'example.js'`,
    `'example/index.js'`, `'examples.js'`, `'examples/index.js'`,
    `'doc/example.js'`, `'doc/example/index.js'`, `'docs/example.js'`,
    `'docs/example/index.js'`
*   `heading` (`string`, default: `'usage'`)
    — heading to look for;
    wrapped in `new RegExp('^(' + value + ')$', 'i');`
*   `main` (`string`, default: `pkg.exports`, `pkg.main`, `'index.js'`)
    — path to the file;
    resolved from `file.cwd`;
    used to rewrite `import x from './main.js'` to `import x from 'name'`
*   `name` (`string`, default: `pkg.name`)
    — name of the module;
    used to rewrite `import x from './main.js'` to `import x from 'name'`

## Types

This package is fully typed with [TypeScript][].
It exports the additional type [`Options`][api-options].

## Compatibility

Projects maintained by the unified collective are compatible with maintained
versions of Node.js.

When we cut a new major release, we drop support for unmaintained versions of
Node.
This means we try to keep the current release line, `remark-usage@^10`,
compatible with Node.js 12.

This plugin works with remark version 12+ and `remark-cli` version 8+.

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

[sponsors-badge]: https://opencollective.com/unified/sponsors/badge.svg

[backers-badge]: https://opencollective.com/unified/backers/badge.svg

[collective]: https://opencollective.com/unified

[chat-badge]: https://img.shields.io/badge/chat-discussions-success.svg

[chat]: https://github.com/remarkjs/remark/discussions

[npm]: https://docs.npmjs.com/cli/install

[esm]: https://gist.github.com/sindresorhus/a39789f98801d908bbc7ff3ecc99d99c

[health]: https://github.com/remarkjs/.github

[contributing]: https://github.com/remarkjs/.github/blob/main/contributing.md

[support]: https://github.com/remarkjs/.github/blob/main/support.md

[coc]: https://github.com/remarkjs/.github/blob/main/code-of-conduct.md

[license]: license

[author]: https://wooorm.com

[remark]: https://github.com/remarkjs/remark

[typescript]: https://www.typescriptlang.org

[unified]: https://github.com/unifiedjs/unified

[unified-transformer]: https://github.com/unifiedjs/unified#transformer

[section-use]: #use

[api-options]: #options

[api-remark-usage]: #unifieduseremarkusage-options
