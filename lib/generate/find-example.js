'use strict'

var fs = require('fs')
var resolveFrom = require('resolve-from')
var relativeModule = require('../util/relative-module')

module.exports = findExample

function findExample(ctx, next) {
  var fn = ctx.settings.example ? findExplicitExample : findImplicitExample

  fn(ctx, onexample)

  function onexample(filePath) {
    if (filePath) {
      fs.readFile(filePath, onfile)
    } else {
      next(new Error('Could not find example'))
    }

    function onfile(err, buf) {
      var example

      /* istanbul ignore if - ENOENT is already caught above, so this rarely happens */
      if (err) {
        return next(new Error('Could not read example: ' + err))
      }

      example = String(buf)

      // Make sure there is a final line feed.
      if (example.charAt(example.length - 1) !== '\n') {
        example += '\n'
      }

      ctx.examplePath = filePath
      ctx.example = example
      next()
    }
  }
}

function findExplicitExample(ctx, next) {
  var cwd = ctx.cwd
  var moduleId = relativeModule(ctx.settings.example)
  var filePath

  try {
    filePath = resolveFrom(cwd, moduleId)
  } catch (_) {}

  next(filePath)
}

function findImplicitExample(ctx, next) {
  var cwd = ctx.cwd
  var examples = ['./example', './examples', './doc/example', './docs/example']
  var length = examples.length
  var index = -1
  var filePath

  while (++index < length) {
    try {
      filePath = resolveFrom(cwd, examples[index])
    } catch (_) {
      continue
    }

    return next(filePath)
  }

  next()
}
