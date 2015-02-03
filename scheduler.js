var cccf  = require('cccf')
var cdiff = require('cccf-diff')
var scale = require('cccf-scale')
var chost = require('cccf-host-basic')
var cdi   = require('cccf-docker-instructions')
var clone = require('clone')
var chpr  = require('child_process')
var utils = require('./scheduler-utils')

var scheduler = {

    exec : function(instruction, callback) {
        console.log('exec', instruction)
        var child = chpr.exec(instruction)
        child.stdout.on('data', function(data) { console.log(data) })
        child.stderr.on('data', function(data) { console.log(data) })
        child.on('close', function() { 
            console.log('finished', instruction); 
            if (typeof callback === 'function') callback() 
        })
    },

    apply : function(state, current_containers) {
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
            console.log('least busy', host)
            container.host = host
            postRunWithHost = postRunWithHost.concat(clone(container))
            return container
        })

        console.log(diff)

        // Add

        addWithHost.forEach(function(container) {
            var run = utils.addHostToInstruction(utils.runInstructions(container), container.host.docker)
            scheduler.exec(run) 
        }) 

        // Remove

        diff.remove.forEach(function(container) {
            var kill = utils.addHostToInstruction(cdi.kill(container)[0], utils.pickHost(container.host, state))
            var rm   = utils.addHostToInstruction(cdi.rm(container)[0],   utils.pickHost(container.host, state))
            scheduler.exec(kill, function() {
                scheduler.exec(rm) 
            }) 
        })
    }

}

module.exports = scheduler
