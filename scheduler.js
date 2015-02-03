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

    pickCurrentContainer : function(id, current_containers) {
        return current_containers.filter(function(c) {
            return c.id == id
        })[0]
    },

    leastBusyHost : function(containersWithHost, hosts) {
        var weights = containersWithHost.reduce(function(map, container) {
            if (!map[container.id]) map[container.id] = 1
            else map[container.id] += 1
            return map
        },{})
        return hosts.reduce(function(curr, next) {
            var curr_weight = weights[curr.id] || 0
            var next_weight = weights[next.id] || 0
            return (next_weight > curr_weight) ? next : curr
        }, hosts[0])
    },

    addHostToInstruction : function(instruction, host) {
        var il = instruction.split('docker')
        il.splice(1,0,'docker -H='+host)
        return il.join(' ').trim()
    },

    runInstructions : function(container) {
        var c = clone(container)
        delete c.scale
        delete c.host
        return cdi.run(c)[0]
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
        var ignored = scheduler.removeIgnored.bind({ignore:state['containers_ignore']})
        var valid   = scheduler.validateContainer

        current_containers   = scale.up(current_containers.filter(ignored).filter(valid))
        var state_containers = scale.up(state.containers.filter(ignored).filter(valid))
        var diff             = cdiff(current_containers, state_containers)
        var postRunWithHost  = clone(diff.keep).map(function(container) { 
            container.host = scheduler.pickCurrentContainer(container.id, current_containers).host
            return container
        })
        var addWithHost      = clone(diff.add).map(function(container) {
            var host = scheduler.leastBusyHost(postRunWithHost, state.hosts)
            console.log('least busy', host)
            container.host = host
            postRunWithHost = postRunWithHost.concat(clone(container))
            return container
        })

        console.log(diff)

        // Add

        addWithHost.forEach(function(container) {
            var run = scheduler.addHostToInstruction(scheduler.runInstructions(container), container.host.docker)
            scheduler.exec(run) 
        }) 

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
