'use strict'

var path = require('path')
var babel = require('@babel/core')
var resolveFrom = require('resolve-from')

module.exports = instrument

function instrument(ctx, next) {
  var logs = []
  var mainReferences = []

  babel.transform(
    ctx.example,
    {
      plugins: [addIdToConsoleLog],
      cwd: ctx.cwd,
      filename: ctx.examplePath,
      caller: {name: 'remark-usage'},
      sourceType: 'unambiguous'
    },
    ontransform
  )

  function ontransform(err, result) {
    if (err) {
      next(new Error('Could not parse example: ' + err))
    } else {
      ctx.exampleInstrumented = result.code
      ctx.logs = logs
      ctx.mainReferences = mainReferences
      next()
    }
  }

  function addIdToConsoleLog() {
    var t = babel.types
    var index = -1

    return {
      visitor: {
        ImportDeclaration: function(path) {
          instrumentMainReference(path.node.source)
        },
        CallExpression: function(path) {
          var callee = path.get('callee')

          if (
            callee.isIdentifier({name: 'require'}) &&
            path.get('arguments.0').isStringLiteral()
          ) {
            instrumentMainReference(path.get('arguments.0').node)
          }

          if (callee.matchesPattern('console.log')) {
            instrumentConsoleLog(path)
          }
        }
      }
    }

    function instrumentMainReference(node) {
      var raw = node && node.extra && node.extra.raw
      var filePath = resolveFrom.silent(
        path.dirname(ctx.examplePath),
        node.value
      )

      /* istanbul ignore if - Babel always adds raw, but just to be sure. */
      if (!raw) {
        raw = "'"
      }

      if (filePath && filePath === ctx.main) {
        mainReferences.push({
          start: node.start,
          end: node.end,
          quote: raw.charAt(0)
        })
      }
    }

    function instrumentConsoleLog(path) {
      var node = path.node
      var args = node.arguments.concat()
      var head
      var language

      index++

      if (args.length > 1 && args[0].type === 'StringLiteral') {
        head = args.shift()
        language = head.value
      }

      logs[index] = {
        start: node.start,
        end: node.end,
        language: language,
        values: []
      }

      node.arguments = [].concat(
        t.stringLiteral('<' + ctx.id + '-' + index + '>'),
        args,
        t.stringLiteral('</' + ctx.id + '>')
      )
    }
  }
}
