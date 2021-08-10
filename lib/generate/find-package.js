import {findUpOne} from 'vfile-find-up'
import {read} from 'to-vfile'
import path from 'path'

export async function findPackage(ctx) {
  const file = ctx.file
  const pkgFile = await findUpOne(
    'package.json',
    file.path ? path.dirname(path.resolve(file.cwd, file.path)) : file.cwd
  )

  if (!pkgFile) return

  try {
    await read(pkgFile)
  } catch (error) {
    // Doesn’t consistently happen.
    /* c8 ignore next 3 */
    if (error.code !== 'ENOENT') {
      throw new Error('Could not read package: ' + error)
    }
  }

  let pkg

  try {
    pkg = JSON.parse(String(pkgFile))
  } catch (error) {
    // Invalid JSON.
    throw new Error('Could not parse package: ' + error)
  }

  ctx.pkg = pkg
  ctx.pkgRoot = pkgFile.dirname
}
