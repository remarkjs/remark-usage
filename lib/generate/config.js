/**
 * @typedef {import('mdast').Root} Root
 * @typedef {import('vfile').VFile} VFile
 * @typedef {import('type-fest').PackageJson} PackageJson
 * @typedef {import('../index.js').Options} Options
 */

import url from 'url'
import {resolve} from 'import-meta-resolve'
import {nanoid} from 'nanoid'
import {relativeModule} from '../util/relative-module.js'

/** @param {{tree: Root, file: VFile, options: Options, pkg: PackageJson|undefined, pkgRoot: string, main?: string|undefined, name?: string|undefined, id?: string}} ctx */
export async function config(ctx) {
  const options = ctx.options
  const pkg = ctx.pkg || {}
  const cwd = ctx.file.cwd
  const mainId = relativeModule(options.main || pkg.main || 'index.js')
  /** @type {string|undefined} */
  let main

  try {
    main = await resolve(
      mainId,
      url.pathToFileURL(options.main ? cwd : ctx.pkgRoot || cwd).href + '/'
    )
  } catch {}

  ctx.main = main
  ctx.name = options.name || pkg.name || undefined
  ctx.id = 'remark-usage-example-' + nanoid().toLowerCase()
}
