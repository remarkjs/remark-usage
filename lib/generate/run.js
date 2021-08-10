import {exec} from 'child_process'

export function run(ctx, next) {
  const cmd = [process.execPath]

  // Not tested on dubnium. Remove when tests are Node 12+
  /* c8 ignore next 3 */
  if (ctx.experimentalModules) {
    cmd.push('--experimental-modules')
  }

  cmd.push(ctx.exampleInstrumentedPath)

  exec(cmd.join(' '), (error, stdout) => {
    const logs = ctx.logs

    if (error) {
      return next(new Error('Could not run example: ' + error))
    }

    const out = stdout
    const open = new RegExp('<' + ctx.id + '-(\\d+)>', 'g')
    const close = new RegExp('</' + ctx.id + '>', 'g')
    let startMatch
    let end

    while ((startMatch = open.exec(out))) {
      close.lastIndex = startMatch.index
      const endMatch = close.exec(out)

      // Else should never occur, console is sync, but just to be sure.
      if (endMatch) {
        const start = startMatch.index + startMatch[0].length
        end = endMatch.index
        const logIndex = Number.parseInt(startMatch[1], 10)
        let value = out.slice(start, end)

        // Else should never occur, console adds spaces at start and end, just
        // to be sure we’re checking it though.
        if (value.charAt(0) === ' ' && value.charAt(value.length - 1) === ' ') {
          value = value.slice(1, -1)
        }

        logs[logIndex].values.push(value)
      }

      open.lastIndex = end
    }

    next()
  })
}
