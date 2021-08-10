import {nanoid} from 'nanoid'
import resolveFrom from 'resolve-from'
import {relativeModule} from '../util/relative-module.js'

export function config(ctx) {
  var settings = ctx.settings
  var pkg = ctx.pkg || {}
  var cwd = ctx.file.cwd
  var mainRoot = settings.main ? cwd : ctx.pkgRoot || cwd
  var mainId = relativeModule(settings.main || pkg.main || '')
  var main

  try {
    main = resolveFrom(mainRoot, mainId)
  } catch (_) {}

  ctx.experimentalModules = settings.experimentalModules || false
  ctx.cwd = cwd
  ctx.main = main
  ctx.name = settings.name || pkg.name || null
  ctx.id = 'remark-usage-example-' + nanoid().toLowerCase()
}
