'use strict'

var fs = require('fs')
var path = require('path')

var packageName = 'package.json'

module.exports = findPackage

function findPackage(ctx, next) {
  var file = ctx.file
  var base = file.cwd

  if (file.path) {
    base = path.dirname(path.resolve(base, file.path))
  }

  read()

  function read() {
    fs.readFile(path.join(base, packageName), onread)
  }

  function onread(err, buf) {
    var parent
    var pkg

    if (err) {
      /* istanbul ignore if - Doesn’t consistently happen. */
      if (err.code !== 'ENOENT') {
        return next(new Error('Could not read package: ' + err))
      }

      parent = path.dirname(base)

      // No `package.json`.
      if (parent === base) {
        return next()
      }

      base = parent
      return read()
    }

    try {
      pkg = JSON.parse(buf)
    } catch (error) {
      // Invalid JSON.
      return next(new Error('Could not parse package: ' + error))
    }

    ctx.pkg = pkg
    ctx.pkgRoot = base
    return next()
  }
}
