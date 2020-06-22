// > This section is rendered by this module from [`example.js`][example-js].
// > Turtles all the way down.  🐢🐢🐢

// remark-usage-ignore-next 4 - Get the files to show them in our usage example.
var readFile = require('fs').readFileSync
var join = require('path').join
var exampleJs = readFile(join('example', 'example.js'), 'utf8')
var exampleMd = readFile(join('example', 'readme.md'), 'utf8')

// remark-usage-ignore-next - Use async/await so it looks nicer.
;(async function () {
// Say we are making a module that exports just enough Pi (3.14159).
// We’re documenting it with a readme file, [`example/readme.md`][example-md]:
console.log('markdown', exampleMd)

// …and an example script to document it [`example/example.js`][example-js-2]:
console.log('js', exampleJs)

// …If we use `remark-usage`, we can generate the `Usage` section
var path = require('path')
var vfile = require('to-vfile')
var remark = require('remark')
var usage = require('.')

var file = vfile.readSync({path: 'readme.md', cwd: 'example'})

var file = await remark().use(usage).process(file)

// Now, printing `file` (the newly generated readme) yields:
console.log('markdown', String(file))

// remark-usage-ignore-next
})()
