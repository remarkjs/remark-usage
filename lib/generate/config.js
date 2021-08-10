import url from 'url'
import {resolve} from 'import-meta-resolve'
import {nanoid} from 'nanoid'
import {relativeModule} from '../util/relative-module.js'

export async function config(ctx) {
  const options = ctx.options
  const pkg = ctx.pkg || {}
  const cwd = ctx.file.cwd
  const mainRoot = url.pathToFileURL(options.main ? cwd : ctx.pkgRoot || cwd)
  const mainId = relativeModule(options.main || pkg.main || 'index.js')
  let main

  try {
    main = await resolve(mainId, mainRoot.href + '/')
  } catch {}

  ctx.cwd = cwd
  ctx.main = main
  ctx.name = options.name || pkg.name || null
  ctx.id = 'remark-usage-example-' + nanoid().toLowerCase()
}
