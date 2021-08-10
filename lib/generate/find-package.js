import {promises as fs} from 'fs'
import path from 'path'

export async function findPackage(ctx) {
  const file = ctx.file

  await read(
    file.path ? path.dirname(path.resolve(file.cwd, file.path)) : file.cwd
  )

  async function read(dirname) {
    let buf

    try {
      buf = await fs.readFile(path.join(dirname, 'package.json'))
    } catch (error) {
      // Doesn’t consistently happen.
      /* c8 ignore next 3 */
      if (error.code !== 'ENOENT') {
        throw new Error('Could not read package: ' + error)
      }

      const parent = path.dirname(dirname)

      // Root directory: no `package.json` asywhere.
      if (parent === dirname) {
        return
      }

      return read(parent)
    }

    let pkg

    try {
      pkg = JSON.parse(String(buf))
    } catch (error) {
      // Invalid JSON.
      throw new Error('Could not parse package: ' + error)
    }

    ctx.pkg = pkg
    ctx.pkgRoot = dirname
  }
}
