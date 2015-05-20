var fs = require('fs'),
    path = require('path');

module.exports = startWatching;

function startWatching(root, options, onChange){
    var cwd = process.cwd();
    
    if(Object.prototype.toString.call(root) === '[object Object]' &&
        typeof options === 'function'){
        
        onChange = options;
        options = root;
        root = '.';
    }
    
    var chokidar = require('chokidar'),
        //https://github.com/es128/anymatch
        ignore = [/[\/\\]\./, /bundle\.json/];
    
    if(options.name){
        if(typeof options.location === 'undefined')
            options.location = cwd;
        else if(fs.existsSync(path.join(cwd, options.location)))
            options.location = path.join(cwd, options.location);
        else if(fs.existsSync(options.location))
            options.location = options.location;
        
        ignore.push(new RegExp(options.name + '_bundle\.json'));
    }
    
    
    if(options.destination)
        ignore.push(options.destination);
    
    if(options.ignore)
        ignore.concat(options.ignore);
        
    var watcher = chokidar.watch(root /* or use '.'*/, {
        ignored: ignore,
        cwd: process.cwd()
    });
    
    watcher.on('change', function(path, stats){
        if(!stats.isDirectory()){
            console.log(path + ' has changed. Starting a bundle for '+options.name+'.');
            onChange();
        }
    });
}
