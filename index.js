#!/usr/bin/env node
var argv = require('minimist')(process.argv.slice(2), {
    default : {
        'dispatcher-host' : process.env['DISPATCHER_HOST'],
        'dispatcher-port' : process.env['DISPATCHER_PORT'],
        'retry-timeout'   : 500,
        'retry-interval'  : 5000,
        'apply-interval'  : 5000
    }
})

// State

var state = {
    hosts            : [],
    containers       : [],
    hosts_ready      : false,
    containers_ready : false
}

// Mutators

var dispatcher = require('./dispatcher-connection')(argv)
var cluster    = require('./cluster')

// Init

setInterval(function() {
    if (!state.hosts_ready || !state.containers_ready) return
    console.log('applying state')
    cluster(state.hosts).query(function(err, containers) {
        containers.forEach(function(c) { console.log(c.id) })
    })
//    scheduler.apply(state, current)
}, argv['apply-interval'])

dispatcher.on('up', function() {
    console.log('dispatcher up')
    dispatcher.client.subscribe('/hosts', function(hosts) {
        state.hosts       = hosts
        state.hosts_ready = true
    })
    dispatcher.client.subscribe('/containers', function(containers) {
        state.containers       = containers
        state.containers_ready = true
    })
})
dispatcher.listen()
