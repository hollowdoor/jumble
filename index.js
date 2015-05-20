#!/usr/bin/env node
var path = require('path'),
    bundle = require('./lib/bundle'),
    unpack = require('./lib/unpack'),
    watch = require('./lib/watch'),
    argv = require('yargs')
        .alias('w', 'watch')
        .alias('m', 'minify')
        .alias('e', 'es6')
        .alias('r', 'raw')
        .alias('n', 'name')
        .alias('l', 'location').argv;

//git remote add origin https://github.com/hollowdoor/jumble.git
//---
//iteration
//git push -u origin master
//npm publish

module.exports.readJSON = require('./lib/read_json');
module.exports.bundle = bundle;
module.exports.unpack = unpack;
module.exports.make = make;
module.exports.watch = watch;


if(require.main === module){
    
    var opts = run();
    
    if(argv.watch)
        watch(opts, run);
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
    
    return bundle(options.main, options, function(err, filename){
        
        unpack(filename, options.destination, function(){});
    });
}