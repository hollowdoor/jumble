var path = require('path');
//alert('ok');
console.log('path.join results = ' + path.join('tmp', 'stuff'));
require('./lib/bla')('Bla!');

import bla from "./lib/bla";

bla('es6 yay!');

import Thing from "thing";
//import Thing from "./thing";
//import Thing from "./mods/thing/thing";

var thing = new Thing();
console.log(thing);
thing.speak();

require('./lib/ex')();
