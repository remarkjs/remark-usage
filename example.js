// This section is rendered by this module from [example.js][example-js].

// Dependencies:
var fs = require('fs');
var remark = require('remark');
var usage = require('./index.js'); // This is changed from `./index.js` to `remark-usage`

// Read and parse `readme.md`:
var readme = fs.readFileSync('readme.md', 'utf-8');
var ast = remark().use(usage).parse(readme);

// Log something with a language flag:
console.log('markdown', remark().stringify(ast.children[1]));

// Or without language:
console.log(remark().stringify(ast.children[2]));

// Log something which is never captured:
function neverCalled() {
    console.log('javascript', 'alert("test")');
}

// Log something which isn’t captured because it’s not a string.
console.log(this);
