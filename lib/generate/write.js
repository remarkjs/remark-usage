import url from 'url'
import {promises as fs} from 'fs'
import path from 'path'

export async function write(ctx) {
  const examplePath = url.fileURLToPath(ctx.exampleFileUrl)
  const filePath = path.join(
    path.dirname(examplePath),
    ctx.id + path.extname(examplePath)
  )

  await fs.writeFile(filePath, ctx.exampleInstrumented)

  ctx.exampleInstrumentedPath = filePath
}
