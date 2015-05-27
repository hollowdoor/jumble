var http = require('http'),
    fs = require('fs'),
    path = require('path'),
    mime = require('mime'),
    url = require('url');

/*
Module depends
mime
*/


module.exports = function(options, cb){
    
    if(typeof options === 'undefined'){
        options = {};
    }else if(typeof options === 'function'){
        cb = options;
        options = {};
    }
    
    var index = options.index ? options.index : 'index.html',
        baseDirectory = options.cwd ? options.cwd : process.cwd();
    
    cb = cb || null;
    
    var server = http.createServer(function (req, res) {
        
        var requestUrl = url.parse(req.url),
        fsPath = path.join(baseDirectory, requestUrl.pathname);
        
        if(requestUrl.pathname === '/'){
            fsPath = path.join(baseDirectory, index);
        }
        
        fs.exists(fsPath, function(exists) {
            
            
            if(!exists){
                if(cb){
                    cb(req, res);
                }else{
                    res.writeHead(500);
                    res.end('500 Internal server error.');
                }
                
                return;
            }
            
            try{
                mimetype = mime.lookup(fsPath);
                
                if(mimetype){
                    res.setHeader("Content-Type", mimetype);
                }
                res.writeHead(200);
                fs.createReadStream(fsPath).pipe(res);
            }catch(e){
                console.log('Error sending static file.');
                res.end();
            }
        })
    });
    
    return server;
}


