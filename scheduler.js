var cccf    = require('cccf')
var cdiff   = require('cccf-diff')
var scale   = require('cccf-scale')
var chost   = require('cccf-host-basic')
var cdi     = require('cccf-docker-instructions')
var clone   = require('clone')
var path    = require('path')
var chpr    = require('child_process')
var utils   = require('./scheduler-utils')

var scheduler = {

    working       : false,
    working_timer : null,

    exec : function(instruction, callback) {
        var color = utils.pickInstructionColor(instruction) 
        var child = chpr.exec(instruction)
        child.stdout.on('data', function(data) { process.stdout.write(color(data)) })
        child.stderr.on('data', function(data) { process.stderr.write(data) })
        child.on('close', function() { 
            if (typeof callback === 'function') callback() 
        })
    },

    apply : function(state, current_containers) {
        if (scheduler.working) return
        scheduler.working = true
        scheduler.working_timer = setTimeout(function() {
            console.error('Scheduler has been working for a very long time.')
        }, 600000)
        var ignored = utils.removeIgnored.bind({ignore:state['containers_ignore']})

        current_containers   = scale.up(current_containers.filter(ignored).filter(utils.validateContainer))
        var state_containers = scale.up(state.containers.filter(ignored).filter(utils.validateContainer))
        var diff             = cdiff(current_containers, state_containers)
        var postRunWithHost  = clone(diff.keep).map(function(container) { 
            container.host = utils.pickCurrentContainer(container.id, current_containers).host
            return container
        })
        var addWithHost      = clone(diff.add).map(function(container) {
            var host = utils.leastBusyHost(postRunWithHost, state.hosts)
            container.host = host
            postRunWithHost = postRunWithHost.concat(clone(container))
            return container
        })

        // Finish 

        var numUpdates  = addWithHost.length + diff.remove.length
        var numFinished = 0
        var finish_checker = function() {
            numFinished += 1
            if (numUpdates > numFinished) return
            scheduler.working = false
            clearTimeout(scheduler.working_timer)
        }
        if (numUpdates == 0) finish_checker()

        // Add

        addWithHost.forEach(function(container) {
            utils.queryHostVersion(container.host, function(version, _path) {
                container.host = utils.stringifyHost(container.host)
                var __path     = path.resolve(__dirname,_path)
                var run        = cdi.run(container, { exclude : ['scale'] })[0].replace('docker', __path)
                scheduler.exec(run, finish_checker) 
            }) 
        }) 

        // Remove

        diff.remove.forEach(function(container) {
            var host = utils.pickHostByName(container.host, state.hosts) 
            utils.queryHostVersion(host, function(version, _path) {
                container.host = utils.stringifyHost(host)
                var __path     = path.resolve(__dirname,_path)
                var kill       = cdi.kill(container)[0].replace('docker', __path)
                var rm         = cdi.rm(container)[0].replace('docker', __path)
                scheduler.exec(kill, function() {
                    scheduler.exec(rm, finish_checker) 
                }) 
            })
        })
    }

}

module.exports = scheduler
