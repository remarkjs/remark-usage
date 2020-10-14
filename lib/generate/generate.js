'use strict'

var unified = require('unified')
var markdown = require('remark-parse')
var clear = require('unist-util-remove-position')

module.exports = generate

var processor = unified().use(markdown)

function generate(ctx) {
  var nodes = []
  var tokens = ctx.tokens
  var length = tokens.length
  var index = -1
  var node
  var fn

  while (++index < length) {
    node = tokens[index]
    fn = node.type === 'comment' ? comment : node.type === 'code' ? code : noop
    nodes = nodes.concat(fn(node, ctx) || [])
  }

  ctx.nodes = nodes
}

function noop() {}

function comment(node) {
  var tree = clear(processor.parse(node.values.join('')))
  return tree.children
}

function code(node, ctx) {
  var example = ctx.example
  var start = node.start
  var end = node.end
  var tokens = []
  var token
  var consoleCall
  var mainReference
  var nodes
  var length
  var index
  var lineEnd
  var line

  while (start < end) {
    lineEnd = example.indexOf('\n', start)
    lineEnd = lineEnd === -1 || lineEnd >= end ? end : lineEnd

    consoleCall = findInLine(ctx.logs, start, lineEnd)

    if (consoleCall && consoleCall.values.length !== 0) {
      line = example.slice(start, lineEnd)

      if (token && token === consoleCall) {
        // Ignore: it’s the same multiline console call.
      } else {
        token = consoleCall
        tokens.push(token)
      }
    } else {
      mainReference = ctx.name && findInLine(ctx.mainReferences, start, lineEnd)

      if (mainReference) {
        line =
          example.slice(start, mainReference.start) +
          mainReference.quote +
          ctx.name +
          mainReference.quote +
          example.slice(mainReference.end, lineEnd)
      } else {
        line = example.slice(start, lineEnd)
      }

      if (!token || token.type !== 'code') {
        token = {type: 'code', values: []}
        tokens.push(token)
      }

      token.values.push(line)
    }

    start = lineEnd + 1
  }

  nodes = []
  length = tokens.length
  index = -1

  while (++index < length) {
    token = tokens[index]
    nodes.push({
      type: 'code',
      lang: token.type === 'code' ? 'javascript' : token.language,
      value: token.values.join('\n').replace(/^\n+|\n+$/g, '')
    })
  }

  return nodes
}

function findInLine(values, start, end) {
  var length = values.length
  var index = -1
  var reference

  while (++index < length) {
    reference = values[index]

    if (
      // Reference in:
      (reference.start >= start && reference.end <= end) ||
      // Line in reference:
      (start >= reference.start && end <= reference.end)
    ) {
      return reference
    }
  }
}
