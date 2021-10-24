/**
 * @typedef {import('mdast').Root} Root
 * @typedef {import('mdast').BlockContent} BlockContent
 * @typedef {import('vfile').VFile} VFile
 * @typedef {import('trough').Callback} Callback
 *
 * @typedef Options
 *   Configuration.
 * @property {string} [heading]
 *   Heading to look for (default: `'usage'`).
 *   Wrapped in `new RegExp('^(' + value + ')$', 'i');`.
 * @property {string} [example]
 *   Path to the example script.
 *   If given, resolved from `file.cwd`.
 *   If not given, the following values are attempted and resolved from
 *   `file.cwd`:
 *
 *   *   `'./example.js'`
 *   *   `'./example/index.js'`
 *   *   `'./examples.js'`
 *   *   `'./examples/index.js'`
 *   *   `'./doc/example.js'`
 *   *   `'./doc/example/index.js'`
 *   *   `'./docs/example.js'`
 *   *   `'./docs/example/index.js'`
 *
 *   The first that exists, is used.
 * @property {string} [name]
 *   Name of the module (default: `pkg.name`, optional).
 *   Used to rewrite `import x from './main.js'` to `import x from 'name'`.
 * @property {string} [main]
 *   Path to the main file (default: `pkg.main` or `'./index.js'`, optional).
 *   If given, resolved from `file.cwd`.
 *   If inferred from `package.json`, resolved relating to that package root.
 *   Used to rewrite `import x from './main.js'` to `import x from 'name'`.
 */

import fs from 'node:fs'
import {headingRange} from 'mdast-util-heading-range'
import {generate} from './generate/index.js'

const defaultHeading = 'usage'

/**
 * Plugin to add a usage example to a readme.
 *
 * @type {import('unified').Plugin<[Options?]|void[], Root>}
 */
export default function remarkUsage(options = {}) {
  const header = new RegExp(
    '^(' + (options.heading || defaultHeading) + ')$',
    'i'
  )

  return (tree, file, next) => {
    /** @type {{tree: Root, file: VFile, options: Options, exampleInstrumentedPath?: string, nodes?: BlockContent[]}} */
    const ctx = {tree, file, options}
    let exists = false

    // Walk the tree once to check if the heading exists.
    // Walking the tree may be slow, but it’s much more slow to run Babel, spawn
    // node, and generate the example.
    headingRange(tree, header, (start, nodes, end) => {
      exists = true
      return [start, ...nodes, end]
    })

    if (!exists) {
      return next()
    }

    generate.run(
      ctx,
      /** @type {Callback} */
      (error) => {
        // If something failed and there’s an example, remove it.
        if (ctx.exampleInstrumentedPath) {
          try {
            fs.unlinkSync(ctx.exampleInstrumentedPath)
            // Catch just to be sure.
            /* c8 ignore next */
          } catch {}
        }

        if (!error) {
          // Add example.
          headingRange(tree, header, (start, _, end) => [
            start,
            // `nodes` are always defined.
            /* c8 ignore next */
            ...(ctx.nodes || []),
            end
          ])
        }

        return next(error)
      }
    )
  }
}
