var faye  = require('faye')
var retry = require('retry-connection')

// TODO: modularize that dispatcher-connection that statestore has

console.log('gettings started')

var conn = retry({ 
    host     : 'dux-dispatcher.dux.test', 
    port     : 8000,
    interval : 5000 
})
conn.on('ready', function() {
    console.log('ready')
})
conn.on('issue', function(issue) {
    console.log(issue)
})
conn.connect()
