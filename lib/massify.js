var cwd = process.cwd(),
    path = require('path'),
    events = require('events'),
    util = require('util'),
    //dependencies
    check = require('syntax-error'),
    browserify = require('browserify'),
    fs = require('graceful-fs'),
    checkSyntax = require('syntax-error');


module.exports = function(names, options){
    return new Massify(names, options);
};

function Massify(names, options){
    
    events.EventEmitter.call(this);
    
    options.minify = isType(options.minify, '[object Boolean]') ? options.minify : true;
    options.es6 = typeof options.es6 !== 'undefined' ? options.es6 : false;
    
    var self = this,
        scripts = [],
        _names = [].concat(names),
        running = 0,
        ignore = isType(options.ignore, '[object Array]') ? [].concat(options.ignore) : [],
        index,
        external = [];
    
    if(isType(options.files, '[object Array]'))
        ignore = ignore.concat(options.files);
    
    for(var i=0; i<_names.length; i++)
        if((index = ignore.indexOf(_names[i])) !== -1)
            _names.splice(index, 1);
    
    running = _names.length;
    
    function compile(name){
        
        var bundle = genBundle(name),
            source = path.join(cwd, name);
        
        self.emit('bundle', name, bundle);
        
        if(!--running)
            self.emit('complete', names);
    }    
    
    function genBundle(name){
        
        var source = path.join(cwd, name),
            b = browserify(source),
            canRequire = false;
        
        if(external.length){
            for(var i=0; i<external.length; i++){
                b.external(external[i]);
            }
        }
        //Use file name to determine if a file is also a module.
        //If so use it externally on all other compiled scripts.
        if(require.resolve(source)){
            try{
                require(source);
                canRequire = true;
            }catch(e){
                canRequire = false;
            }
            
            if(canRequire){
                b.require(name);
                external.push(name);
            }
        }
        
        
        /*if(Object.prototype.toString.call(options.external) === '[object Array]')
            if(options.external.indexOf(name) !== -1)
                b.external(options.external);
        
        if(Object.prototype.toString.call(options.expose) === '[object Object]'){
            
            for(var n in options.expose){
                if(options.expose[n] === name){
                    b.require(path.join(cwd, name), {expose: n});
                }
            }
        }*/
        
        if(options.es6)
            b.transform(require('babelify').configure({global: true}));
        
        if(options.minify)
            b.transform({global: true}, require('uglifyify'));
               
        return b.bundle();
    }
    
    function read(name){
        
        var source = path.join(cwd, name);
        
        fs.readFile(source, 'utf8', function(err, str){
            
            if(err){
                self.emit('error', err);
                if(!--running)
                    self.emit('complete', _names);
                return;
            }
            
            var error = checkSyntax(source, str);
            
            if(error){
                self.emit('syntaxError', error);
                if(!--running)
                    self.emit('complete', _names);
                return;
            }
            
            compile(name);
        });
    }
    
    for(var i=0; i<_names.length; i++){
        read(_names[i]);
    }
}

function isType(obj, str){
    return Object.prototype.toString.call(obj) === str;
}

util.inherits(Massify, events.EventEmitter);
