var assert    = require('assert')
var scheduler = require('../scheduler')

console.log(scheduler.diff)

// This thing to do is to make sure there are nothing missing
// in the current running config.
// Altså ikke gjør en ordinær diff, bare sjekk at alt som er definer i config er med!
