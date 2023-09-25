/**
 * @typedef {import('mdast').Root} Root
 * @typedef {import('mdast').BlockContent} BlockContent
 * @typedef {import('vfile').VFile} VFile
 * @typedef {import('type-fest').PackageJson} PackageJson
 * @typedef {import('../index.js').Options} Options
 * @typedef {import('./instrument.js').Log} Log
 * @typedef {import('./instrument.js').Reference} Reference
 * @typedef {import('./tokenize.js').Token} Token
 * @typedef {import('./tokenize.js').Comment} Comment
 * @typedef {import('./tokenize.js').Code} Code
 *
 * @typedef {{type: 'code', values: string[]}} CodeWithValues
 */

import {unified} from 'unified'
import remarkParse from 'remark-parse'
import {removePosition} from 'unist-util-remove-position'

const processor = unified().use(remarkParse)

/** @param {{tree: Root, file: VFile, options: Options, pkg: PackageJson, pkgRoot: string, main: string|undefined, name: string|undefined, id: string, exampleFileUrl: string, example: string, exampleInstrumented: string, logs: Log[], mainReferences: Reference[], exampleInstrumentedPath: string, tokens: Token[], nodes?: BlockContent[]}} ctx */
export function generate(ctx) {
  /** @type {BlockContent[]} */
  const nodes = []
  let index = -1

  while (++index < ctx.tokens.length) {
    const token = ctx.tokens[index]
    const result =
      token.type === 'comment'
        ? comment(token)
        : token.type === 'code'
        ? code(token, ctx)
        : []

    nodes.push(...result)
  }

  ctx.nodes = nodes
}

/**
 * @param {Comment} token
 * @returns {BlockContent[]}
 */
function comment(token) {
  const tree = processor.parse(token.values.join(''))
  removePosition(tree)
  // @ts-expect-error: Assume block content in `root`.
  return tree.children
}

/**
 * @param {Code} token
 * @param {{tree: Root, file: VFile, options: Options, pkg: PackageJson, pkgRoot: string, main: string|undefined, name: string|undefined, id: string, exampleFileUrl: string, example: string, exampleInstrumented: string, logs: Log[], mainReferences: Reference[], exampleInstrumentedPath: string, tokens: Token[]}} ctx
 * @returns {BlockContent[]}
 */
function code(token, ctx) {
  const example = ctx.example
  /** @type {Array.<CodeWithValues|Log>} */
  const tokens = []
  let start = token.start
  /** @type {CodeWithValues|Log|undefined} */
  let tok

  while (start < token.end) {
    let lineEnd = example.indexOf('\n', start)
    lineEnd = lineEnd === -1 || lineEnd >= token.end ? token.end : lineEnd

    const consoleCall = findInLine(ctx.logs, start, lineEnd)

    if (consoleCall && consoleCall.values.length > 0) {
      if (tok && tok === consoleCall) {
        // Ignore: it’s the same multiline console call.
      } else {
        tok = consoleCall
        tokens.push(tok)
      }
    } else {
      const mainReference =
        ctx.name && findInLine(ctx.mainReferences, start, lineEnd)

      const line =
        mainReference &&
        typeof mainReference.start === 'number' &&
        typeof mainReference.end === 'number'
          ? example.slice(start, mainReference.start) +
            mainReference.quote +
            ctx.name +
            mainReference.quote +
            example.slice(mainReference.end, lineEnd)
          : example.slice(start, lineEnd)

      if (!tok || !('type' in tok) || tok.type !== 'code') {
        tok = {type: 'code', values: []}
        tokens.push(tok)
      }

      tok.values.push(line)
    }

    start = lineEnd + 1
  }

  /** @type {BlockContent[]} */
  const nodes = []
  let index = -1

  while (++index < tokens.length) {
    const token = tokens[index]
    nodes.push({
      type: 'code',
      lang: 'language' in token ? token.language : 'javascript',
      value: token.values.join('\n').replace(/^\n+|\n+$/g, '')
    })
  }

  return nodes
}

/**
 * @template {Log|Reference} Value
 * @param {Value[]} values
 * @param {number} start
 * @param {number} end
 * @returns {Value|undefined}
 */
function findInLine(values, start, end) {
  let index = -1

  while (++index < values.length) {
    const reference = values[index]

    if (
      typeof reference.start === 'number' &&
      typeof reference.end === 'number' &&
      // Reference in:
      ((reference.start >= start && reference.end <= end) ||
        // Line in reference:
        (start >= reference.start && end <= reference.end))
    ) {
      return reference
    }
  }
}
