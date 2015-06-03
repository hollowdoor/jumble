var cwd = process.cwd(),
    tmp = require('tmp'),
    fs = require('graceful-fs'),
    path = require('path'),
    cheerio = require('cheerio');
    events = require('events'),
    util = require('util'),
    mkdirp = require('mkdirp'),
    Massify = require('./massify');

module.exports = function(main, options){
    return new Bundle(main, options);
};

function Bundle(main, options){
    
    events.EventEmitter.call(this);
    
    this.bla = true;
    
    var self = this,
        destination = (typeof options.destination !== 'undefined') ? options.destination : 'dist';
    
    this.destination = destination;
    
    if(!fs.existsSync(path.join(cwd, main))){
        setImmediate(function(){
            self.emit('error', new Error('jumble error: '+main+'not found in '+cwd));
        });
        return;
    }
    
    if(typeof options === 'function'){
        cb = options;
        options = {};
    }
    /*TODO
        move option default control to the functions that use them.
    */
    
    
    options.minify = (typeof options.minify !== 'undefined') ? options.minify : true;
    options.es6 = (typeof options.es6 !== 'undefined') ? options.es6 : false;
    options.raw = (typeof options.raw !== 'undefined') ? options.raw : false;
    
    var name = (typeof options.name !== 'undefined') ? options.name : 'mybundle';
    /*
    if(typeof options.location === 'undefined')
        options.location = cwd;
    else if(fs.existsSync(path.join(cwd, options.location)))
        options.location = path.join(cwd, options.location);
    else if(fs.existsSync(options.location))
        options.location = options.location;
    else
        return setImmediate(function(){self.emit('error', new Error('jumble options.location is not available'));});
    */
    var htmlname = path.join(cwd, main);
    this.options = options;
    
    mkdirp(destination, function(err){
        
        if(err)
            return self.emit('error', err);
        
        readHTML(htmlname, options, function(err, str){
            
            if(err)
                return self.emit('error', new Error('jumble can\'t read ' + htmlname + ': ' + err.message));
            
            
            fs.writeFile(path.join(destination, main), str, function(err){
                if(err)
                    self.emit('error', err);
            });
            
            
            $ = cheerio.load(str);
            
            var $scripts = $('script'),
                scripts = [];
            
            $scripts.each(function(i, el){
                
                var $current = $(this),
                    src = $current.attr('src'),
                    type = $current.attr('type');
                
                if(src){
                    scripts.push(src);
                }
            });
            
            
            
            if(!scripts.length){
                self.emit('complete', scripts);
                return;
            }
                
            
            var massify = Massify(scripts, options);
            
            
            massify.on('bundle', function(name, bundle){
                var dirname = path.dirname(path.join(destination, name));
                if(fs.existsSync(dirname)){
                    self.emit('bundle', name, bundle);
                    
                    bundle.on('error', function(err){
                        self.emit('error', 'jumble bundle error '+err.message);
                    });
                    
                        
                    var wstream = fs.createWriteStream(path.join(destination, name));
                    bundle.pipe(wstream);
                    wstream.on('error', function(err){
                        self.emit('error', new Error('jumble bundle stream error: '+err.message));
                    });
                }else{
                    mkdirp(dirname, function(err){
                        self.emit('bundle', name, bundle);
                        
                        bundle.on('error', function(err){
                            self.emit('error', 'jumble bundle error '+err.message);
                        });
                        
                            
                        var wstream = fs.createWriteStream(path.join(destination, name));
                        bundle.pipe(wstream);
                        wstream.on('error', function(err){
                            self.emit('error', new Error('jumble bundle stream error: '+err.message));
                        });
                    });
                }
            });
            
            massify.on('error', function(err){
                self.emit('error', 'jumble massify error: '+err.message);
            });
            
            massify.on('syntaxError', function(err){
                self.emit('error', err);
            });
            
            massify.on('complete', function(names){
                
                //require('./bulkcopy')(options, function(err){
                    self.emit('complete', scripts);
                //});
            });
        });
        
        
    });
    
    
}

util.inherits(Bundle, events.EventEmitter);

Bundle.prototype.stop = function(){
    this.doCompile = false;
};


function readHTML(name, options, cb){
    require('./bulkcopy')(options, function(err){
        fs.readFile(name, 'utf8', function(err, str){
            if(err)
                return cb(err, null);
            
            if(options.inline.length && options.inline.indexOf('css') !== -1){
                
                inlineCSS(str, function(errors, str){
                    cb(errors, str);
                });
            }else{
                cb(null, str);
            }
        });
    });
}

function inlineCSS(html, cb){
    $ = cheerio.load(html);
        
    var $styles = $('link'),
        styles = [],
        running = 0,
        errors = [];
    
    if(!$styles.length)
        return cb(null, html);
    
    $styles.each(function(i, el){
        
        var $current = $(this),
            href = $current.attr('href'),
            type = $current.attr('type'),
            rel = $current.attr('rel'),
            ex = href.split('.');
        
        if(ex[ex.length-1] === 'css'){
            
            running++;
            
            (function($current){
                
                readCSS(path.join(cwd, href), function(errs, str){
                    if(errs)
                        errors.concat(errors);
                    
                    if(str){
                        str = '<style type="text/css">' + str + '</style>';
                        $current.replaceWith(str);
                    }
                    
                    if(!--running)
                        cb(errors.length ? errors : null, $.html());
                        
                });
            
            })($current);
        }
    });
}

function readCSS(name, cb){
    
    var CleanCSS = require('clean-css'),
        errors = [];
    
    fs.readFile(name, 'utf8', function(err, source){
        if(err)
            errors.push(err);
        
        if(source){
            new CleanCSS().minify(source, function (errs, minified) {
                if(errs)
                    errors.concat(errs);
                
                cb(errors.length ? errors : null, minified ? minified.styles : null);
            });
            
        }else{
            setImediate(function(){
                cb(errors.length ? errors : null, null);
            });
        }
    });
}
