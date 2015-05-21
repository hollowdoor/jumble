var cwd = process.cwd(),
    tmp = require('tmp'),
    fs = require('graceful-fs'),
    path = require('path'),
    browserify = require('browserify'),
    cheerio = require('cheerio');

module.exports = Bundle;

function Bundle(main, options, cb){
    
    if(!fs.existsSync(path.join(cwd, main)))
        return cb(new Error('jumble error: '+main+'not found in '+cwd), null);
    
    if(typeof options === 'function'){
        cb = options;
        options = {};
    }
    
    options.minify = (typeof options.minify !== 'undefined') ? options.minify : true;
    options.es6 = (typeof options.es6 !== 'undefined') ? options.es6 : false;
    options.raw = (typeof options.raw !== 'undefined') ? options.raw : false;
    
    var name = (typeof options.name !== 'undefined') ? options.name : 'mybundle';
    
    if(typeof options.location === 'undefined')
        options.location = cwd;
    else if(fs.existsSync(path.join(cwd, options.location)))
        options.location = path.join(cwd, options.location);
    else if(fs.existsSync(options.location))
        options.location = options.location;
    else
        return cb(new Error('jumble options.location is not available'), null);
    
    var htmlname = path.join(cwd, main),
        
        info = {
            name: name,
            cwd: cwd,
            main: main,
            html: '',
            scripts: [],
            files: [],
            directories: []
        };
    
    if(typeof options.manifest !== 'undefined')
        info.manifest = options.manifest;
    
    if(Object.prototype.toString.call(options.files) === '[object Array]')
        info.files = options.files;
    
    if(Object.prototype.toString.call(options.directories) === '[object Array]')
        info.directories = options.directories;
    
    if(Object.prototype.toString.call(options.inline) !== '[object Array]')
        options.inline = [];
    
    readHTML(htmlname, options, function(err, str){
        
        if(err)
            cb(new Error('jumble can\'t read ' + htmlname + ': ' + err.message), null);
        
        info.html = str;
        
        $ = cheerio.load(str);
        
        var $scripts = $('script'),
            $styles = $('link'),
            styles = [],
            scripts = [];
        
        $scripts.each(function(i, el){
            
            var $current = $(this),
                src = $current.attr('src'),
                type = $current.attr('type');
            
            if(src){
                scripts.push(src);
            }
        });
        
        
        bundleJS(scripts, options, function(err, scripts){
            if(err)
                cb(err, null);
            
            info.scripts = scripts;
            
            var pack = JSON.stringify(info, null, 4),
                packpath = path.join(options.location, name + '_bundle.json');
            
            
            fs.writeFile(packpath, pack, function(err){
                if(err)
                    cb(new Error('jumble bundle write error: ' + err.message));
                
                cb(null, packpath);
            })
            
        });
    });
    
    return options;
    
}

function bundleJS(names, options, cb){
    
    var info = [],
        running = names.length,
        check = require('syntax-error');
    
    var read = function(name){
        
        var source = path.join(cwd, name),
            b = browserify(source);
        
        fs.readFile(source, 'utf8', function(err, str){
            
            var error = check(source, str);
            
            if(error){
                console.log('Error found -');
                console.log(error);
                console.log(Array(20).join('-'));
            }
        });
        
        if(Object.prototype.toString.call(options.external) === '[object Array]')
            if(options.external.indexOf(name) !== -1)
                b.external(options.external);
        
        if(Object.prototype.toString.call(options.expose) === '[object Object]'){
            
            for(var n in options.expose){
                if(options.expose[n] === name){
                    b.require(path.join(cwd, name), {expose: n});
                }
            }
        }
        
        if(options.es6)
            b.transform(require('babelify'));
       
        var bundle = b.bundle();
        
        tmp.file(function(err, tmp_path, fd, cleanupCallback){
            
            if(err)
                return cb(new Error('jumble tmp file error: '+ err.message));
            
            var wstream = fs.createWriteStream(tmp_path);
            
            bundle.pipe(wstream);
            
            wstream.on('error', function(err){
                cb(new Error('jumble bundle error: ' + err.message), null);
            });
            
            
            wstream.on('finish', function(){
                
                savePackage(source, tmp_path, options, function(err, code, raw){
                    
                    info.push({
                        name: name,
                        source: source,
                        script: code,
                        raw: raw || undefined
                    });
                    
                    if(!--running)
                        cb(null, info);
                });
                
                
            });
        });
    };
    
    for(var i=0; i<names.length; i++){
        read(names[i]);
    }
}

function savePackage(source, tmp_path, options, cb){
    
    if(options.raw){
        fs.readFile(source, 'utf8', function(err, raw){
            saveJSON(tmp_path, options, function(err, code){
                cb(err, code, raw);
            });
        });
    }else{
        saveJSON(tmp_path, options, function(err, code){
            
            cb(err, code, null);
        });
    }
}

function saveJSON(file_path, options, cb){
    
    if(options.minify){
                        
        var UglifyJS = require('uglify-js'),
            minified = UglifyJS.minify(file_path);
        
        cb(null, minified.code);
        
    }else{
        
        fs.readFile(file_path, 'utf8', function(err, str){
            
            cb(null, str);
        });
    }
}









function readHTML(name, options, cb){
    
    fs.readFile(name, 'utf8', function(err, str){
        if(err)
            return cb([err], null);
        
        if(options.inline.length && options.inline.indexOf('css') !== -1){
            
            inlineCSS(str, function(errors, str){
                cb(errors, str);
            });
        }else{
            cb(null, str);
        }
    });
}

function inlineCSS(html, cb){
    $ = cheerio.load(html);
        
    var $styles = $('link'),
        styles = [],
        running = 0,
        errors = [];
        
    
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
            /*
            fs.readFile(path.join(cwd, href), 'utf8', function(err, str){
                if(err)
                    errors.push(err);
                
                if(str){
                    new CleanCSS().minify(source, function (errors, minified) {
                      // minified.styles 
                      
                      str = '<style type="text/css">' + str + '</style>';
                        $current.replaceWith(str);
                      if(!--running)
                        cb(error.length ? errors : null, $.html());
                    });
                    
                }else{
                
                    if(!--running)
                        cb(errors.length ? errors : null, $.html());
                }
            });*/
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
