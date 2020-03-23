'use strict'

module.exports = tokenize

function tokenize(ctx) {
  var lineBreak = /\r?\n/g
  var lineComment = /^\s*\/\/\s*/
  var ignoreComment = /^remark-usage-ignore-next(?:\s+(\d+))?/
  var example = ctx.example
  var start = 0
  var end
  var skip = 0
  var match
  var line
  var comment
  var ignore
  var tokens = []
  var token

  while ((match = lineBreak.exec(example))) {
    end = match.index
    line = example.slice(start, end)

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
      comment = line.match(lineComment)

      if (comment) {
        line = line.slice(comment[0].length)
        ignore = line.match(ignoreComment)

        if (ignore) {
          // Skip next couple of lines.
          skip = (ignore[1] !== undefined && parseInt(ignore[1], 10)) || 1
          token = {type: 'skip', skip: skip}
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
          token = {type: 'code', start: start, end: end}
          tokens.push(token)
        }

        token.end = end
      }
    }

    start = end + match[0].length
  }

  ctx.tokens = tokens
}
