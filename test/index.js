/**
 * @typedef {import('remark-usage').Options} Options
 */

/**
 * @typedef {ExtraOptionsFields & Options} Config
 *
 * @typedef ExtraOptionsFields
 *   Extra fields.
 * @property {boolean | null | undefined} [withoutFilePath]
 *   Do not add a path to the file (default: `false`).
 */

import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import test from 'node:test'
import {fileURLToPath} from 'node:url'
import {remark} from 'remark'
import remarkUsage from 'remark-usage'

test('remark-usage', async function (t) {
  await t.test('should expose the public api', async function () {
    assert.deepEqual(Object.keys(await import('remark-usage')).sort(), [
      'default'
    ])
  })
})

test('fixtures', async function (t) {
  // Prepapre.
  const root = new URL('fixtures/', import.meta.url)
  const packageUrl = new URL('../package.json', import.meta.url)
  const packageBackUrl = new URL('../package.json.bak', import.meta.url)
  const brokenPackageUrl = new URL(
    'fail-cannot-parse-package/package.json',
    root
  )
  const brokenExampleUrl = new URL('fail-cannot-parse-example/example.js', root)

  await fs.writeFile(brokenExampleUrl, '"\n')
  await fs.writeFile(brokenPackageUrl, '{\n')
  await fs.rename(packageUrl, packageBackUrl)

  // Test.
  const fixtures = await fs.readdir(root)
  let index = -1

  while (++index < fixtures.length) {
    const folder = fixtures[index]

    if (folder.startsWith('.')) continue

    await t.test(folder, async function () {
      const folderUrl = new URL(folder + '/', root)
      const inputUrl = new URL('readme.md', folderUrl)
      const outputUrl = new URL('output.md', folderUrl)
      const configUrl = new URL('config.json', folderUrl)

      /** @type {Config | undefined} */
      let config
      /** @type {string} */
      let output

      try {
        config = JSON.parse(String(await fs.readFile(configUrl)))
      } catch {}

      try {
        output = String(await fs.readFile(outputUrl))
      } catch {
        output = ''
      }

      try {
        const file = await remark()
          .use(remarkUsage, config)
          .process({
            cwd: fileURLToPath(folderUrl),
            path: config && config.withoutFilePath ? undefined : 'readme.md',
            value: await fs.readFile(inputUrl)
          })

        assert.equal(String(file), output)
      } catch (error) {
        if (folder.indexOf('fail-') !== 0) {
          throw error
        }

        const message = folder.slice(5).replace(/-/g, ' ')
        assert.match(String(error).replace(/`/g, ''), new RegExp(message, 'i'))
      }
    })
  }

  // Clean.
  await fs.unlink(brokenExampleUrl)
  await fs.unlink(brokenPackageUrl)
  await fs.rename(packageBackUrl, packageUrl)
})
