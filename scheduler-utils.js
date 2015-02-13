var cccf    = require('cccf')
var clone   = require('clone')
var chalk   = require('chalk')
var request = require('request')
var md5     = require('MD5')
var cdi     = require('cccf-docker-instructions')

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

    leastBusyHost : function(runningContainers, hosts) {
        var weights = runningContainers.reduce(function(map, container) {
            if (!map[container.host]) map[container.host] = 1
            else map[container.host] += 1
            return map
        },{})
        return hosts.reduce(function(curr, next) {
            var curr_weight = weights[curr.name] || 0
            var next_weight = weights[next.name] || 0
            return (next_weight > curr_weight) ? curr : next
        }, hosts[0])
    },

    pickInstructionColor : function(instruction) {
        var color = chalk.magenta
        if (instruction.indexOf(' run ') > 0) color = chalk.green
        if (instruction.indexOf(' kill ') > 0) color = chalk.yellow
        if (instruction.indexOf(' stop ') > 0) color = chalk.yellow
        if (instruction.indexOf(' rm ') > 0) color = chalk.red
        return color
    },

    supportedDockerVersions : {
        'stable' : './docker-1.3.0',
        '1.4'    : './docker-1.4.1',
        '1.3'    : './docker-1.3.3',
        '1.2'    : './docker-1.2.0',
    },
    pickDockerVersion : function(version) {
        return utils.supportedDockerVersions[(version === 'stable' ? version : version.slice(0,3))]
    },

    hostVersionMap : {},
    getHostVersion : function(host, callback) {
        var hash = md5(JSON.stringify(host))
        if (utils.hostVersionMap[hash]) { callback(utils.hostVersionMap[hash]); return }
        request.get('http://'+host.host+':'+host.port+'/version', function(err, response, body) {
            if (err) { console.error(err); callback(null); return }
            var version = JSON.parse(body).Version
            utils.hostVersionMap[hash] = version
            callback(version)
        })
    },
    queryHostVersion : function(host, callback) {
        utils.getHostVersion(host, function(version) {
            if (!version) { 
                console.error('Unknown docker version for host'+host.name+'. Falling back to latest stable.')
                version = 'stable'
            }
            if (!utils.pickDockerVersion(version)) { 
                console.error('Unsupported version '+version+' for host'+host.name+'. Falling back to latest stable.')
                version = 'stable'
            }
            callback(version, utils.pickDockerVersion(version))
        })
    }

}

module.exports = utils 
