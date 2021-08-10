import url from 'url'
import {promises as fs} from 'fs'
import {resolve} from 'import-meta-resolve'
import {relativeModule} from '../util/relative-module.js'

export async function findExample(ctx) {
  const fn = ctx.options.example ? findExplicitExample : findImplicitExample
  const fileUrl = await fn(ctx)

  if (!fileUrl) {
    throw new Error('Could not find example')
  }

  const example = String(await fs.readFile(new URL(fileUrl)))

  ctx.exampleFileUrl = fileUrl
  // Make sure there is a final line feed.
  ctx.example =
    example.charAt(example.length - 1) === '\n' ? example : example + '\n'
}

function findExplicitExample(ctx) {
  return resolve(
    relativeModule(ctx.options.example),
    url.pathToFileURL(ctx.cwd).href + '/'
  )
}

async function findImplicitExample(ctx) {
  const from = url.pathToFileURL(ctx.cwd).href + '/'
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
