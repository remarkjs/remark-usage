import {promises as fs} from 'fs'
import path from 'path'

export async function write(ctx) {
  const filePath = path.join(
    path.dirname(ctx.examplePath),
    ctx.id + path.extname(ctx.examplePath)
  )

  await fs.writeFile(filePath, ctx.exampleInstrumented)

  ctx.exampleInstrumentedPath = filePath
}
