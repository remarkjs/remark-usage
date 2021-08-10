/**
 * @typedef {import('mdast').Root} Root
 * @typedef {import('vfile').VFile} VFile
 * @typedef {import('type-fest').PackageJson} PackageJson
 * @typedef {import('../index.js').Options} Options
 * @typedef {import('./instrument.js').Log} Log
 * @typedef {import('./instrument.js').Reference} Reference
 *
 * @typedef Comment
 * @property {'comment'} type
 * @property {string[]} values
 *
 * @typedef Skip
 * @property {'skip'} type
 * @property {number} skip
 *
 * @typedef Code
 * @property {'code'} type
 * @property {number} start
 * @property {number} end
 *
 * @typedef {Comment|Skip|Code} Token
 */

/** @param {{tree: Root, file: VFile, options: Options, pkg: PackageJson, pkgRoot: string, main: string|undefined, name: string|undefined, id: string, exampleFileUrl: string, example: string, exampleInstrumented: string, logs: Log[], mainReferences: Reference[], exampleInstrumentedPath: string, tokens?: Token[]}} ctx */
export function tokenize(ctx) {
  const lineBreak = /\r?\n/g
  const lineComment = /^\s*\/\/\s*/
  const ignoreComment = /^remark-usage-ignore-next(?:\s+(\d+))?/
  const example = ctx.example
  /** @type {Token[]} */
  const tokens = []
  let start = 0
  let skip = 0
  /** @type {RegExpExecArray|null} */
  let match
  /** @type {Token|undefined} */
  let token

  while ((match = lineBreak.exec(example))) {
    const end = match.index
    let line = example.slice(start, end)

    // If the line is supposed to be skipped, skip it.
    // Skipping can only happen by starting a comment.
    if (skip) {
      skip--
    }
    // Empty:
    else if (line.trim().length === 0) {
      if (token) {
        if (token.type === 'comment') {
          token.values.push(match[0])
        } else if (token.type === 'code') {
          token.end = end
        }
      }
    } else {
      const comment = line.match(lineComment)

      if (comment) {
        line = line.slice(comment[0].length)
        const ignore = line.match(ignoreComment)

        if (ignore) {
          // Skip next couple of lines.
          skip =
            (ignore[1] !== undefined && Number.parseInt(ignore[1], 10)) || 1
          token = {type: 'skip', skip}
          tokens.push(token)
        } else {
          if (!token || token.type !== 'comment') {
            token = {type: 'comment', values: []}
            tokens.push(token)
          }

          token.values.push(line, match[0])
        }
      } else {
        if (!token || token.type !== 'code') {
          token = {type: 'code', start, end}
          tokens.push(token)
        }

        token.end = end
      }
    }

    start = end + match[0].length
  }

  ctx.tokens = tokens
}
