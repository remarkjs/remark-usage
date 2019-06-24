'use strict'

var fs = require('fs')
var heading = require('mdast-util-heading-range')
var generate = require('./generate')

var defaultHeading = 'usage'

module.exports = usage

function usage(options) {
  var settings = options || {}
  var header = new RegExp(
    '^(' + (settings.heading || defaultHeading) + ')$',
    'i'
  )

  return transform

  function transform(tree, file, next) {
    var ctx = {tree: tree, file: file, settings: settings}
    var exists = false

    // Walk the tree once to check if the heading exists.
    // Walking the tree may be slow, but it’s much more slow to run Babel, spawn
    // node, and generate the example.
    heading(tree, header, ifExists)

    if (exists) {
      generate.run(ctx, done)
    } else {
      next()
    }

    function done(err) {
      // If something failed and there’s an example, remove it.
      if (ctx && ctx.exampleInstrumentedPath) {
        try {
          fs.unlinkSync(ctx.exampleInstrumentedPath)
        } catch (error) {}
      }

      if (err) {
        return next(err)
      }

      // Add example.
      heading(tree, header, run)
      next()

      function run(start, _, end) {
        return [start].concat(ctx.nodes, end)
      }
    }

    function ifExists(start, nodes, end) {
      exists = true
      return [start].concat(nodes, end)
    }
  }
}
