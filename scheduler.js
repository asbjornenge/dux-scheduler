var cccf = require('cccf')
var diff = require('cccf-diff')

var scheduler = {

    removeIgnored : function(container) {
        return this.ignore.indexOf(container.id) < 0
    },

    apply : function(state, current_containers) {
        console.log('apply')
        current_containers   = current_containers.filter(scheduler.removeIgnored.bind({ignore:state['containers_ignore']}))
        var state_containers = state.containers.filter(scheduler.removeIgnored.bind({ignore:state['containers_ignore']}))
        console.log(diff(current_containers, state_containers))
    }

}

module.exports = scheduler
