import {exec} from 'child_process'

export function run(ctx, next) {
  var cmd = [process.execPath]

  // Not tested on dubnium. Remove when tests are Node 12+
  /* c8 ignore next 3 */
  if (ctx.experimentalModules) {
    cmd.push('--experimental-modules')
  }

  cmd.push(ctx.exampleInstrumentedPath)

  exec(cmd.join(' '), onexec)

  function onexec(err, stdout) {
    var logs = ctx.logs
    var out
    var open
    var close
    var startMatch
    var endMatch
    var start
    var end
    var logIndex
    var value

    if (err) {
      return next(new Error('Could not run example: ' + err))
    }

    out = stdout
    open = new RegExp('<' + ctx.id + '-(\\d+)>', 'g')
    close = new RegExp('</' + ctx.id + '>', 'g')

    while ((startMatch = open.exec(out))) {
      close.lastIndex = startMatch.index
      endMatch = close.exec(out)

      // Else should never occur, console is sync, but just to be sure.
      if (endMatch) {
        start = startMatch.index + startMatch[0].length
        end = endMatch.index
        logIndex = parseInt(startMatch[1], 10)
        value = out.slice(start, end)

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
  }
}
