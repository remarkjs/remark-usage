/**
 * @typedef {import('mdast').Root} Root
 * @typedef {import('vfile').VFile} VFile
 * @typedef {import('type-fest').PackageJson} PackageJson
 * @typedef {import('../index.js').Options} Options
 *
 * @typedef {import('@babel/core').BabelFileResult} FileResult
 * @typedef {import('@babel/core').PluginPass} PluginPass
 * @typedef {import('@babel/types').ImportDeclaration} ImportDeclaration
 * @typedef {import('@babel/types').CallExpression} CallExpression
 * @typedef {import('@babel/types').StringLiteral} StringLiteral
 *
 * @typedef Log
 * @property {number|null} start
 * @property {number|null} end
 * @property {string|undefined} language
 * @property {string[]} values
 *
 * @typedef Reference
 * @property {number|null} start
 * @property {number|null} end
 * @property {string} quote
 */

import url from 'node:url'
import {resolve} from 'import-meta-resolve'
import babel from '@babel/core'

/** @param {{tree: Root, file: VFile, options: Options, pkg: PackageJson, pkgRoot: string, main: string|undefined, name: string|undefined, id: string, exampleFileUrl: string, example: string, exampleInstrumented?: string, logs?: Log[], mainReferences?: Reference[]}} ctx */
export async function instrument(ctx) {
  /** @type {StringLiteral[]} */
  const nodes = []
  /** @type {Log[]} */
  const logs = []
  /** @type {Reference[]} */
  const mainReferences = []
  /** @type {FileResult|null} */
  let result

  try {
    result = await babel.transformAsync(ctx.example, {
      plugins: [addIdToConsoleLog],
      cwd: ctx.file.cwd,
      filename: url.fileURLToPath(ctx.exampleFileUrl),
      caller: {name: 'remark-usage'},
      sourceType: 'unambiguous'
    })
  } catch (error) {
    throw new Error('Could not parse example: ' + error)
  }

  const promises = nodes.map(async (node) => {
    try {
      const resolved = await resolve(node.value, ctx.exampleFileUrl)

      if (resolved === ctx.main) {
        // Babel always adds raw, but just to be sure.
        /* c8 ignore next */
        const raw = String((node && node.extra && node.extra.raw) || "'")

        mainReferences.push({
          start: node.start,
          end: node.end,
          quote: raw.charAt(0)
        })
      }
      // Wrapped in a catch just to be sure.
      /* c8 ignore next */
    } catch {}
  })

  await Promise.allSettled(promises)

  // Babel always returns a result (though types say it might not).
  /* c8 ignore next */
  ctx.exampleInstrumented = (result && result.code) || ''
  ctx.logs = logs
  ctx.mainReferences = mainReferences

  function addIdToConsoleLog() {
    const t = babel.types
    let index = -1

    /** @type {PluginPass} */
    return {
      visitor: {
        /**
         * @param {import('@babel/core').NodePath<ImportDeclaration>} path
         */
        ImportDeclaration(path) {
          nodes.push(path.node.source)
        },
        /**
         * @param {import('@babel/core').NodePath<CallExpression>} path
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
        }
      }
    }

    /**
     * @param {import('@babel/core').NodePath<CallExpression>} path
     */
    function instrumentConsoleLog(path) {
      const node = path.node
      const args = [...node.arguments]
      const head = args[0]
      /** @type {string|undefined} */
      let language

      index++

      if (head && head.type === 'StringLiteral' && args.length > 1) {
        language = head.value
        args.shift()
      }

      logs[index] = {
        start: node.start,
        end: node.end,
        language,
        values: []
      }

      node.arguments = [
        t.stringLiteral('<' + ctx.id + '-' + index + '>'),
        ...args,
        t.stringLiteral('</' + ctx.id + '>')
      ]
    }
  }
}
