var fs = require('fs'),
    path = require('path'),
    cwd = process.cwd(),
    glob = require('glob'),
    cheerio = require('cheerio');

module.exports = readJSON;

function readJSON(){


    var info = findJSON(),
        data = {},
        json = null,
        package_file = null;

    if(info.json !== null){
        json = JSON.parse(info.json);
        data = JSON.parse(info.json);
        package_file = info.json_file;
    }

    if(typeof data.main !== 'string'){
        if(data.start)
            data.main = data.start;
        if(data.launch_path)
            data.main = data.launch_path;
        else if(data.start_url)
            data.main = data.start_url;
        else
            data.main = 'index.html';
    }

    if(typeof data.cwd === 'undefined')
        data.cwd = process.cwd();

    if(typeof data.destination === 'undefined')
        data.destination = path.join(process.cwd(), 'dist');

    if(Object.prototype.toString.call(data.directories) !== '[object Array]')
        data.directories = [];

    if(Object.prototype.toString.call(data.files) !== '[object Array]')
        data.files = [];

    if(package_file !== null)
        data.files.push(package_file);


    if(Object.prototype.toString.call(data.inline) !== '[object Array]')
        data.inline = ['css'];

    var icosaves = getIcons(data.icons || null);

    data.files = data.files.concat(icosaves.files);
    data.directories = data.directories.concat(icosaves.directories);
    
    return data;
}

function findJSON(optional_name){

    /*
    TODO
    Add subfield "jumble" as an optional manifest so name conflicts can be resolved
    for common other manifests.
    */

    var list = ['jumble.json', 'package.json', 'manifest.webapp', 'manifest.json'],
        current,
        info = {json: null, json_file: null};

    for(var i=0; i<list.length; i++){

        current = path.join(cwd, list[i]);

        if(fs.existsSync(current)){

            info.json = fs.readFileSync(current, {encoding:'utf8'});
            info.json_file = list[i];
            break;
        }
    }


    if(info.json !== null)
        return info;

    if(fs.existsSync(path.join(cwd, 'index.html'))){

        info = captureInHTML(path.join(cwd, 'index.html'));
    }

    if(info.json !== null)
        return info;


    list = glob.sync(path.join(cwd, '*.html'));

    for(var i=0; i<list.length; i++){
        if(info.json !== null)
            break;

        info = captureInHTML(list[i]);
    }


    return info;
}

function captureInHTML(name){
    var info = {json: null, json_file: null};

    if(!fs.existsSync(path.join(cwd, name)))
        return info;

    var htmlString = fs.readFileSync(path.join(cwd, name), {encoding: 'utf8'}),
        $ = cheerio.load(htmlString),
        $links = $('link');


    if(!$links.length)
        return info;

    $links.each(function(i, el){
        var current = $(this),
            rel = current.attr('rel'),
            href = current.attr('href');

        if(rel === 'manifest' && json === null){
            info.json = fs.readFileSync(path.join(cwd, href), {encoding: 'utf8'});
            info.json_file = href;
        }

    });

    return info;
}

function getIcons(icons){
    var list = [],
        icosaves = {files: [], directories:[]};

    if(!icons)
        return icosaves;

    //firefox
    if(Object.prototype.toString.call(icons) === '[object Object]'){

        for(var n in icons)
            list.push(icons[n]);

    //standards
    }else if(Object.prototype.toString.call(icons) === '[object Array]'){

        for(var i=0; i<icons.length; i++){
            if(icons[i].src)
                list.push(icons[i].src);
        }
    }

    var current;


    for(var i=0; i<list.length; i++){
        current = path.dirname(list[i]);

        if(current !== '.' && current !== '/'){
            if(icosaves.directories.indexOf(current) === -1)
                icosaves.directories.push(current);
        }else{
            icosaves.files.push(list[i]);
        }
    }

    return icosaves;
}
