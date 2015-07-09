var cwd = process.cwd(),
    ncp = require('ncp'),
    fs = require('fs'),
    path = require('path');

module.exports = function(info, cb){

    if(!info || !info.files && !info.directories)
        setImmediate(function(){ cb(null); })
    if(!info || !info.files.length && !info.directories.length)
        setImmediate(function(){ cb(null); });

    var running = info.files.length,
        errors = [],
        opts = {};
    /*info.ignore = [];
    console.log(info.ignore);
    opts.filter = function(name){
        return info.ignore.indexOf(name) === -1;
    };*/
    info.files = info.files || [];
    info.directories = info.directories || [];
    console.log(1);
    for(var i=0; i<info.files.length; i++){

        //if(info.ignore.indexOf(info.files[i]) === -1){

            writeFile(info.destination, info.cwd, info.files[i], function(err){
                if(err)
                    errors.push(new Error('jumble bulk copy error: '+err.message));

                if(!--running)
                    cb(errors.length ? errors : null);
            });
        //}
    }

    for(var i=0; i<info.directories.length; i++){
        ncp(path.join(info.cwd, info.directories[i]),
            path.join(info.destination, info.directories[i]), opts, function(err){

                if(err)
                    errors.push(new Error('jumble bulk copy error: '+err.message));
                if(!--running)
                    cb(errors.length ? errors : null);
            });
    }
    console.log(2)
};

function writeFile(folder, cwd, name, cb){

    var source = path.join(cwd, name),
        dest = path.join(folder, name),
        fwrite, fread;

    if(fs.existsSync(source)){
        fwrite = fs.createWriteStream(dest);
        fread = fs.createReadStream(source);
        fread.pipe(fwrite);

        fwrite.on('error', function(err){
            fwrite.end();
            cb(err);
        });

        fwrite.on('finish', function(){
            cb(null);
        });
    }

    return fwrite;
}
