// > This section is rendered by this module from [`example.js`](example.js).
// > Turtles all the way down.  🐢🐢🐢

// remark-usage-ignore-next 3 - Get the files to show them in our usage example.
import fs from 'node:fs/promises'
const exampleJs = String(await fs.readFile(new URL('example/example.js', import.meta.url)))
const exampleMd = String(await fs.readFile(new URL('example/readme.md', import.meta.url)))

// Say we are making a module that exports just enough Pi (3.14159).
// We’re documenting it with a readme file, [`example/readme.md`](./example/readme.md):
console.log('markdown', exampleMd)

// …and an example script to document it [`example/example.js`](./example/example.js):
console.log('js', exampleJs)

// …if we use `remark-usage`, we can generate the `Usage` section
import {remark} from 'remark'
import remarkUsage from './index.js'
import {read} from 'to-vfile'

const file = await read({path: 'readme.md', cwd: 'example'})

await remark().use(remarkUsage).process(file)

// …then printing `file` (the newly generated readme) yields:
console.log('markdown', String(file))
