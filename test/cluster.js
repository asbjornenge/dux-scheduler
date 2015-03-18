var assert  = require('assert')
var cluster = require('../cluster')([{ host : "127.0.0.1", port : 4243 }])

it('can query containers on host', function(done) {
    cluster.query(function(err, containers) {
        assert(err == null)
        assert(containers instanceof Array)
//        containers.forEach(function(c) {
//            if (c.id == 'yolo') console.log(c)
//            console.log(c)
//        })
        done()
    })
})
