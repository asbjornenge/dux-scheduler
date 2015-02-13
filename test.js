var React = require('react')
var DockerCluster = React.createFactory(require('./docker-cluster'))

var containers = [
    {
        id    : 'api',
        image : 'smartm/api',
        cmd   : 'taghub'
    },
    {
        id    : 'api-scale-1',
        image : 'smartm/api'
    },
    
]

var out = React.renderToString(DockerCluster({ hosts : [], containers : containers }))

console.log(out)
