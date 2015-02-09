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
    containers_ignore : argv['containers-ignore'] || [],
    hosts_ready       : false,
    containers_ready  : false
}

// Integrators 

var dispatcher = require('dux-dispatcher-connection')(argv)
var statestore = require('dux-statestore-api-client')(argv)
var cluster    = require('./cluster')
var scheduler  = require('./scheduler')

// Application

setInterval(function() {
    apply()
}, argv['apply-interval'])

var apply = function() {
    if (!state.hosts_ready || !state.containers_ready) return
    cluster(state.hosts).query(function(err, current_containers) {
        if (err) { console.log(err); return }
        scheduler.apply(state, current_containers)
    })
}

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
        apply()
    })
    dispatcher.subscribe('/state/hosts', updateHosts)
    statestore.getState('/containers', function(err, containers) {
        if (err) { console.log(err); return }
        updateContainers(containers)
        apply()
    })
    dispatcher.subscribe('/state/containers', updateContainers)
})
dispatcher.listen()
