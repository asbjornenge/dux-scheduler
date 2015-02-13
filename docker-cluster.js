var React = require('react')
var ReactElement = require('react/lib/ReactElement')

//var Container = ReactElement.createElement('div',{ key : '123' })
var Container = React.DOM.div

var Cluster = React.createClass({
    render : function() {
        var containers = this.props.containers.map(function(container) {
            container.key = container.id
            return Container(container)
        })
        return React.DOM.div({}, containers)
    }
})

module.exports = Cluster
