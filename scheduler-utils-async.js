var _      = require('lodash')
var path   = require('path')
var chpr   = require('child_process')
var cdi    = require('cccf-docker-instructions')
var utils  = require('./scheduler-utils')

var autils = {

    exec : function(instruction, callback) {
        var color = utils.pickInstructionColor(instruction) 
        var child = chpr.exec(instruction)
        child.stdout.on('data', function(data) { process.stdout.write(color(data)) })
        child.stderr.on('data', function(data) { process.stderr.write(data) })
        child.on('close', function() { 
            if (typeof callback === 'function') callback(null, instruction) 
        })
    },

    queryHostVersion : function(container, callback) { 
        container.host = _.where(this.hosts, { name : container.host })[0] 
        utils.queryHostVersion(container.host, function(version, path) {
            container.host.version = { version:version, path:path }
            callback(null, container)
        })
    },

    execInstruction : function(container, callback) {
        var __path = path.resolve(__dirname, container.host.version.path)
        container.host  = utils.stringifyHost(container.host)
        var instruction = cdi[this.i](container, { exclude : this.exclude })[0].replace('docker', __path)
        autils.exec(instruction, callback)
    }
 
}

module.exports = autils
