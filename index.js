#!/usr/bin/env node
var argv = require('minimist')(process.argv.slice(2), {
    default : {
        'dispatcher-host' : process.env['DISPATCHER_HOST'],
        'dispatcher-port' : process.env['DISPATCHER_PORT'],
        'statestore-host' : process.env['STATESTORE_HOST'],
        'statestore-port' : process.env['STATESTORE_PORT'],
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
var statestore = require('./statestore-api')(argv)
var cluster    = require('./cluster')

// Interval

setInterval(function() {
    if (!state.hosts_ready || !state.containers_ready) return
    console.log('Applying state\n-----------')
    cluster(state.hosts).query(function(err, containers) {
        console.log(containers)
//        containers.forEach(function(c) { console.log(c.id) })
        console.log('-----------')
    })
//    scheduler.apply(state, current)
}, argv['apply-interval'])

// Functions

var updateHosts = function(hosts) {
    state.hosts       = hosts
    state.hosts_ready = true
}
var updateContainers = function(containers) {
    state.containers       = containers
    state.containers_ready = true
}

dispatcher.on('up', function() {
    console.log('dispatcher up')
    statestore.getState('/hosts', function(err, hosts) {
        if (err) { console.log(err); return }
        updateHosts(hosts)
    })
    dispatcher.subscribe('/hosts', updateHosts)
    statestore.getState('/containers', function(err, containers) {
        if (err) { console.log(err); return }
        updateContainers(containers)
    })
    dispatcher.subscribe('/containers', updateContainers)
})
dispatcher.listen()
