var assert = require('assert')
var utils  = require('../scheduler-utils')

it('can pick the least busy host base off number of containers on that host', function() {
    var hosts = [{name:'host1'},{name:'host2'}]
    var containers = [{host:'host1'},{host:'host1'},{host:'host2'}]
    var host  = utils.leastBusyHost(containers,hosts)
    assert(host.name == 'host2')
})
