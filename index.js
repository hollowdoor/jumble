#!/usr/bin/env node
var path = require('path'),
    bundle = require('./lib/bundle'),
    unpack = require('./lib/unpack'),
    watch = require('./lib/watch'),
    startServer = require('./lib/startserver'),
    
    argv = require('yargs')
        .alias('w', 'watch')
        
        .alias('e', 'es6')
        .alias('r', 'raw')
        .alias('n', 'name')
        .alias('l', 'location')
        .option('m', {
            alias: 'minify',
            type: 'boolean',
            default: true
         })
        .option('s', {
            alias: 'server',
            type: 'string'
         })
        .argv;

/*
git remote add origin https://github.com/hollowdoor/jumble.git
---
iteration
git push -u origin master
npm publish
*/

/*TODO
COMPLETE inline, and minify css in html
polyfiller integration
syntax checking
COMPLETE test file and icon moving
*/

module.exports.readJSON = require('./lib/read_json');
module.exports.bundle = bundle;
module.exports.unpack = unpack;
module.exports.make = make;
module.exports.watch = watch;


if(require.main === module){
    
    var b = run(),
        opts = b.options;
    
    if(argv.watch)
        watch(opts, run);
    
    if(argv.server){
        startServer({
            destination:opts.destination,
            arg: argv.server
        });
    }
}

function run(){
    
    var options = {};
    
    if(argv._.length){
        if(argv._[0].length > 2){
            options.destination = argv._[0];
        }
    }

    for(var n in argv){
        if(argv[n])
            options[n] = argv[n];
    }
    
    return make(options);
    
}

function make(opts){
    
    var options = require('./lib/read_json')();
    
    for(var n in opts)
        options[n] = opts[n];
    
    var b = bundle(options.main, options);
    
    b.on('error', function(e){
        console.log(e);
    });
    
    b.on('complete', function(packname){
        console.log('jumble is done writing everything!');
    });
    
    return b;
}
