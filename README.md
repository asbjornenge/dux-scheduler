# Dux Scheduler 

>Part of the ref. implementation of the [Dux](https://github.com/asbjornenge/dux) architecture.

A Scheduler for [Dux](https://github.com/asbjornenge/dux).  

## RUN

    docker run -d asbjornenge/dux-scheduler
        --dispatcher-host dux-dispatcher.lol.wtf   // Dispatcher hostname        (required || DISPATCHER_HOST env)
        --dispatcher-port 8000                     // Dispatcher port            (required || DISPATHCER_PORT env)
        --statestore-host dux-statestore.lol.wtf   // StateStore hostname        (required || STATESTORE_HOST env)
        --statestore-port 8000                     // StateStore port            (required || STATESTORE_PORT env)
        --retry-timeout 500                        // Connection timeout         (default 500)
        --retry-interval 5000                      // Connection retry interval  (default 5000)
        --apply-interval 15000                     // How to run scheduler       (default 15000)
        --ignore testapp                           // Container (name) to ignore (default [statestore, dispatcher, scheduler])
        --color                                    // Color output 

enjoy
