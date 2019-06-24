'use strict'

var exec = require('child_process').exec

module.exports = run

function run(ctx, next) {
  exec('node ' + ctx.exampleInstrumentedPath, onexec)

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

      /* istanbul ignore else - should never occur, console is sync, but just to
       * be sure. */
      if (endMatch) {
        start = startMatch.index + startMatch[0].length
        end = endMatch.index
        logIndex = parseInt(startMatch[1], 10)
        value = out.slice(start, end)

        /* istanbul ignore else - console adds spaces at start and end, just to
         * be sure we’re checking it though. */
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
