// Require `pi`:
var pi = require('./index.js')

// remark-usage-not-an-ignore 1
var one = 1

// remark-usage-ignore-next
var two = sum(1, 1)

// remark-usage-ignore-next 3
function sum(a, b) {
  return a + b
}

// Logs:
console.log('text', pi)
