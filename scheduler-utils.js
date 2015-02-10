var cccf  = require('cccf')
var clone = require('clone')
var chalk = require('chalk')
var cdi   = require('cccf-docker-instructions')

var utils = {

    removeIgnored : function(container) {
        return this.ignore.indexOf(container.id) < 0
    },

    // TODO: Write to stderr in case of error ?
    validateContainer : function(container) {
        try      { cccf.validate(container); return true }
        catch(e) { process.stderr.write(e); return false }
    },

    pickHostByName : function(name, hosts) {
        return hosts.filter(function(host) {
            return host.name == name
        })[0]
    },

    stringifyHost : function(host) {
        var protocol = host.protocol || 'tcp'
        return protocol+'://'+host.host+':'+host.port
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

    pickInstructionColor : function(instruction) {
        var color = chalk.magenta
        if (instruction.indexOf(' run ') > 0) color = chalk.green
        if (instruction.indexOf(' kill ') > 0) color = chalk.yellow
        if (instruction.indexOf(' stop ') > 0) color = chalk.yellow
        if (instruction.indexOf(' rm ') > 0) color = chalk.red
        return color
    }

}

module.exports = utils 
