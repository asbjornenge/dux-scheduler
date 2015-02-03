var cccf  = require('cccf')
var clone = require('clone')
var cdi   = require('cccf-docker-instructions')

var utils = {

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

}

module.exports = utils 
