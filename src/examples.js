'use strict';

const WikidotKit = require('./');

// This example uses WIKIDOT_API_TOKEN env variable
// Launch it like this:
// $ WIKIDOT_API_TOKEN='your_token_here' node examples.js

const wk = new WikidotKit({
    token: process.env.WIKIDOT_API_TOKEN
});

// Fetch pages list from selected wiki and print number of them
wk.fetchPagesList({wiki: 'scp-ru'})
    .then((pageList) => console.log(`Number of pages on this wiki: ${pageList.length}`));

// Fetch selected page and print it's title
wk.fetchPage({wiki: 'scp-ru', name: 'scp-173'})
    .then((page) => console.log(page.title));
