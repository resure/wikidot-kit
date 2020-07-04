const WikidotKit = require('../build').default;

const getKit = () => new WikidotKit(process.env.WIKIDOT_API_TOKEN, console.log);


it('correctly fetches pages list', async () => {
    const wk = getKit();

    const ruPagesList = await wk.fetchPagesList('scp-ru');
    expect(ruPagesList[0]).toEqual('admin:manage');
    expect(ruPagesList[42]).toEqual('scp-010');
});

it('correctly fetches single page', async () => {
    const wk = getKit();

    const page = await wk.fetchPage('scp-ru', 'scp-173');
    expect(page.title).toEqual('SCP-173 - Скульптура');
});

it('correctly fetches page votes', async () => {
    const wk = getKit();
    const pageName = 'scp-173';

    const votes = await wk.fetchPageVotes('http://scpfoundation.net', pageName);

    const confirmedPositiveVote = votes.find((vote) => vote.uid === 716422).vote;
    const confirmedNegativeVote = votes.find((vote) => vote.uid === 657647).vote;

    expect(confirmedPositiveVote).toEqual('+');
    expect(confirmedNegativeVote).toEqual('-');
});

it('correctly fetches page revision list', async () => {
    const wk = getKit();
    const revisions = await wk.fetchPageRevisionsList('http://scpfoundation.net', 'scp-173');

    const firstRevision = revisions.find((r) => r.number === 0);
    const sixthRevision = revisions.find((r) => r.number === 5);

    expect(firstRevision.date.toISOString()).toEqual('2010-06-27T17:04:00.000Z');
    expect(firstRevision.id).toEqual(15462778);
    expect(firstRevision.uid).toEqual(507955);

    expect(sixthRevision.date.toISOString()).toEqual('2010-06-30T14:35:00.000Z');
    expect(sixthRevision.id).toEqual(15506120);
    expect(sixthRevision.uid).toEqual(507955);
    expect(sixthRevision.description).toEqual('Added tags: euclid.');
});

it('correctly fetches page revision data', async () => {
    const wk = getKit();
    const revision = await wk.fetchPageRevisionContent('http://scpfoundation.net', 15506123);
    expect(revision.length).toEqual(1650);
});

it('correctly resolves page id', async () => {
    const wk = getKit();

    const pageId = await wk.resolvePageId('http://scpfoundation.net/scp-173');
    expect(pageId).toEqual(5195203);
});

it('correctly fetches members list', async () => {
    const wk = getKit();

    const members = await wk.fetchMembersList('http://scpfoundation.net');

    expect(members[0].username).toEqual('scp-ru');
    expect(members[1].username).toEqual('Whitepaw');
});

it('correctly fetches single profile', async () => {
    const wk = getKit();

    const userProfile = await wk.fetchUserProfile('http://scpfoundation.net', 716422);
    expect(userProfile.username).toEqual('Resure');
});

