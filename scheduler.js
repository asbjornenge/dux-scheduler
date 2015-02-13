var cccf    = require('cccf')
var cdiff   = require('cccf-diff')
var clone   = require('clone')
var async   = require('async')
var mapper  = require('./scheduler-mapper')
var utils   = require('./scheduler-utils')
var autils  = require('./scheduler-utils-async')

var scheduler = {

    working       : false,
    working_timer : null,

    apply : function(state, current_containers) {
        if (scheduler.working) return
        scheduler.working = true
        var _mapper = mapper(state, current_containers) 

        unified_current_containers   = _mapper.unifyContainers(current_containers)
        var unified_state_containers = _mapper.unifyContainers(state.containers) 
        var diff                     = _mapper.applyHosts(cdiff(unified_current_containers, unified_state_containers))

        scheduler.applyDiffAsync(state, diff)
    },

    applyDiffAsync : function(state, diff) {

        var kill = async.compose(autils.execInstruction.bind({i:'kill'}), autils.queryHostVersion.bind({hosts:state.hosts}))
        var rm   = async.compose(autils.execInstruction.bind({i:'rm'}),   autils.queryHostVersion.bind({hosts:state.hosts}))
        var run  = async.compose(autils.execInstruction.bind({i:'run', exclude : ['scale','host']}), autils.queryHostVersion.bind({hosts:state.hosts}))

        async.map(clone(diff.remove), kill, function(err, results) {
            if (err) { scheduler.handleError(err); return }
            async.map(clone(diff.remove), rm, function(err, results) {
                if (err) { scheduler.handleError(err); return }
                async.map(clone(diff.add), run, function(err, results) {
                    if (err) { scheduler.handleError(err); return }
                    scheduler.working = false
                    // console.log(results)
                })
            })
        })
    },

    handleError : function(err) {
        console.error(err)
        setTimeout(function() {
            scheduler.working = false
        },300000) // Give the cluster some time to recover and don't flood the logs
    }

}

module.exports = scheduler
