var request = require('request')

var StatestoreAPI = function(options) {
    this.host     = options['statestore-host']
    this.port     = options['statestore-port']
}
StatestoreAPI.prototype = {

    getState : function(state, callback) {
        request(this.getURI()+state, function(error, response, body) {
            if (error) { callback(error); return  }
            if (response.statusCode != 200) { callback(response); return  }
            callback(null, JSON.parse(body))
        })
    },

    getURI : function() {
        return 'http://'+this.host+':'+this.port
    },

}

module.exports = function(options) { return new StatestoreAPI(options)  }
