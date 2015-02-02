#!/usr/bin/env node
var argv = require('minimist')(process.argv.slice(2), {
    default : {
        'dispatcher-host' : process.env['DISPATCHER_HOST'],
        'dispatcher-port' : process.env['DISPATCHER_PORT'],
        'retry-timeout'   : 500,
        'retry-interval'  : 5000
    }
})

var dispatcher = require('./dispatcher-connection')(argv)
dispatcher.on('up', function() {
    console.log('ready')
})
dispatcher.on('down', function() {
    console.log('broken')
})
dispatcher.listen()
