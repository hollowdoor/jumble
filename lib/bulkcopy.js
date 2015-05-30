var cwd = process.cwd(),
    ncp = require('ncp'),
    fs = require('fs'),
    path = require('path');

module.exports = function(info, cb){
    
    var running = info.files.length,
        errors = [];
    
    for(var i=0; i<info.files.length; i++){
                
        writeFile(info.destination, info.cwd, info.files[i], function(err){
            if(err)
                errors.push(err);
            
            if(!--running)
                cb(errors.length ? errors : null);
        });
    }
    
    for(var i=0; i<info.directories.length; i++){
        ncp(path.join(info.cwd, info.directories[i]),
            path.join(info.destination, info.directories[i]), function(err){
                console.log('ncp done');
                if(err)
                    errors.push(err);
                if(!--running)
                    cb(errors.length ? errors : null);
            });
    }
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
