import WikidotKit from '.';
import prepareCaller from './ajax';

// This example uses WIKIDOT_API_TOKEN env variable
// Launch it like this:
// $ WIKIDOT_API_TOKEN='your_token_here' node examples.js

async function main() {

    // Wikidot ajax call example
    const caller = prepareCaller({baseUrl: 'http://scpfoundation.net'});
    // Example of fetching user profile by ID and extracting username from response
    const query = await caller({
        moduleName: 'users/UserInfoWinModule',
        user_id: 716422,
    });
    console.log(query('.content.modal-body h1').text());


    // WikidotKit examples

    const wk = new WikidotKit(process.env.WIKIDOT_API_TOKEN as string, console.log);

    // Fetch pages list from selected wiki and print number of them
    const ruPagesList = await wk.fetchPagesList('scp-ru');
    console.log(`Number of pages on this wiki: ${ruPagesList.length}`);

    // Fetch selected page and print it's title
    const page = await wk.fetchPage('scp-ru', 'scp-173');
    console.log(page.title);

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
    // const votes = await wk.fetchPageVotes('http://scpfoundation.net', 'scp-173');
    // console.log(votes);

    // Fetch page revisions list
    // wk.fetchPageRevisionsList('http://scpfoundation.net', 'scp-173').then(console.log);

    // Fetch revision data
    // wk.fetchPageRevisionContent('http://scpfoundation.net', 15506123).then(console.log);
}

main().catch(console.error);
