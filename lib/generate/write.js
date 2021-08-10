'use strict'

var fs = require('fs')
var path = require('path')

module.exports = write

function write(ctx, next) {
  var dir = path.dirname(ctx.examplePath)
  var extname = path.extname(ctx.examplePath)
  var filePath = path.join(dir, ctx.id + extname)

  fs.writeFile(filePath, ctx.exampleInstrumented, onwrite)

  function onwrite(err) {
    // Doesn’t happen consistently.
    /* c8 ignore next 3 */
    if (err) {
      return next(new Error('Could not write example: ' + err))
    }

    ctx.exampleInstrumentedPath = filePath
    next()
  }
}
