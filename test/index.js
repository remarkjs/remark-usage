import fs from 'fs'
import path from 'path'
import test from 'tape'
import {remark} from 'remark'
import {isHidden} from 'is-hidden'
import negate from 'negate'
import remarkUsage from '../index.js'

test('remarkUsage', function (t) {
  t.equal(typeof remarkUsage, 'function', 'should be a function')

  t.doesNotThrow(function () {
    remarkUsage.call(remark)
  }, 'should not throw if not passed options')

  t.end()
})

var root = path.join('test', 'fixtures')
var fixtures = fs.readdirSync(root).filter(negate(isHidden))

fs.writeFileSync(
  path.join(root, 'fail-could-not-parse-example', 'example.js'),
  "'"
)

fs.writeFileSync(
  path.join(root, 'fail-could-not-parse-package', 'package.json'),
  '{'
)
fs.renameSync('package.json', 'package.json.bak')

test.onFinish(() => {
  fs.unlinkSync(path.join(root, 'fail-could-not-parse-example', 'example.js'))
  fs.unlinkSync(path.join(root, 'fail-could-not-parse-package', 'package.json'))
  fs.renameSync('package.json.bak', 'package.json')
})

// Ignore es modules below Node 12.
var version = parseInt(process.version.slice(1), 10)

if (version < 12) {
  fixtures = fixtures.filter(function (f) {
    var prefix = 'es-module'
    return f.slice(0, prefix.length) !== prefix
  })
}

test('Fixtures', function (t) {
  fixtures.forEach(function (fixture) {
    t.test(fixture, function (st) {
      var base = path.join(root, fixture)
      var input = fs.readFileSync(path.join(base, 'readme.md'))
      var expected = ''
      var config = {}
      var file

      st.plan(1)

      try {
        expected = String(fs.readFileSync(path.join(base, 'output.md')))
      } catch (error) {}

      try {
        config = JSON.parse(fs.readFileSync(path.join(base, 'config.json')))
      } catch (error) {}

      file = {value: input, cwd: base}

      if (!config.withoutFilePath) {
        file.path = 'readme.md'
      }

      remark().use(remarkUsage, config).process(file, onprocess)

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
