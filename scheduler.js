var cccf  = require('cccf')
var cdiff = require('cccf-diff')
var scale = require('cccf-scale')
var chost = require('cccf-host-basic')
var cdi   = require('cccf-docker-instructions')
var clone = require('clone')
var chpr  = require('child_process')

var scheduler = {

    removeIgnored : function(container) {
        return this.ignore.indexOf(container.id) < 0
    },

    // TODO: Write to stderr in case of error ?
    validateContainer : function(container) {
        try      { cccf.validate(container); return true }
        catch(e) { console.log(e); return false }
    },

    pickHost : function(hostname, state) {
        return state.hosts.filter(function(host) {
            return host.hostname == hostname
        })[0].docker
    },

    applyHost : function(instruction, hosts) {

    },

    addHostToInstruction : function(instruction, host) {
        var il = instruction.split('docker')
        il.splice(1,0,'docker -H='+host)
        return il.join(' ').trim()
    },

    runInstructions : function(container) {
        var c = clone(container)
        var host = c.host
        delete c.scale
        delete c.host
        return scheduler.addHostToInstruction(cdi.run(c)[0], host) 
    },

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
        console.log('apply')
        var ignored = scheduler.removeIgnored.bind({ignore:state['containers_ignore']})
        var valid   = scheduler.validateContainer

        current_containers   = scale.up(current_containers.filter(ignored).filter(valid))
        var state_containers = scale.up(state.containers.filter(ignored).filter(valid))
        var diff             = cdiff(current_containers, state_containers)
        diff.add             = chost(diff.add, state.hosts.map(function(host) { return 'tcp://'+host.docker }))

        console.log(diff)

        // Add

        var instructions = diff.add.map(scheduler.runInstructions) 
        instructions.forEach(scheduler.exec)

        // Remove

        diff.remove.forEach(function(container) {
            var kill = scheduler.addHostToInstruction(cdi.kill(container)[0], scheduler.pickHost(container.host, state))
            var rm   = scheduler.addHostToInstruction(cdi.rm(container)[0],   scheduler.pickHost(container.host, state))
            scheduler.exec(kill, function() {
                scheduler.exec(rm) 
            }) 
        })
    }

}

module.exports = scheduler
