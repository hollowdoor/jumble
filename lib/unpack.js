var cwd = process.cwd(),
    fs = require('fs'),
    path = require('path'),
    mkdirp = require('mkdirp'),
    ncp = require('ncp');

module.exports = unPack;

function unPack(bundle_name, folder, cb){
    
    
    if(!fs.existsSync(folder)){
        
        if(fs.existsSync(path.join(cwd, folder))){
            folder = path.join(cwd, folder);
            unPackAll();
        }else{
            mkdirp(folder, function(err){
                if(err)
                    return cb(err);
                unPackAll();
            });
        }
    }else{
        unPackAll();
    }
    
    function unPackAll(){
        
        fs.readFile(bundle_name, 'utf8', function(err, str){
            
            var info = JSON.parse(str),
                fwrite,
                fread;
            
            fs.writeFile(path.join(folder, info.main), info.html, function(err){
                if(err)
                    cb(err);
            });
            
            writeScripts(folder, info.scripts, function(err){
            
            });
            
            for(var i=0; i<info.files.length; i++){
                
                writeFile(folder, info.cwd, info.files[i]);
            }
            
            for(var i=0; i<info.directories; i++){
                ncp(path.join(info.cwd, info.directories),
                    path.join(folder, info.directories[i]), console.log);
            }
        });
    }
}

function writeFile(folder, cwd, name){
    
    var source = path.join(cwd, name),
        dest = path.join(folder, name),
        fwrite, fread;
    
    if(fs.existsSync(source)){
        fwrite = fs.createWriteStream(dest);
        fread = fs.createReadStream(source);
        fread.pipe(fwrite);
    }
}

function writeScripts(folder, list, cb){
    var running = list.length;
    
    var write = function(name, data){
        
        fs.writeFile(name, data, function(err){
            
            if(err)
                cb(err);
            
            if(!--running)
                cb(err);
        });
    };
    
    for(var i=0; i<list.length; i++){
        write(path.join(folder, list[i].name), list[i].script);
    }
}
