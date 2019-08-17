import WikidotKit from '.';

// This example uses WIKIDOT_API_TOKEN env variable
// Launch it like this:
// $ WIKIDOT_API_TOKEN='your_token_here' node examples.js

const wk = new WikidotKit(process.env.WIKIDOT_API_TOKEN as string, console.log);

// Fetch pages list from selected wiki and print number of them
wk.fetchPagesList('scp-ru')
  .then(pageList => console.log(`Number of pages on this wiki: ${pageList.length}`));

// Fetch selected page and print it's title
wk.fetchPage('scp-ru', 'scp-173')
  .then(page => console.log(page.title));

// Fetch and print wiki members list
// wk.fetchMembersList('http://scpfoundation.net')
//     .then(console.log);

// Fetch and print wikidot user profile
// wk.fetchUserProfile('http://scpfoundation.net', 716422)
//     .then(console.log);

// Resolve page id by URL
// wk.resolvePageId('http://scpfoundation.net/scp-173').then(console.log);

// Fetch page votes
// wk.fetchPageVotes('http://scpfoundation.net', 'scp-173').then(console.log);

// Fetch page revisions list
// wk.fetchPageRevisionsList('http://scpfoundation.net', 'scp-173').then(console.log);

// Fetch revision data
// wk.fetchPageRevisionContent('http://scpfoundation.net', 15506123).then(console.log);
