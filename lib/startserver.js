var staticServer = require('./staticserver'),
    net = require('net');

module.exports = function(options){
    var arg, port = null, cwd = options.destination;
    
    if(typeof options.arg === 'string'){
        arg = options.arg.split(':');
        if(arg.length === 1){
            port = parseInt(arg[0]);
        }else if(arg.length === 2){
            cwd = arg[0];
            port = parseInt(arg[1]);
        }
    }
    
    var server = staticServer({
        cwd: cwd
    });
    
    if(port){
        server.listen(port);
        console.log('Start static server at port ' + port + ' in ' + cwd);
    }else{
    
        findPort(function(port){
            console.log('Start static server at port ' + port + ' in ' + cwd);
            server.listen(port);
        });
    }
};

function findPort(portrange, cb){
    if(typeof portrange === 'function'){
        cb = portrange;
        portrange = 45032;
    }
    
    getPort(cb);
    
    //https://gist.github.com/mikeal/1840641
    function getPort (cb) {
      var port = portrange
      portrange += 1
     
      var server = net.createServer()
      server.listen(port, function (err) {
        server.once('close', function () {
          cb(port)
        })
        server.close()
      })
      server.on('error', function (err) {
        getPort(cb)
      })
    }
}
 


