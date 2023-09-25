/**
 * @typedef {import('vfile').VFileCompatible} VFileCompatible
 * @typedef {import('../index.js').Options} Options
 */

import fs from 'node:fs'
import path from 'node:path'
import test from 'tape'
import {remark} from 'remark'
import {isHidden} from 'is-hidden'
import remarkUsage from '../index.js'

const root = path.join('test', 'fixtures')
const fixtures = fs.readdirSync(root)

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

test('Fixtures', async (t) => {
  let index = -1

  while (++index < fixtures.length) {
    const fixture = fixtures[index]

    if (isHidden(fixture)) continue

    const base = path.join(root, fixture)
    const input = fs.readFileSync(path.join(base, 'readme.md'))
    let expected = ''
    /** @type {Options & {withoutFilePath?: boolean}} */
    let config = {}

    try {
      expected = String(fs.readFileSync(path.join(base, 'output.md')))
    } catch {}

    try {
      config = JSON.parse(
        String(fs.readFileSync(path.join(base, 'config.json')))
      )
    } catch {}

    /** @type {VFileCompatible} */
    const file = {value: input, cwd: base}

    if (!config.withoutFilePath) {
      file.path = 'readme.md'
    }

    const fail = fixture.indexOf('fail-') === 0 ? fixture.slice(5) : ''

    try {
      const actual = await remark().use(remarkUsage, config).process(file)

      if (fail) {
        t.fail(fixture + ': should fail instead of work')
      } else {
        t.equal(String(actual), expected, fixture + ': should work')
      }
    } catch (error) {
      const exception = /** @type {Error} */ (error)

      if (fail) {
        const errorMessage = new RegExp(fail.replace(/-/g, ' '), 'i')

        if (errorMessage.test(String(exception))) {
          t.pass(fixture + ': should fail')
        } else {
          t.error(exception, fixture + ': should fail')
        }
      } else {
        t.error(exception, fixture + ': should work instead of fail')
      }
    }
  }

  t.end()
})
