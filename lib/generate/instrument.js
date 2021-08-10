import {resolve} from 'import-meta-resolve'
import babel from '@babel/core'

export async function instrument(ctx) {
  const logs = []
  const mainReferences = []
  const nodes = []
  let result

  try {
    result = await babel.transformAsync(ctx.example, {
      plugins: [addIdToConsoleLog],
      cwd: ctx.cwd,
      filename: ctx.exampleFileUrl,
      caller: {name: 'remark-usage'},
      sourceType: 'unambiguous'
    })
  } catch (error) {
    throw new Error('Could not parse example: ' + error)
  }

  const promises = nodes.map((node) => {
    return resolve(node.value, ctx.exampleFileUrl).then((resolved) => {
      if (resolved === ctx.main) {
        // Babel always adds raw, but just to be sure.
        /* c8 ignore next */
        const raw = (node && node.extra && node.extra.raw) || "'"

        mainReferences.push({
          start: node.start,
          end: node.end,
          quote: raw.charAt(0)
        })
      }
    })
  })

  await Promise.allSettled(promises)

  ctx.exampleInstrumented = result.code
  ctx.logs = logs
  ctx.mainReferences = mainReferences

  function addIdToConsoleLog() {
    const t = babel.types
    let index = -1

    return {
      visitor: {
        ImportDeclaration(path) {
          instrumentMainReference(path.node.source)
        },
        CallExpression(path) {
          const callee = path.get('callee')

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
      nodes.push(node)
    }

    function instrumentConsoleLog(path) {
      const node = path.node
      const args = [...node.arguments]
      let language

      index++

      if (args.length > 1 && args[0].type === 'StringLiteral') {
        const head = args.shift()
        language = head.value
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
