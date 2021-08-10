import fs from 'fs'
import path from 'path'
import test from 'tape'
import {remark} from 'remark'
import {isHidden} from 'is-hidden'
import remarkUsage from '../index.js'

test('remarkUsage', (t) => {
  t.equal(typeof remarkUsage, 'function', 'should be a function')

  t.doesNotThrow(() => {
    remarkUsage.call(remark)
  }, 'should not throw if not passed options')

  t.end()
})

const root = path.join('test', 'fixtures')
let fixtures = fs.readdirSync(root)

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
const version = Number.parseInt(process.version.slice(1), 10)

if (version < 12) {
  fixtures = fixtures.filter((f) => {
    const prefix = 'es-module'
    return f.slice(0, prefix.length) !== prefix
  })
}

test('Fixtures', (t) => {
  let index = -1

  while (++index < fixtures.length) {
    const fixture = fixtures[index]

    if (isHidden(fixture)) continue

    t.test(fixture, (st) => {
      const base = path.join(root, fixture)
      const input = fs.readFileSync(path.join(base, 'readme.md'))
      let expected = ''
      let config = {}

      st.plan(1)

      try {
        expected = String(fs.readFileSync(path.join(base, 'output.md')))
      } catch {}

      try {
        config = JSON.parse(fs.readFileSync(path.join(base, 'config.json')))
      } catch {}

      const file = {value: input, cwd: base}

      if (!config.withoutFilePath) {
        file.path = 'readme.md'
      }

      remark().use(remarkUsage, config).process(file, onprocess)

      function onprocess(error, file) {
        const fail = fixture.indexOf('fail-') === 0 ? fixture.slice(5) : ''
        const errorMessage = fail
          ? new RegExp(fail.replace(/-/g, ' '), 'i')
          : undefined

        if (fail) {
          if (error) {
            if (errorMessage.test(error)) {
              st.pass('should fail')
            } else {
              st.error(error, 'should fail')
            }
          } else {
            st.fail('should fail instead of work')
          }
        } else if (error) {
          st.error(error, 'should work instead of fail')
        } else {
          st.equal(String(file), expected, 'should work')
        }
      }
    })
  }

  t.end()
})
