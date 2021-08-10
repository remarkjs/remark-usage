import fs from 'fs'
import path from 'path'

export function findPackage(ctx, next) {
  const file = ctx.file
  let base = file.cwd

  if (file.path) {
    base = path.dirname(path.resolve(base, file.path))
  }

  read()

  function read() {
    fs.readFile(path.join(base, 'package.json'), (error, buf) => {
      if (error) {
        // Doesn’t consistently happen.
        /* c8 ignore next 3 */
        if (error.code !== 'ENOENT') {
          return next(new Error('Could not read package: ' + error))
        }

        const parent = path.dirname(base)

        // No `package.json`.
        if (parent === base) {
          return next()
        }

        base = parent
        return read()
      }

      let pkg

      try {
        pkg = JSON.parse(buf)
      } catch (error) {
        // Invalid JSON.
        return next(new Error('Could not parse package: ' + error))
      }

      ctx.pkg = pkg
      ctx.pkgRoot = base
      return next()
    })
  }
}
