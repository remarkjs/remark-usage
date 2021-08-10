// > This section is rendered by this module from [`example.js`](example.js).
// > Turtles all the way down.  🐢🐢🐢

// remark-usage-ignore-next 4 - Get the files to show them in our usage example.
import fs from 'fs'
import path from 'path'
const exampleJs = fs.readFileSync(path.join('example', 'example.js'), 'utf8')
const exampleMd = fs.readFileSync(path.join('example', 'readme.md'), 'utf8')

// Say we are making a module that exports just enough Pi (3.14159).
// We’re documenting it with a readme file, [`example/readme.md`](./example/readme.md):
console.log('markdown', exampleMd)

// …and an example script to document it [`example/example.js`](./example/example.js):
console.log('js', exampleJs)

// …If we use `remark-usage`, we can generate the `Usage` section
import {readSync} from 'to-vfile'
import {remark} from 'remark'
import remarkUsage from './index.js'

const file = readSync({path: 'readme.md', cwd: 'example'})

const result = await remark().use(remarkUsage).process(file)

// Now, printing `result` (the newly generated readme) yields:
console.log('markdown', String(result))
