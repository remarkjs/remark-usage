import fs from 'fs'
import resolveFrom from 'resolve-from'
import {relativeModule} from '../util/relative-module.js'

export function findExample(ctx, next) {
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

      // ENOENT is already caught above, so this rarely happens.
      /* c8 ignore next 3 */
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
    // Catch just to be sure.
    /* c8 ignore next */
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
    filePath = resolveFrom.silent(cwd, examples[index])

    if (filePath) {
      return next(filePath)
    }
  }

  next()
}
