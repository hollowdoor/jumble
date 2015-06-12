var cwd = process.cwd(),
    path = require('path'),
    events = require('events'),
    util = require('util'),
    //dependencies
    check = require('syntax-error'),
    browserify = require('browserify'),
    fs = require('graceful-fs'),
    checkSyntax = require('syntax-error');

/**
 * Massify will bundle an number of scripts using browserify.
 */

module.exports = function(names, options){
    return new Massify(names, options);
};

function Massify(names, options){

    events.EventEmitter.call(this);

    options.minify = getBoolean(options.minify, true);
    options.es6 = getBoolean(options.es6,  false);

    var self = this,
        scripts = [],
        _names = [].concat(names),
        _sources = [],
        running = 0,
        index,
        ignore = getArray(options.ignore),
        external = getArray(options.external);

    if(isType(options.files, '[object Array]'))
        ignore = ignore.concat(options.files);

    for(var i=0; i<_names.length; i++)
        if((index = ignore.indexOf(_names[i])) !== -1)
            _names.splice(index, 1);

    for(var i=0; i<external.length; i++){
        if(_names.indexOf(external[i]) === -1)
            _names.push(external[i]);
    }

    running = _names.length;

    function compile(name){

        var bundle = genBundle(name),
            source = path.join(cwd, name);

        self.emit('bundle', name, bundle);

        if(!--running)
            self.emit('complete', names);
    }
    /*TODO
    Add a debug option for generating source maps.
    b = browserify(source, {debug: true});
    */

    function genBundle(name){

        var source = path.join(cwd, name),
            b = browserify(source);

        /** HACK

        For some reason b.external is removing the leading period in the name.
        This makes it so a leading dot on a path name can not be used in
        expose on the options for b.require
        The period is removed on the name for b.require options.expose
        */

        if(external.length){
            for(var i=0; i<external.length; i++){

                if(name !== external[i])
                    b.external(external[i]);

            }

            if(external.indexOf(name) !== -1)
                b.require(source, {expose: name.replace(/\./, '')});
        }

        if(options.es6)
            b.transform(require('babelify').configure({
                global: true,
                optional: ['runtime']
            }));

        if(options.minify)
            b.transform({global: true}, require('uglifyify'));

        return b.bundle();
    }

    function read(name){

        var source = path.join(cwd, name);

        fs.readFile(source, 'utf8', function(err, str){

            if(err){
                self.emit('error', new Error('jumble script read error: '+err.message));
                if(!--running)
                    self.emit('complete', _names);
                return;
            }

            var error = checkSyntax(source, str);

            if(error){
                self.emit('syntaxError', new Error('jumble script syntax error: '+error.message));
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

function getArray(arr){
    return Object.prototype.toString.call(arr) === '[object Array]' ? [].concat(arr) : [];
}

function getBoolean(b, def){
    return Object.prototype.toString.call(b) === '[object Boolean]' ? b : def;
}

util.inherits(Massify, events.EventEmitter);
