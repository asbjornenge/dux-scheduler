var faye = require('faye')

// TODO: modularize that dispatcher-connection that statestore has

console.log('gettings started')

var fclient = new faye.Client('http://dux-dispatcher.dux.test:8000/')

fclient.subscribe('/hosts', function(hosts) {
    console.log('GOT SOME HOSTS', hosts)
})

fclient.subscribe('/containers', function(containers) {
    console.log('GOT SOME CONTAINERS', containers)
})
