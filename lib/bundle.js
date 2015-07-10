var cwd = process.cwd(),
    tmp = require('tmp'),
    fs = require('graceful-fs'),
    path = require('path'),
    //cheerio = require('cheerio');
    events = require('events'),
    util = require('util'),
    mkdirp = require('mkdirp'),
    Massify = require('./massify'),
    GetAssets = require('get-html-assets');

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

    if(type(options.ignore) !== '[object Array]')
        options.ignore = [];

    //if(type(options.exclude) !== '[object Array]')
        //options.exclude = [];

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

        var scripts = [],
            a = new GetAssets(htmlname, {stream: ['styles', 'images']});

        a.on('html', function(str){
            fs.writeFile(path.resolve(destination, main), str, function(err){
                if(err)
                    self.emit('error', new Error(err.message));
            });
        });

        a.on('stylestream', function(stream, info){

            var dest = path.resolve(destination, info.name);
            WriteStream(dest, stream, function(err){
                self.emit('error', err);
            });
            /*var dest = path.resolve(destination, info.name),
                rstream = fs.createWriteStream(dest);
            stream.pipe(stream);*/
        });

        a.on('imagestream', function(stream, info){
            var dest = path.resolve(destination, info.name);
            WriteStream(dest, stream, function(err){
                self.emit('error', err);
            });
            /*var dest = path.resolve(destination, info.name),
                rstream = fs.createWriteStream(dest);
            stream.pipe(stream);*/
        });


        a.on('script', function(info){
            if(options.files.length && options.files.indexOf(info.name) === -1)
                scripts.push(info.name);
        });

        a.on('done', function(){
            if(!scripts.length){
                self.emit('complete', scripts);
                return;
            }

            var massify = Massify(scripts, options);

            massify.on('bundle', function(name, bundle){
                var dest = path.resolve(destination, name),
                    dirname = path.dirname(dest);

                bundle.on('error', function(err){
                    self.emit('error',
                        new Error('jumble bundle error: '+err.message));
                });

                WriteStream(dest, bundle, function(err){
                    if(err)
                        self.emit('error', new Error('jumble bundle stream error: '+err.message));
                });
            });

            massify.on('error', function(err){
                self.emit('error', new Error('jumble massify error: '+err.message));
            });

            massify.on('syntaxError', function(err){
                self.emit('error', new SyntaxError('jumble syntax error: '+err));
            });

            massify.on('complete', function(names){
                options.ignore = names.concat(options.ignore || []);
                require('./bulkcopy')(options, function(err){
                    if(err)
                        self.emit('error', new Error('jumble write error: '+err.message));

                });
                /* TODO
                Can't emit complete inside bulkcopy callback
                The ncp callback used inside bulkcopy is not reliable
                Find an alternative.
                */
                self.emit('complete', scripts);
            });

        });



        /*ReadHTML(htmlname, options, function(err, str){

            if(err)
                return self.emit('error', new Error('jumble can\'t read ' + htmlname + ': ' + err.message));

            var GetAssets = require('get-html-assets');

            var a = GetAssets();
        });*/

        /*
        readHTML(htmlname, options, function(err, str){

            if(err)
                return self.emit('error', new Error('jumble can\'t read ' + htmlname + ': ' + err.message));



            $ = cheerio.load(str);

            var $scripts = $('script'),
                scripts = [],
                $head, ex = false, html_changed = false;

            $scripts.each(function(i, el){

                var $current = $(this),
                    src = $current.attr('src'),
                    type = $current.attr('type');

                if(src){
                    scripts.push(src);
                }
            });


            if(scripts.length
                && Object.prototype.toString.call(options.external) === '[object Array]'
                && options.external.length){

                $head = $('head');
                for(var i=0; i<options.external.length; i++){
                    ex = options.external[i];
                    if(!/\.js$/.test(ex))
                        ex = ex + '.js';
                    if(scripts.indexOf(ex) === -1){
                        $head.append('<script src="'+ex+'"></script>');
                        html_changed = true;
                    }
                }

                if(html_changed)
                    str = $.html();
            }

            fs.writeFile(path.join(destination, main), str, function(err){
                if(err)
                    self.emit('error', err);
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
        });*/


    });


}

util.inherits(Bundle, events.EventEmitter);

Bundle.prototype.stop = function(){
    this.doCompile = false;
};

function WriteStream(name, stream, cb){
    var mkdirp = require('mkdirp'),
        dirname = path.dirname(name), wstream;

    if(fs.existsSync(dirname)){
        wstream = fs.createWriteStream(name);
        stream.pipe(wstream);
        wstream.on('error', cb);
    }else{
        mkdirp(dirname, function(err){
            wstream = fs.createWriteStream(name);
            stream.pipe(wstream);
            wstream.on('error', cb);
        });
    }
}

function type(o){
    return Object.prototype.toString.call(o);
}
/*
function ReadHTML(name, options, cb){
    require('./bulkcopy')(options, function(err){
        fs.readFile(name, 'utf8', function(err, str){
            if(err)
                return cb(err, null);

            cb(null, str);
        });
    });
}


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
}*/
