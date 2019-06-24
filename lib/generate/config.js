'use strict'

var nanoid = require('nanoid')
var resolveFrom = require('resolve-from')
var relativeModule = require('../util/relative-module')

module.exports = config

function config(ctx) {
  var settings = ctx.settings
  var pkg = ctx.pkg || {}
  var cwd = ctx.file.cwd
  var mainRoot = settings.main ? cwd : ctx.pkgRoot || cwd
  var mainId = relativeModule(settings.main || pkg.main || '')
  var main

  try {
    main = resolveFrom(mainRoot, mainId)
  } catch (error) {}

  ctx.experimentalModules = settings.experimentalModules || false
  ctx.cwd = cwd
  ctx.main = main
  ctx.name = settings.name || pkg.name || null
  ctx.id = 'remark-usage-example-' + nanoid().toLowerCase()
}
