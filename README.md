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

How?
----

Jumble processes script links in an html file, and trys to read them if they exist.

If the files are found the scripts are parsed with **browserify**. There is an intermediate state with a json file, but that is not so important.

If a directory is specified a folder will be created, and the built project will be sent to that folder.

If all is well you should find a build folder for your project. When you open the main `html` file from that build folder in a browser, or webview it should work.

A summary of what jumble does
-----------------------------

When you run jumble on the command line it looks for an html file specified in your manifest, or it looks for index.html. If jumble finds an html file it starts looking for other files associated with that file to compile.

Jumble compiles javascript with browserify, inlines css minified, and moves the files to a new directory.

Hopefully the html file will run in a browser/webview, just like it would without being compiled with jumble.

References
----------

Jumble uses **browserify** to compile javascript modules.

Command line usage
------------------

The **destination** argument is optional. A folder named **dist** will be created if you haven't named a destination.

```
Run the command
user@computer:~$ jumble desination {options}

    --watch, -w         Watch the current directory for changes.
                        When there's a change rebuild the project.
    
    --minify -m         Minify the output of javascript.
                        The default is true.
    
    --es6, -e           Compile es6 code using Babel.js.
    
    --raw, -r           Include a raw field in the produced json
                        with unmodified code for each script.
    
    --name, -n          The name of your project.
    
    --location, -l      Where to store the json output.
    
```

Notes on the es6 option.
------------------------

There are caveats using Babel. Visit their documentation to find out what those are.

Some info about how to make es6 modules available for babelify can be found here https://github.com/babel/babelify.

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
    
    main        The main html file. The fields can be used instead:
                start, launch_path, start_url.
    
    minify      Minify output. Optional defaulting to true.
    
    es6         Use Babel to process es6 code. Optional defaulting to false.
    
    desination  The folder to put the built application.
                The default is dist.
    
```

### Other useful manifest fields.

```
    inline      An array of file types to make inline.
                Most likely css. Even though it's an array
                no other types can be inline yet. The
                default is ['css']
                
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

Jumble can be used as a module.

### require('jumble').make(options)

The make method does the same as running `jumble` in the command line. Options are the same as if you used the command line. Make will even look for a `manifest` file.

Make returns a modified options object.

JSON Output
-----------

An intermediary json file is created by jumble using the name from the name field in you manifest.

If no manifest is found `mybundle_bundle.json` will be created. If a manifest with a name field is found `{name in manifest}_bundle.json` will be created.

For the most part you can ignore this json file. If you want you can explore it to see if you would like to do something crazy with it. Perhaps sending it over the wire to a server to install remotely would be interesting.
