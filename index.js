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
        'ignore'            : ['statestore', 'dispatcher', 'scheduler']
    }
})

// State

var state = {
    hosts             : [],
    containers        : [],
    containers_ignore : argv['ignore'] || []
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

// ReadyStateManagement

var rsm = require('./ready-state')({
    state      : state,
    connection : ddsc,
    cluster    : require('./cluster'),
    scheduler  : require('./scheduler') 
})

// ApplyLoop

setInterval(function() {
    rsm.applyMaybe(state)
}, argv['apply-interval'])

// Listen 

ddsc.on('/state/containers', function(err, containers) {
    if (err) { handleStateQueryError(err); return }
    state.containers = containers
    rsm.applyMaybe(state)
})
ddsc.on('/state/hosts', function(err, hosts) {
    if (err) { handleStateQueryError(err); return }
    state.hosts = hosts
    rsm.applyMaybe(state)
})
ddsc.start()

// Support Functions

var chalk = require('chalk')
var handleStateQueryError = function(err) {
    if (err.statusCode) { console.error(chalk.yellow('Bad http status code '+err.statusCode+' for '+err.request.href)); return }
    console.error(err)
}
