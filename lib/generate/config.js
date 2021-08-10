import {nanoid} from 'nanoid'
import resolveFrom from 'resolve-from'
import {relativeModule} from '../util/relative-module.js'

export function config(ctx) {
  const options = ctx.options
  const pkg = ctx.pkg || {}
  const cwd = ctx.file.cwd
  const mainRoot = options.main ? cwd : ctx.pkgRoot || cwd
  const mainId = relativeModule(options.main || pkg.main || '')
  let main

  try {
    main = resolveFrom(mainRoot, mainId)
  } catch {}

  ctx.cwd = cwd
  ctx.main = main
  ctx.name = options.name || pkg.name || null
  ctx.id = 'remark-usage-example-' + nanoid().toLowerCase()
}
