import fs from 'fs'
import path from 'path'

export function write(ctx, next) {
  const dir = path.dirname(ctx.examplePath)
  const extname = path.extname(ctx.examplePath)
  const filePath = path.join(dir, ctx.id + extname)

  fs.writeFile(filePath, ctx.exampleInstrumented, (error) => {
    // Doesn’t happen consistently.
    /* c8 ignore next 3 */
    if (error) {
      return next(new Error('Could not write example: ' + error))
    }

    ctx.exampleInstrumentedPath = filePath
    next()
  })
}
