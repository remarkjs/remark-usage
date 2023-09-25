/**
 * @typedef {import('vfile').VFileCompatible} VFileCompatible
 * @typedef {import('../index.js').Options} Options
 */

import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import test from 'node:test'
import {fileURLToPath} from 'node:url'
import {remark} from 'remark'
import remarkUsage from '../index.js'

test('fixtures', async function (t) {
  // Prepapre.
  const root = new URL('fixtures/', import.meta.url)
  const packageUrl = new URL('../package.json', import.meta.url)
  const packageBackUrl = new URL('../package.json.bak', import.meta.url)
  const brokenPackageUrl = new URL(
    'fail-could-not-parse-package/package.json',
    root
  )
  const brokenExampleUrl = new URL(
    'fail-could-not-parse-example/example.js',
    root
  )

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

      /** @type {Options & {withoutFilePath?: boolean} | undefined} */
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
          // @ts-expect-error: to do.
          .use(remarkUsage, config)
          .process({
            value: await fs.readFile(inputUrl),
            cwd: fileURLToPath(folderUrl),
            path: config && config.withoutFilePath ? undefined : 'readme.md'
          })

        assert.equal(String(file), output)
      } catch (error) {
        if (folder.indexOf('fail-') !== 0) {
          throw error
        }

        const message = folder.slice(5).replace(/-/g, ' ')
        // .replace(/`/g, '')
        assert.match(String(error), new RegExp(message, 'i'))
      }
    })
  }

  // Clean.
  await fs.unlink(brokenExampleUrl)
  await fs.unlink(brokenPackageUrl)
  await fs.rename(packageBackUrl, packageUrl)
})
