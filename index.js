#!/usr/bin/env node
var argv = require('minimist')(process.argv.slice(2), {
    default : {
        'dispatcher-host'   : process.env['DISPATCHER_HOST'],
        'dispatcher-port'   : process.env['DISPATCHER_PORT'],
        'statestore-host'   : process.env['STATESTORE_HOST'],
        'statestore-port'   : process.env['STATESTORE_PORT'],
        'retry-timeout'     : 500,
        'retry-interval'    : 5000,
        'apply-interval'    : 15000,
        'containers-ignore' : ['statestore', 'dispatcher', 'rainbow-dock', 'rainbow-dock-populator','scheduler']
    }
})

// State

var state = {
    hosts             : [],
    containers        : [],
    containers_ignore : argv['containers-ignore'] || []
}

// IO 

var ddsc = require('dux-dispatcher-statestore-connection')({
    dispatcher : {
        host : argv['dispatcher-host'],
        port : argv['dispatcher-port']
    },
    statestore : {
        host : argv['statestore-host'],
        port : argv['statestore-port']
    },
    timeout  : argv['retry-timeout'],
    interval : argv['retry-interval']
})
var cluster    = require('./cluster')
var scheduler  = require('./scheduler')

// ApplyLoop 

var apply = function() {
    if (state.hosts.length == 0 || state.containers.length == 0) return
    cluster(state.hosts).query(function(err, current_containers) {
        if (err) { console.log(err); return }
        scheduler.apply(state, current_containers)
    })
}

setInterval(function() {
    apply()
}, argv['apply-interval'])

// Listen for State 

ddsc.on('/state/containers', function(err, containers) {
    if (err) { console.error(err); return }
    state.containers = containers
    apply()
})
ddsc.on('/state/hosts', function(err, hosts) {
    if (err) { console.error(err); return }
    state.hosts = hosts
    apply()
})
ddsc.start()
