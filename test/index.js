'use strict'

var fs = require('fs')
var path = require('path')
var test = require('tape')
var remark = require('remark')
var hidden = require('is-hidden')
var negate = require('negate')
var usage = require('..')

var read = fs.readFileSync

test('usage()', function(t) {
  t.equal(typeof usage, 'function', 'should be a function')

  t.doesNotThrow(function() {
    usage.call(remark)
  }, 'should not throw if not passed options')

  t.end()
})

var root = path.join(__dirname, 'fixtures')
var fixtures = fs.readdirSync(root).filter(negate(hidden))

fs.renameSync('package.json', 'package.json.bak')

test.onFinish(function() {
  fs.renameSync('package.json.bak', 'package.json')
})

test('Fixtures', function(t) {
  fixtures.forEach(function(fixture) {
    t.test(fixture, function(st) {
      var base = path.join(root, fixture)
      var input = read(path.join(base, 'readme.md'))
      var expected = ''
      var config = {}
      var file

      st.plan(1)

      try {
        expected = String(read(path.join(base, 'output.md')))
      } catch (error) {}

      try {
        config = JSON.parse(read(path.join(base, 'config.json')))
      } catch (error) {}

      file = {contents: input, cwd: base}

      if (!config.withoutFilePath) {
        file.path = 'readme.md'
      }

      remark()
        .use(usage, config)
        .process(file, onprocess)

      function onprocess(err, file) {
        var fail = fixture.indexOf('fail-') === 0 ? fixture.slice(5) : ''
        var errMessage = fail ? new RegExp(fail.replace(/-/g, ' '), 'i') : null

        if (fail) {
          if (err) {
            if (errMessage.test(err)) {
              st.pass('should fail')
            } else {
              st.error(err, 'should fail')
            }
          } else {
            st.fail('should fail instead of work')
          }
        } else if (err) {
          st.error(err, 'should work instead of fail')
        } else {
          st.equal(String(file), expected, 'should work')
        }
      }
    })
  })

  t.end()
})
