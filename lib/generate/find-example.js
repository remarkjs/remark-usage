/**
 * @typedef {import('mdast').Root} Root
 * @typedef {import('vfile').VFile} VFile
 * @typedef {import('type-fest').PackageJson} PackageJson
 * @typedef {import('../index.js').Options} Options
 */

import {URL, pathToFileURL} from 'url'
import {promises as fs} from 'fs'
import {resolve} from 'import-meta-resolve'
import {relativeModule} from '../util/relative-module.js'

/** @param {{tree: Root, file: VFile, options: Options, pkg: PackageJson, pkgRoot: string, main: string|undefined, name: string|undefined, id: string, exampleFileUrl?: string, example?: string}} ctx */
export async function findExample(ctx) {
  const fileUrl = await (ctx.options.example
    ? findExplicitExample(ctx.file.cwd, ctx.options.example)
    : findImplicitExample(ctx.file.cwd))

  if (!fileUrl) {
    throw new Error('Could not find example')
  }

  const example = String(await fs.readFile(new URL(fileUrl)))

  ctx.exampleFileUrl = fileUrl
  // Make sure there is a final line feed.
  ctx.example =
    example.charAt(example.length - 1) === '\n' ? example : example + '\n'
}

/**
 * @param {string} cwd
 * @param {string} example
 */
function findExplicitExample(cwd, example) {
  return resolve(relativeModule(example), pathToFileURL(cwd).href + '/')
}

/**
 * @param {string} cwd
 */
async function findImplicitExample(cwd) {
  const from = pathToFileURL(cwd).href + '/'
  const promises = [
    './example.js',
    './example/index.js',
    './examples.js',
    './examples/index.js',
    './doc/example.js',
    './doc/example/index.js',
    './docs/example.js',
    './docs/example/index.js'
  ].map((d) => resolve(d, from))

  const examples = await Promise.allSettled(promises)
  let index = -1

  while (++index < examples.length) {
    const example = examples[index]

    if (example.status === 'fulfilled') {
      return example.value
    }
  }
}
