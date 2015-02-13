var _     = require('lodash')
var clone = require('clone')
var scale = require('cccf-scale')
var utils = require('./scheduler-utils')

var Mapper = function(state, current_containers) {
    this.state   = state
    this.current_containers = current_containers
}
Mapper.prototype = {
    unifyContainers : function(containers) { 
        containers = containers.filter(utils.removeIgnored.bind({ignore:this.state['containers_ignore']}))
                               .filter(utils.validateContainer)
        containers = scale.up(containers)
        containers = containers.map(function(container) {
            var c = _.omit(container, ['host','scale'])
            if (c.image.indexOf(':') < 0) c.image = c.image+':latest'
            return c
        })
        return containers
    },
    applyHosts : function(diff) {
        var keepWithHosts = diff.keep.map(function(container) { 
            container.host = utils.pickCurrentContainer(container.id, this.current_containers).host
            return container
        }.bind(this))

        var postRunWithHosts = clone(keepWithHosts)
        var addWithHosts = diff.add.map(function(container) {
            container.host = utils.leastBusyHost(postRunWithHosts, this.state.hosts).name
            postRunWithHost = postRunWithHosts.concat(container)
            return container
        }.bind(this))

        var removeWithHosts = diff.remove.map(function(container) { 
            container.host = utils.pickCurrentContainer(container.id, this.current_containers).host
            return container
        }.bind(this))

        return {
            add    : addWithHosts,
            keep   : keepWithHosts, 
            remove : removeWithHosts
        }
    }
}

module.exports = function(state, current_containers) { 
    return new Mapper(state, current_containers) 
}
