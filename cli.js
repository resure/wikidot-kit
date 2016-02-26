#!/usr/bin/env node
'use strict';
var meow = require('meow');
var wikidotKit = require('./');

var cli = meow([
	'Usage',
	'  $ wikidot-kit [input]',
	'',
	'Options',
	'  --foo  Lorem ipsum. [Default: false]',
	'',
	'Examples',
	'  $ wikidot-kit',
	'  unicorns & rainbows',
	'  $ wikidot-kit ponies',
	'  ponies & rainbows'
]);

console.log(wikidotKit(cli.input[0] || 'unicorns'));
