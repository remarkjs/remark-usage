/**
 * @typedef {import('mdast').Root} Root
 * @typedef {import('vfile').VFile} VFile
 * @typedef {import('type-fest').PackageJson} PackageJson
 * @typedef {import('../index.js').Options} Options
 * @typedef {import('./instrument.js').Log} Log
 * @typedef {import('./instrument.js').Reference} Reference
 */

import {promisify} from 'util'
import cp from 'child_process'

const exec = promisify(cp.exec)

/** @param {{tree: Root, file: VFile, options: Options, pkg: PackageJson, pkgRoot: string, main: string|undefined, name: string|undefined, id: string, exampleFileUrl: string, example: string, exampleInstrumented: string, logs: Log[], mainReferences: Reference[], exampleInstrumentedPath: string}} ctx */
export async function run(ctx) {
  const logs = ctx.logs

  /** @type {{stdout: string}} */
  let result

  try {
    result = await exec(
      [process.execPath, ctx.exampleInstrumentedPath].join(' ')
    )
  } catch (error) {
    throw new Error('Could not run example: ' + error)
  }

  const {stdout} = result
  const open = new RegExp('<' + ctx.id + '-(\\d+)>', 'g')
  const close = new RegExp('</' + ctx.id + '>', 'g')
  /** @type {RegExpExecArray|null} */
  let startMatch

  while ((startMatch = open.exec(stdout))) {
    close.lastIndex = startMatch.index
    const endMatch = close.exec(stdout)

    // Else should never occur, console is sync, but just to be sure.
    if (endMatch) {
      const start = startMatch.index + startMatch[0].length
      const end = endMatch.index
      const logIndex = Number.parseInt(startMatch[1], 10)
      let value = stdout.slice(start, end)

      // Else should never occur, console adds spaces at start and end, just
      // to be sure we’re checking it though.
      if (value.charAt(0) === ' ' && value.charAt(value.length - 1) === ' ') {
        value = value.slice(1, -1)
      }

      logs[logIndex].values.push(value)

      open.lastIndex = end
    }
  }
}
