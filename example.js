// This section is rendered by this module from [example.js](example.js).

// Require dependencies:
var fs = require('fs');
var mdast = require('mdast');

// Require usage:
/*
 * The below is changed because a require to the main
 * module file is detected.
 */
var usage = require('./index.js'); // This is changed from `./index.js` to `mdast-usage`

// Read and parse `readme.md`:
var readme = fs.readFileSync('readme.md', 'utf-8');
var ast = mdast.use(usage).parse(readme);

// Log something with a language flag:
console.log('markdown', mdast.stringify(ast.children[1]));

// Or without language:
console.log(mdast.stringify(ast.children[2]));

// Log something which is never captured:
function neverCalled() {
    console.log('javascript', 'alert("test")');
}

// Log something which isn’t captured because it’s not not a string.
console.log(this);
