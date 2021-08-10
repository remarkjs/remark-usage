# remark-usage

[![Build][build-badge]][build]
[![Coverage][coverage-badge]][coverage]
[![Downloads][downloads-badge]][downloads]
[![Size][size-badge]][size]
[![Sponsors][sponsors-badge]][collective]
[![Backers][backers-badge]][collective]
[![Chat][chat-badge]][chat]

[**remark**][remark] plugin to add a [usage][] example to a readme.

## Note!

This plugin is ready for the new parser in remark
([`remarkjs/remark#536`](https://github.com/remarkjs/remark/pull/536)).
No change is needed: it works exactly the same now as it did before!

## Install

[npm][]:

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

### `remark().use(usage[, options])`

Add `example.js` to the `Usage` section in a readme.

Removes the current content between the heading containing the text “usage”, and
the next heading of the same (or higher) depth, and replaces it with the
example.

The example is run in Node.
Line comments are parsed as Markdown.
Calls to `console.log()` are exposed as code blocks, containing the logged
values (optionally with a language flag).

It’s easiest to check out and compare [`example.js`][example-js] with the above
[Usage][] section.

*   Operate this from an npm package
*   Make sure no side effects occur when running `example.js`

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

Path to the example script (`string?`).
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

## Security

Use of `remark-usage` is unsafe because `main` and `example` are executed.
This could become dangerous if an attacker was able to inject code into those
files or their dependencies.

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

[remark]: https://github.com/remarkjs/remark

[file-cwd]: https://github.com/vfile/vfile#vfilecwd

[usage]: #use

[example-js]: example.js
