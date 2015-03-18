var inspector = require('docker-inspector')

var Cluster = function(hosts) {
    this.hosts = hosts
}
Cluster.prototype = {
    query : function(callback) {
        inspector({hosts:this.hosts}).inspect(function(err, containers) {
            if (err) callback(err)
            var _containers = containers.map(function(container) {
                return {
                    id      : container.Name.slice(1),
                    image   : container.Config.Image,
                    cmd     : container.Config.Cmd.join(' '),
                    ports   : Object.keys(container.HostConfig.PortBindings || {}).map(function(c_port) {
                        var p_data = container.HostConfig.PortBindings[c_port]
                        var h_port = p_data ? p_data[0].HostPort : c_port.split('/')[0]
                        return h_port+':'+c_port
                    }),
                    env     : container.Config.Env,
                    volumes : Object.keys(container.Volumes || {}).map(function(to) {
                        return container.Volumes[to]+':'+to
                    })
                }
            })
            callback(err, _containers)
        })
    }
}

module.exports = function(hosts) { return new Cluster(hosts) }
