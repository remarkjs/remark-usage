import {unified} from 'unified'
import remarkParse from 'remark-parse'
import {removePosition} from 'unist-util-remove-position'

const processor = unified().use(remarkParse)

export function generate(ctx) {
  const nodes = []
  let index = -1

  while (++index < ctx.tokens.length) {
    const node = ctx.tokens[index]
    const fn =
      node.type === 'comment' ? comment : node.type === 'code' ? code : () => {}

    nodes.push(...(fn(node, ctx) || []))
  }

  ctx.nodes = nodes
}

function comment(node) {
  const tree = removePosition(processor.parse(node.values.join('')))
  return tree.children
}

function code(node, ctx) {
  const example = ctx.example
  const tokens = []
  let start = node.start
  let token

  while (start < node.end) {
    let lineEnd = example.indexOf('\n', start)
    lineEnd = lineEnd === -1 || lineEnd >= node.end ? node.end : lineEnd

    const consoleCall = findInLine(ctx.logs, start, lineEnd)

    if (consoleCall && consoleCall.values.length > 0) {
      if (token && token === consoleCall) {
        // Ignore: it’s the same multiline console call.
      } else {
        token = consoleCall
        tokens.push(token)
      }
    } else {
      const mainReference =
        ctx.name && findInLine(ctx.mainReferences, start, lineEnd)

      const line = mainReference
        ? example.slice(start, mainReference.start) +
          mainReference.quote +
          ctx.name +
          mainReference.quote +
          example.slice(mainReference.end, lineEnd)
        : example.slice(start, lineEnd)

      if (!token || token.type !== 'code') {
        token = {type: 'code', values: []}
        tokens.push(token)
      }

      token.values.push(line)
    }

    start = lineEnd + 1
  }

  const nodes = []
  let index = -1

  while (++index < tokens.length) {
    const token = tokens[index]
    nodes.push({
      type: 'code',
      lang: token.type === 'code' ? 'javascript' : token.language,
      value: token.values.join('\n').replace(/^\n+|\n+$/g, '')
    })
  }

  return nodes
}

function findInLine(values, start, end) {
  let index = -1

  while (++index < values.length) {
    const reference = values[index]

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
