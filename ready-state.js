var chalk  = require('chalk')
var cowsay = require('cowsay')
var silly  = require('sillystring')

var ReadyStateManager = function(options) {
    this.ready = false
    this.state = options.state
    this.cluster = options.cluster
    this.scheduler = options.scheduler
    this.connection = options.connection
}
ReadyStateManager.prototype = {
    updateState : function(state) { 
        this.state = state; return this 
    },
    displayReadyMessage : function() {
        if (!this.ready && this.connection.isReady()) { 
            console.log(chalk.cyan(cowsay.say({ text:"I'm READY for "+silly(), w:true, W:35 })))
            this.ready = true 
        }
        return this
    },
    queryCluster : function(callback) { 
        if (this.state.hosts.length == 0 || this.state.containers.length == 0) return this
        this.cluster(this.state.hosts).query(function(err, current_containers) {
            if (err) { console.error(err); return }
            if (typeof callback === 'function') callback(current_containers)
        }.bind(this))
        return this
    },
    applyMaybe : function(state) {
        this.updateState(state)
            .displayReadyMessage()
            .queryCluster(function(current_containers) {
                this.scheduler.apply(this.state, current_containers)
            }.bind(this))
        return this
    }
}

module.exports = function(options) { return new ReadyStateManager(options) }
