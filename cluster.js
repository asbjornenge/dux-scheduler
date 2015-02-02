var dockersps = require('dockers-ps')

var Cluster = function(hosts) {
    this.cluster = dockersps(function(done) {
        return done(null, hosts)
    })
}
Cluster.prototype = {
    query : function(callback) {
        this.cluster.ps(function(err, containers) {
            if (err) callback(err)
            var filtered = containers.filter(function(container) {
                return container['Status'].indexOf('Up') == 0              
            }).map(function(container) {
                var names = container['Names'][1].split('@')
                return {
                    id    : names[0].slice(1),
                    image : container['Image'],
                    host  : names[1]
                }
            })
            callback(err, filtered)
        })
    }
}

module.exports = function(hosts) { return new Cluster(hosts) }