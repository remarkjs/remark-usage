import {promisify} from 'util'
import cp from 'child_process'

const exec = promisify(cp.exec)

export async function run(ctx) {
  const logs = ctx.logs

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
