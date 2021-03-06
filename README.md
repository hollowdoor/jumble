Jumble
======

Install
-------

`npm install jumble -g`

Run
---

In a folder that contains an html file (index.html) with an optional json manifest:

`user@computer:~$ jumble`

Why?
----

Sometimes I just want to have everything build, and be done.

There are other build systems that serve also as task systems. Jumble focuses on a small set of those tasks namely app bundling. By being a simple command that just does the one thing it makes it easy to work with.

How? A summary of what jumble does
-----------------------------

When you run jumble on the command line it looks for an html file specified in your manifest, or it looks for index.html. If jumble finds an html file it starts looking for other files associated with that file to compile.

Jumble compiles javascript with **browserify**, inlines css minified, and moves the files to a new directory.

Hopefully the html file will run in a browser/webview, just like it would without being compiled with jumble.

Have a problem?
---------------

Yell at me on github in the issues. Major changes are all over the place so beware. The interface is starting to solidify, but there are still little problems that pop up.

Command line usage
------------------

The **destination** argument is optional. A folder named **dist** will be created if you haven't named a destination.

```
Run the command
user@computer:~$ jumble destination {options}

    --watch, -w         Watch the current directory for changes.
                        When there's a change rebuild the project.

    --minify -m         Minify the output of javascript.
                        The default is true.

    --es6, -e           Compile es6 code using Babel.js.

    --name, -n          The name of your project.

    --server -s         -s, -s=8080, -s=folder:8080
                        Start a static server.
                        The value should be a port number or a directory, and port seperated by a colon.
                        If there's no value then jumble will scan for an available port.

```

Notes on the es6 option.
------------------------

There are caveats using Babel. Visit their documentation to find out what those are.

Some info about how to make es6 modules available for babelify can be found here https://github.com/babel/babelify.

All modules that aren't in node_modules directory can be compiled by babelify.

For npm modules in node_modules directory see the next section.

How to do es6 in an npm module that jumble can consume
------------------------------------------------------

### The best way to do es6 modules for npm

Install browserify: `npm install -g browserify`

Install babelify `npm install --save-dev babelify`

Install browserify-derequire `npm install --save-dev browserify-derequire`

Change **mymodule** to the name you want, and in your package.json write:

```json
{
    "name": "mymodule",
    "main": "dist/bundle.js",
    "version": <version>,
    "prepublish": "browserify -p browserify-derequire index.js -t babelify -o dist/bundle.js --standalone mymodule"
}
```

The **prepublish** field will bundle your script so it will work with node, browserify, jumble, or even in a script link.

This is accomplish with the **browserify-derequire** plugin, and the `--standalone` option that gives your module a **umd** definition. The **umd** allows your module to run almost anywhere. The **browserify-derequire** plugin changes any require function names to `_dereq_`. This way there's no **module not found** error for local modules you might have required when browserify trys to re-bundle your module.

Publish to npm with `npm publish` from the directory you're in.

In your **index.js** you can do this

```javascript
//The "index.js file"
export default class Thing {
    speak(){
        var str = '<p>I am a thing object.</p>';
        //This won't work in node, but whatever.
        document.querySelector('body').innerHTML += str;
    }
}
```
After you've published to **npm** run `npm install mymodule` in the command line.

After you've installed your script from **npm** in your application javascript

```javascript
//thing.js
import Thing from "mymodule";
var thing = new Thing();
thing.speak();
```

The module works without a path.

If you're using jumble your html should look like this.

```html
<!DOCTYPE html>
<html>
<head>
    <title>My App</title>
</head>
<body>
<script src="thing.js"></script>
<script>
//do some stuff
</script>

</body>
</html>
```

Run `jumble` in the directory that has your html, and scripts.

Remember you can also browserify with babelify again, or include `dist/bundle.js` in a script tag. There are other options not listed here. Read about **umd** if you haven't been introduced to it yet.

### Another way to do es6 modules

In your package.json add these fields

```json
{
    "name": "mymodule",
    "main": "index.js",
    "version": <version>,
    "dependencies": {
        "babelify": "{version number}"
    },
    "browserify": {
        "transform": ["babelify"]
    }
}
```

to allow jumble to browserify your es6 module to bundles.


**This is risky. Please make sure that somewhere in your module documentation you let users know it's an es6 only module.** I don't know if you can conditional support es6, and commonjs. The node environment might belch on syntax errors. Perhaps an harmony flag can be set when you run node. Otherwise there's always io.js :).

The Manifest
------------

Jumble will look for a manifest file. This is the preferred way to use jumble.

These are the manifest file names it will look for.

```
    manifest.json   You have a standard package file.
                    This is preferred, but the world is not so easy.

    jumble.json     In lieu of anything else.

    package.json    You like node style packages.

    manifest.webapp You're supporting firefox os.

```

If a link element in the html has a `rel` attribute value of **manifest** then Jumble will look for the file set in the `src` attribute of that link.

The most important field (main, start, launch_path, start_url).
---------------------------------------------------------------

Jumble looks for a field that names the entry point for your app.

For a basic project you can use `main`, but you can also use `start`, `launch_path`, or `start_url`.

If a manifest is not found, or one of those fields are not found in a manifest the file name `index.html` will be used if one is found.

### A minimal manifest file that Jumble can use.

```json
{
    "name": "My App",
    "main": "index.html"
}
```


### The most important manifest fields used by jumble.

```
    name        It's optional, but it is used.

    main        The main html file. These fields can be used instead:
                start, launch_path, start_url.

    minify      Minify output. Optional defaulting to true.

    es6         Use Babel to process es6 code. Optional defaulting to false.

    desination  The folder to put the built application.
                The default is dist.

```

### Other useful manifest fields.

**Note the ability to make something inline has been removed. I've taken notice of the new paradigm with HTTP2, and have decided it's not worth it to keep supporting inline files being that HTTP2 will make the need for them obsolete.**

```
    inline      capability removed

    files       Non-script files to move with the build.

    directories Move these directories with the build.

    ignore      If you use the watch option these files, and
                folders will be ignored.
```

### Notes on files, and directory fields

If you have scripts in your html they will be parsed, and moved so there is no need to put those in the files, or directories fields.

The icons in a `manifest` json file will be automatically moved so you don't have add those to the files field.

The Module
----------

**The programmable interface has been changed. It is now an EventEmitter**

**Be aware that the module interface is in flux so there can be breaking changes. It will be stable one day, and it's very close.**

### require('jumble').make(options)

```javascript
var options = {
    "name": "myapp",
    "main": "index.html",
    "es6": true,
    "destination": "distro"
};
var b = require('jumble').make(options);

b.on('error', function(e){
    console.log(e);
});

b.on('complete', function(scriptNames){
    console.log('jumble is done writing everything!');
});
```

The make method does the same as running `jumble` in the command line. Options are the same as if you used the command line except for the **watch**, and **server** options which are only available in cmd. Make will even look for a `manifest` file.

--Make returns a modified options object.--

`jumble.make` returns an EventEmitter with **error**, and **complete** events.

`b.options` is a reference to the `options` passed to `jumble.make`.

### b.on("bundle", function(bundle){})

When a **browserify** bundle is generated for a discovered script the **bundle** event is emitted.

```
b.on("bundle", function(name, bundle){
    bundle.pipe(fs.createWriteStream(path.join(process.cwd(), "output/", name)));
});
```

JSON Output
-----------

--An intermediary json file is created by jumble using the name from the name field in you manifest.--

--If no manifest is found `mybundle_bundle.json` will be created. If a manifest with a name field is found `{name in manifest}_bundle.json` will be created.--

--For the most part you can ignore this json file. If you want you can explore it to see if you would like to do something crazy with it. Perhaps sending it over the wire to a server to install remotely would be interesting.--

**jumble no longer outputs an intermmediate json file. For me this was too slow. The streams, and events are much faster especially for a watched directory. This also makes the codebase easier to manage.**

I might add this back later if there is any call for it. There could be uses for a `json` output I haven't thought of yet.

The idea
--------

I'm most interested in standards. This means the roadmap for jumble will be to mostly to add features that are compliant with standards that can easily be rolled back if those standards change. Other far away standards based features, or odd ball experiments will be optional. Everything that's "set in stone", but maybe not yet implemented by all browsers will be defaults. I'll try to follow the controversy so I can figure out what those are.

Even if the standards are completely implemented I'll try to keep development going because compilation can still be useful in the case that condensed files are easier to send over the wire. Polyfills for complete standards will be removed as time moves forward. That is except for modules which will become optional because you just won't compile if you don't want to.

That being said all the crazy stuff like web components could benefit from compilation so we'll see.

Thank you to those who work on browserify, babel, and the many other modules that jumble takes advantage of.

References
----------

Jumble uses these modules
* browserify to compile commonjs javascript modules.
* babelify to compile es6 modules to commonjs
* clean-css to minify linked styles
* cheerio to get links from html
