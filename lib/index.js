/**
 * @typedef {import('@babel/core').BabelFileResult} FileResult
 * @typedef {import('@babel/core').NodePath<CallExpression>} NodePathCallExpression
 * @typedef {import('@babel/core').NodePath<ImportDeclaration>} NodePathImportDeclaration
 * @typedef {import('@babel/core').PluginPass} PluginPass
 * @typedef {import('@babel/types').CallExpression} CallExpression
 * @typedef {import('@babel/types').ImportDeclaration} ImportDeclaration
 * @typedef {import('@babel/types').StringLiteral} StringLiteral
 * @typedef {import('mdast').Root} Root
 * @typedef {import('mdast').RootContent} RootContent
 * @typedef {import('type-fest').PackageJson} PackageJson
 */

/**
 * @typedef Code
 *   Code.
 * @property {number} end
 *   End.
 * @property {number} start
 *   Start.
 * @property {'code'} type
 *   Type.
 *
 * @typedef CodeWithValues
 *   Code.
 * @property {'code'} type
 *   Kind.
 * @property {Array<string>} values
 *   Results.
 *
 * @typedef Comment
 *   Comment.
 * @property {'comment'} type
 *   Type.
 * @property {Array<string>} values
 *   Values.
 *
 * @typedef GenerateOptions
 * @property {string} example
 * @property {string | null | undefined} name
 * @property {InstrumentResult} instrumented
 *
 * @typedef InstrumentOptions
 *   Configuration.
 * @property {VFile} example
 *   File.
 * @property {string} id
 *   ID.
 * @property {string | null | undefined} [main]
 *   Main.
 *
 * @typedef InstrumentResult
 * @property {string} result
 * @property {Array<Log>} logs
 * @property {Array<Reference>} references
 *
 * @typedef Log
 *   Log.
 * @property {number | null | undefined} end
 *   End.
 * @property {string | undefined} language
 *   Code language.
 * @property {number | null | undefined} start
 *   Start.
 * @property {Array<string>} values
 *   Values.
 *
 * @typedef PackageInfo
 *   Info on the package.
 * @property {PackageJson} value
 *   Data.
 * @property {VFile} file
 *   File.
 *
 * @typedef Reference
 *   Reference.
 * @property {number | null | undefined} end
 *   End.
 * @property {string} quote
 *   Quote.
 * @property {number | null | undefined} start
 *   Start.
 *
 * @typedef Skip
 *   Skip.
 * @property {number} skip
 *   Skip.
 * @property {'skip'} type
 *   Type.
 *
 * @typedef {Code | Comment | Skip} Token
 *   Token.
 */

/**
 * @typedef Options
 *   Configuration.
 * @property {string | null | undefined} [example]
 *   Path to example file (optional);
 *   resolved from `file.cwd`;
 *   defaults to the first example that exists:
 *
 *   * `'example.js'`
 *   * `'example/index.js'`
 *   * `'examples.js'`
 *   * `'examples/index.js'`
 *   * `'doc/example.js'`
 *   * `'doc/example/index.js'`
 *   * `'docs/example.js'`
 *   * `'docs/example/index.js'`
 * @property {string | null | undefined} [heading]
 *   Heading to look for (default: `'usage'`);
 *   wrapped in `new RegExp('^(' + value + ')$', 'i');`.
 * @property {string | null | undefined} [main]
 *   Path to the file (default: `pkg.exports`, `pkg.main`, `'index.js'`);
 *   resolved from `file.cwd`;
 *   used to rewrite `import x from './main.js'` to `import x from 'name'`.
 * @property {string | null | undefined} [name]
 *   Name of the module (default: `pkg.name`);
 *   used to rewrite `import x from './main.js'` to `import x from 'name'`.
 */

import {exec as execCallback} from 'node:child_process'
import fs from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'
import {pathToFileURL} from 'node:url'
import {promisify} from 'node:util'
import babel from '@babel/core'
import {resolve} from 'import-meta-resolve'
import {fromMarkdown} from 'mdast-util-from-markdown'
import {headingRange} from 'mdast-util-heading-range'
import {nanoid} from 'nanoid'
import {removePosition} from 'unist-util-remove-position'
import {VFile} from 'vfile'
import {findUp} from 'vfile-find-up'
import {VFileMessage} from 'vfile-message'

const exec = promisify(execCallback)

const relativePrefix = './'
const defaultHeading = 'usage'
/** @type {Readonly<Options>} */
const emptyOptions = {}

/**
 * Add a usage example to a readme.
 *
 * Looks for the first heading matching `options.heading` (case insensitive),
 * removes everything between it and an equal or higher next heading, and replaces
 * that with a example.
 *
 * The example runs in Node.js (so no side effects!).
 * Line comments (`//`) are turned into markdown.
 * Calls to `console.log()` are exposed as code blocks, containing the logged
 * values, so `console.log(1 + 1)` becomes `2`.
 * Use a string as the first argument to `log` to use as the language for the code.
 *
 * You can ignore lines with `remark-usage-ignore-next`:
 *
 * ```js
 * // remark-usage-ignore-next
 * const two = sum(1, 1)
 *
 * // remark-usage-ignore-next 3
 * function sum(a, b) {
 *   return a + b
 * }
 * ```
 *
 * …if no `skip` is given, 1 line is skipped.
 *
 * @param {Readonly<Options> | null | undefined} [options]
 *   Configuration (optional).
 * @returns
 *   Transform.
 */
export default function remarkUsage(options) {
  const settings = options || emptyOptions
  const header = new RegExp(
    '^(' + (settings.heading || defaultHeading) + ')$',
    'i'
  )

  /**
   * Transform.
   *
   * @param {Root} tree
   *   Tree.
   * @param {VFile} file
   *   File.
   * @returns {Promise<undefined>}
   *   Nothing.
   */
  return async function (tree, file) {
    let exists = false

    // Walk the tree once to check if the heading exists.
    // Walking the tree may be slow, but it’s much more slow to run Babel, spawn
    // node, and generate the example.
    headingRange(tree, header, function () {
      exists = true
    })

    if (!exists) {
      return
    }

    const id = 'remark-usage-example-' + nanoid().toLowerCase()
    const cwd = file.cwd
    const from = file.path
      ? path.dirname(path.resolve(file.cwd, file.path))
      : file.cwd
    const pkg = await findPackage(from)
    const name = settings.name || pkg?.value.name || undefined
    /** @type {string | undefined} */
    let main

    try {
      const exports = pkg?.value.exports
      const primary =
        /* c8 ignore next 2 -- seems useless to have an array, but types have it. */
        exports && typeof exports === 'object' && Array.isArray(exports)
          ? exports[0]
          : exports
      const item =
        primary && typeof primary === 'object' ? primary['.'] : primary

      main = resolve(
        relativeModule(
          settings.main ||
            (typeof item === 'string' ? item : undefined) ||
            pkg?.value.main ||
            'index.js'
        ),
        pathToFileURL(settings.main ? cwd : pkg?.file.dirname || cwd).href + '/'
      )
    } catch {}

    const example = await findExample(cwd, settings.example)
    const instrumented = await instrumentExample(cwd, {example, id, main})

    await run(example, instrumented, id)

    // Add example.
    headingRange(tree, header, function (start, _, end) {
      const tokens = tokenize(String(example))
      const nodes = generate(tokens, {
        example: String(example),
        instrumented,
        name
      })
      return [start, ...nodes, end]
    })
  }
}

/**
 * @param {string} from
 *   From.
 * @returns {Promise<PackageInfo | undefined>}
 *   Nothing.
 */
async function findPackage(from) {
  const file = await findUp('package.json', from)

  if (!file) return

  const doc = String(await fs.readFile(file.path))

  /** @type {PackageJson} */
  let value

  try {
    value = JSON.parse(doc)
  } catch (error) {
    const cause = /** @type {Error} */ (error)
    throw new VFileMessage('Cannot parse `package.json` as JSON', {
      cause,
      ruleId: 'package-json-invalid',
      source: 'remark-usage'
    })
  }

  return {value, file}
}

/**
 * @param {string} cwd
 * @param {string | null | undefined} givenExample
 * @returns {Promise<VFile>}
 */
async function findExample(cwd, givenExample) {
  const example = givenExample
    ? findExplicitExample(cwd, givenExample)
    : findImplicitExample(cwd)

  if (!example) {
    throw new VFileMessage(
      'Cannot find example file to use, either pass `options.example` or use a  name',
      {
        ruleId: 'example-missing',
        source: 'remark-usage'
      }
    )
  }

  const url = new URL(example)
  const value = String(await fs.readFile(url))

  return new VFile({
    path: url,
    // Make sure there is a final line feed.
    value: value.charAt(value.length - 1) === '\n' ? value : value + '\n'
  })
}

/**
 * @param {string} cwd
 *   Base.
 * @param {string} example
 *   Name.
 * @returns {string}
 *   URL.
 */
function findExplicitExample(cwd, example) {
  const from = pathToFileURL(cwd).href + '/'
  return resolve(relativeModule(example), from)
}

/**
 * @param {string} cwd
 *   Base.
 * @returns {string | undefined}
 *   URL.
 */
function findImplicitExample(cwd) {
  const from = pathToFileURL(cwd).href + '/'
  const examples = [
    './example.js',
    './example/index.js',
    './examples.js',
    './examples/index.js',
    './doc/example.js',
    './doc/example/index.js',
    './docs/example.js',
    './docs/example/index.js'
  ]
  let index = -1

  while (++index < examples.length) {
    const example = examples[index]

    try {
      return resolve(example, from)
    } catch {}
  }
}

/**
 * @param {string} cwd
 * @param {InstrumentOptions} options
 * @returns {Promise<InstrumentResult>}
 *   Nothing.
 */
async function instrumentExample(cwd, options) {
  /** @type {Array<StringLiteral>} */
  const nodes = []
  /** @type {Array<Log>} */
  const logs = []
  /** @type {Array<Reference>} */
  const references = []
  /** @type {FileResult | null} */
  let result

  try {
    result = await babel.transformAsync(String(options.example), {
      caller: {name: 'remark-usage'},
      cwd,
      filename: options.example.path,
      plugins: [addIdToConsoleLog],
      sourceType: 'unambiguous'
    })
  } catch (error) {
    const cause = /** @type {Error} */ (error)
    throw new VFileMessage('Cannot parse example as JS with Babel', {
      cause,
      ruleId: 'example-invalid-babel',
      source: 'remark-usage'
    })
  }

  let index = -1
  while (++index < nodes.length) {
    const node = nodes[index]
    const resolved = resolve(
      node.value,
      pathToFileURL(options.example.path).href
    )

    if (resolved === options.main) {
      /* c8 ignore next -- babel always adds raw, but just to be sure. */
      const raw = String((node && node.extra && node.extra.raw) || "'")

      references.push({
        end: node.end,
        quote: raw.charAt(0),
        start: node.start
      })
    }
  }

  return {
    logs,
    references,
    /* c8 ignore next -- babel always returns a result (though types say it might not). */
    result: result?.code || ''
  }

  function addIdToConsoleLog() {
    const t = babel.types
    let index = -1

    /** @type {PluginPass} */
    return {
      visitor: {
        /**
         * @param {NodePathCallExpression} path
         *   Path.
         * @returns {undefined}
         *   Nothing.
         */
        CallExpression(path) {
          const callee = path.get('callee')
          const head = path.get('arguments.0')

          if (
            callee.isIdentifier({name: 'require'}) &&
            !Array.isArray(head) &&
            head.isStringLiteral()
          ) {
            nodes.push(head.node)
          }

          if (callee.matchesPattern('console.log')) {
            instrumentConsoleLog(path)
          }
        },
        /**
         * @param {NodePathImportDeclaration} path
         *   Path.
         * @returns {undefined}
         *   Nothing.
         */
        ImportDeclaration(path) {
          nodes.push(path.node.source)
        }
      }
    }

    /**
     * @param {NodePathCallExpression} path
     *   Path.
     * @returns {undefined}
     *   Nothing.
     */
    function instrumentConsoleLog(path) {
      const node = path.node
      const args = [...node.arguments]
      const head = args[0]
      /** @type {string | undefined} */
      let language

      index++

      if (head && head.type === 'StringLiteral' && args.length > 1) {
        language = head.value
        args.shift()
      }

      logs[index] = {
        end: node.end,
        language,
        start: node.start,
        values: []
      }

      node.arguments = [
        t.stringLiteral('<' + options.id + '-' + index + '>'),
        ...args,
        t.stringLiteral('</' + options.id + '>')
      ]
    }
  }
}

/**
 * @param {VFile} example
 * @param {InstrumentResult} instrumented
 * @param {string} id
 * @returns {Promise<undefined>}
 *   Nothing.
 */
async function run(example, instrumented, id) {
  /* c8 ignore next -- there’s always a dirname. */
  const filePath = path.join(example.dirname || '', id + example.extname)
  let stdout = ''

  await fs.writeFile(filePath, instrumented.result)

  try {
    const result = await exec([process.execPath, filePath].join(' '))
    stdout = result.stdout
  } catch (error) {
    const cause = /** @type {Error} */ (error)
    throw new VFileMessage('Cannot run example with Node', {
      cause,
      ruleId: 'example-invalid-node',
      source: 'remark-usage'
    })
  } finally {
    await fs.unlink(filePath)
  }

  const open = new RegExp('<' + id + '-(\\d+)>', 'g')
  const close = new RegExp('</' + id + '>', 'g')
  /** @type {RegExpExecArray | null} */
  let startMatch

  while ((startMatch = open.exec(stdout))) {
    close.lastIndex = startMatch.index
    const endMatch = close.exec(stdout)

    // Else should never occur, console is sync, but just to be sure.
    if (endMatch) {
      const start = startMatch.index + startMatch[0].length
      const end = endMatch.index
      const logIndex = Number.parseInt(startMatch[1], 10)
      const log = instrumented.logs[logIndex]
      let value = stdout.slice(start, end)

      // Else should never occur, console adds spaces at start and end, just
      // to be sure we’re checking it though.
      if (value.charAt(0) === ' ' && value.charAt(value.length - 1) === ' ') {
        value = value.slice(1, -1)
      }

      log.values.push(value)
      open.lastIndex = end
    }
  }
}

/**
 * @param {string} value
 * @returns {Array<Token>}
 *   Tokens.
 */
function tokenize(value) {
  const lineBreak = /\r?\n/g
  const lineComment = /^\s*\/\/\s*/
  const ignoreComment = /^remark-usage-ignore-next(?:\s+(\d+))?/
  /** @type {Array<Token>} */
  const tokens = []
  let start = 0
  let skip = 0
  /** @type {RegExpExecArray | null} */
  let match
  /** @type {Token | undefined} */
  let token

  while ((match = lineBreak.exec(value))) {
    const end = match.index
    let line = value.slice(start, end)

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

  return tokens
}

/**
 * @param {Array<Token>} tokens
 *   Tokens.
 * @param {GenerateOptions} options
 *   Configuration.
 * @returns {Array<RootContent>}
 *   Result.
 */
function generate(tokens, options) {
  /** @type {Array<RootContent>} */
  const nodes = []
  let index = -1

  while (++index < tokens.length) {
    const token = tokens[index]
    const result =
      token.type === 'comment'
        ? comment(token)
        : token.type === 'code'
        ? code(token, options)
        : undefined

    if (result) {
      nodes.push(...result)
    }
  }

  return nodes
}

/**
 * @param {Comment} token
 *   Token.
 * @returns {Array<RootContent>}
 *   Result.
 */
function comment(token) {
  const tree = fromMarkdown(token.values.join(''))
  removePosition(tree)
  return tree.children
}

/**
 * @param {Code} token
 *   Token.
 * @param {GenerateOptions} options
 *   Configuration.
 * @returns {Array<RootContent>}
 *   Result.
 */
function code(token, options) {
  /** @type {Array<CodeWithValues | Log>} */
  const tokens = []
  let start = token.start
  /** @type {CodeWithValues | Log | undefined} */
  let tok

  while (start < token.end) {
    let lineEnd = options.example.indexOf('\n', start)
    lineEnd = lineEnd === -1 || lineEnd >= token.end ? token.end : lineEnd

    const consoleCall = findInLine(options.instrumented.logs, start, lineEnd)

    if (consoleCall && consoleCall.values.length > 0) {
      if (tok && tok === consoleCall) {
        // Ignore: it’s the same multiline console call.
      } else {
        tok = consoleCall
        tokens.push(tok)
      }
    } else {
      const mainReference = options.name
        ? findInLine(options.instrumented.references, start, lineEnd)
        : undefined

      const line =
        mainReference &&
        typeof mainReference.start === 'number' &&
        typeof mainReference.end === 'number'
          ? options.example.slice(start, mainReference.start) +
            mainReference.quote +
            options.name +
            mainReference.quote +
            options.example.slice(mainReference.end, lineEnd)
          : options.example.slice(start, lineEnd)

      if (!tok || !('type' in tok) || tok.type !== 'code') {
        tok = {type: 'code', values: []}
        tokens.push(tok)
      }

      tok.values.push(line)
    }

    start = lineEnd + 1
  }

  /** @type {Array<RootContent>} */
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
 * @template {Log | Reference} Value
 *   Token kind.
 * @param {Array<Value>} values
 *   Values.
 * @param {number} start
 *   Start.
 * @param {number} end
 *   End.
 * @returns {Value | undefined}
 *   Found.
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

/**
 * Make a path relative.
 *
 * @param {string} moduleId
 *   Specifier.
 * @returns {string}
 *   Relative specifier.
 */
function relativeModule(moduleId) {
  return moduleId.slice(0, 2) === relativePrefix
    ? moduleId
    : relativePrefix + moduleId
}
