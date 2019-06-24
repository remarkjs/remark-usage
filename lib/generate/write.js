'use strict'

var fs = require('fs')
var path = require('path')

module.exports = write

function write(ctx, next) {
  var dir = path.dirname(ctx.examplePath)
  var filePath = path.join(dir, ctx.id + '.js')

  fs.writeFile(filePath, ctx.exampleInstrumented, onwrite)

  function onwrite(err) {
    /* istanbul ignore if - Doesn’t happen consistently */
    if (err) {
      return next(new Error('Could not write example: ' + err))
    }

    ctx.exampleInstrumentedPath = filePath
    next()
  }
}
