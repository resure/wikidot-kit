'use strict';

const WikidotKit = require('.');

// This example uses WIKIDOT_API_TOKEN env variable
// Launch it like this:
// $ WIKIDOT_API_TOKEN='your_token_here' node examples.js

const wk = new WikidotKit({
	wikiName: 'scp-ru',
	token: process.env.WIKIDOT_API_TOKEN
});

// Fetch and print all page names in selected wiki
wk.fetchPagesList().then(console.log);

// TODO Probably it's good idea to pass wiki name as argument to each method call.
// TODO It will allow to use queue inside WikidotKit to prevent exceeding API quota.
