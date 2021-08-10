import fs from 'fs'
import {headingRange} from 'mdast-util-heading-range'
import {generate} from './generate/index.js'

const defaultHeading = 'usage'

export default function remarkUsage(options = {}) {
  const header = new RegExp(
    '^(' + (options.heading || defaultHeading) + ')$',
    'i'
  )

  return transform

  function transform(tree, file, next) {
    const ctx = {tree, file, options}
    let exists = false

    // Walk the tree once to check if the heading exists.
    // Walking the tree may be slow, but it’s much more slow to run Babel, spawn
    // node, and generate the example.
    headingRange(tree, header, (start, nodes, end) => {
      exists = true
      return [start, ...nodes, end]
    })

    if (exists) {
      generate.run(ctx, done)
    } else {
      next()
    }

    function done(error) {
      // If something failed and there’s an example, remove it.
      if (ctx && ctx.exampleInstrumentedPath) {
        try {
          fs.unlinkSync(ctx.exampleInstrumentedPath)
          // Catch just to be sure.
          /* c8 ignore next */
        } catch {}
      }

      if (error) {
        return next(error)
      }

      // Add example.
      headingRange(tree, header, (start, _, end) => [start, ...ctx.nodes, end])
      next()
    }
  }
}
