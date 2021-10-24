/**
 * @typedef {import('mdast').Root} Root
 * @typedef {import('vfile').VFile} VFile
 * @typedef {import('type-fest').PackageJson} PackageJson
 * @typedef {import('../index.js').Options} Options
 * @typedef {import('./instrument.js').Log} Log
 * @typedef {import('./instrument.js').Reference} Reference
 */

import url from 'node:url'
import {promises as fs} from 'node:fs'
import path from 'node:path'

/** @param {{tree: Root, file: VFile, options: Options, pkg: PackageJson, pkgRoot: string, main: string|undefined, name: string|undefined, id: string, exampleFileUrl: string, example: string, exampleInstrumented: string, logs: Log[], mainReferences: Reference[], exampleInstrumentedPath?: string}} ctx */
export async function write(ctx) {
  const examplePath = url.fileURLToPath(ctx.exampleFileUrl)
  const filePath = path.join(
    path.dirname(examplePath),
    ctx.id + path.extname(examplePath)
  )

  await fs.writeFile(filePath, ctx.exampleInstrumented)

  ctx.exampleInstrumentedPath = filePath
}
