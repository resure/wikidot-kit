import WikidotKit from './';

// This example uses WIKIDOT_API_TOKEN env variable
// Launch it like this:
// $ WIKIDOT_API_TOKEN='your_token_here' node examples.js

const wk = new WikidotKit({
    token: process.env.WIKIDOT_API_TOKEN
});

// Fetch and print all page names in selected wiki
wk.fetchPagesList({wiki: 'scp-ru'})
    .then(console.log);

// Fetch and print content of a single page
wk.fetchPage({wiki: 'scp-ru', name: 'scp-173'})
    .then(console.log);
