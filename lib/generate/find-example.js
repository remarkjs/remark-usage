import fs from 'fs'
import resolveFrom from 'resolve-from'
import {relativeModule} from '../util/relative-module.js'

export function findExample(ctx, next) {
  const fn = ctx.options.example ? findExplicitExample : findImplicitExample

  fn(ctx, (filePath) => {
    if (filePath) {
      fs.readFile(filePath, (error, buf) => {
        // ENOENT is already caught above, so this rarely happens.
        /* c8 ignore next 3 */
        if (error) {
          return next(new Error('Could not read example: ' + error))
        }

        let example = String(buf)

        // Make sure there is a final line feed.
        if (example.charAt(example.length - 1) !== '\n') {
          example += '\n'
        }

        ctx.examplePath = filePath
        ctx.example = example
        next()
      })
    } else {
      next(new Error('Could not find example'))
    }
  })
}

function findExplicitExample(ctx, next) {
  const cwd = ctx.cwd
  const moduleId = relativeModule(ctx.options.example)
  let filePath

  try {
    filePath = resolveFrom(cwd, moduleId)
    // Catch just to be sure.
    /* c8 ignore next */
  } catch {}

  next(filePath)
}

function findImplicitExample(ctx, next) {
  const examples = [
    './example',
    './examples',
    './doc/example',
    './docs/example'
  ]
  let index = -1

  while (++index < examples.length) {
    const filePath = resolveFrom.silent(ctx.cwd, examples[index])

    if (filePath) {
      return next(filePath)
    }
  }

  next()
}
