/**
 * @typedef {import('mdast').Root} Root
 * @typedef {import('vfile').VFile} VFile
 * @typedef {import('type-fest').PackageJson} PackageJson
 * @typedef {import('../index.js').Options} Options
 */

import path from 'node:path'
import {findUpOne} from 'vfile-find-up'
import {read} from 'to-vfile'

/** @param {{tree: Root, file: VFile, options: Options, pkg?: PackageJson, pkgRoot?: string}} ctx */
export async function findPackage(ctx) {
  const file = ctx.file
  const pkgFile = await findUpOne(
    'package.json',
    file.path ? path.dirname(path.resolve(file.cwd, file.path)) : file.cwd
  )

  if (!pkgFile) return

  try {
    await read(pkgFile)
    // Doesn’t consistently happen.
    /* c8 ignore next 6 */
  } catch (error) {
    const exception = /** @type {NodeJS.ErrnoException} */ (error)
    if (exception.code !== 'ENOENT') {
      throw new Error('Could not read package: ' + exception)
    }
  }

  /** @type {PackageJson} */
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
