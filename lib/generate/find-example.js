import {promises as fs} from 'fs'
import resolveFrom from 'resolve-from'
import {relativeModule} from '../util/relative-module.js'

export async function findExample(ctx) {
  const fn = ctx.options.example ? findExplicitExample : findImplicitExample
  const filePath = await fn(ctx)

  if (!filePath) {
    throw new Error('Could not find example')
  }

  const example = String(await fs.readFile(filePath))

  ctx.examplePath = filePath
  // Make sure there is a final line feed.
  ctx.example =
    example.charAt(example.length - 1) === '\n' ? example : example + '\n'
}

function findExplicitExample(ctx) {
  const moduleId = relativeModule(ctx.options.example)

  try {
    return resolveFrom(ctx.cwd, moduleId)
    // Catch just to be sure.
    /* c8 ignore next */
  } catch {}
}

async function findImplicitExample(ctx) {
  const examples = [
    './example',
    './examples',
    './doc/example',
    './docs/example'
  ]
  let index = -1

  while (++index < examples.length) {
    const filePath = resolveFrom.silent(ctx.cwd, examples[index])

    if (filePath) {
      return filePath
    }
  }
}
