const WikidotKit = require('../build').default;

const getKit = () => new WikidotKit(process.env.WIKIDOT_API_TOKEN, console.log);

it('fetches pages list', async () => {
    const wk = getKit();

    const ruPagesList = await wk.fetchPagesList('o5r');

    expect(ruPagesList[0]).toEqual('nav:side');
    expect(ruPagesList[15]).toEqual('how-to-edit-pages');
    expect(ruPagesList.length).toEqual(29);
});

it('fetches single page', async () => {
    const wk = getKit();

    const page = await wk.fetchPage('scp-ru', 'scp-173');
    expect(page.title).toEqual('SCP-173 - Скульптура');
});

it('fetches page votes', async () => {
    const wk = getKit();
    const pageName = 'scp-173';

    const votes = await wk.fetchPageVotes('http://scpfoundation.net', pageName);

    const confirmedPositiveVote = votes.find((vote) => vote.uid === 716422)
        .vote;
    const confirmedNegativeVote = votes.find((vote) => vote.uid === 657647)
        .vote;

    expect(confirmedPositiveVote).toEqual('+');
    expect(confirmedNegativeVote).toEqual('-');
});

it('fetches page revision list', async () => {
    const wk = getKit();
    const revisions = await wk.fetchPageRevisionsList(
        'http://scpfoundation.net',
        'scp-173'
    );

    const firstRevision = revisions.find((r) => r.number === 0);
    const sixthRevision = revisions.find((r) => r.number === 5);

    expect(firstRevision.date.toISOString()).toEqual(
        '2010-06-27T17:04:00.000Z'
    );
    expect(firstRevision.id).toEqual(15462778);
    expect(firstRevision.uid).toEqual(507955);

    expect(sixthRevision.date.toISOString()).toEqual(
        '2010-06-30T14:35:00.000Z'
    );
    expect(sixthRevision.id).toEqual(15506120);
    expect(sixthRevision.uid).toEqual(507955);
    expect(sixthRevision.description).toEqual('Added tags: euclid.');
});

it('fetches page revision data', async () => {
    const wk = getKit();
    const revision = await wk.fetchPageRevisionContent(
        'http://scpfoundation.net',
        15506123
    );
    expect(revision.length).toEqual(1650);
});

it('resolves page id', async () => {
    const wk = getKit();

    const pageId = await wk.resolvePageId('http://scpfoundation.net/scp-173');
    expect(pageId).toEqual(5195203);
});

it('fetches members list', async () => {
    const wk = getKit();

    const members = await wk.fetchMembersList('http://o5r.wikidot.com');

    expect(members[0].username).toEqual('Resure');
    expect(members[1].username).toEqual('Ged_Malburg');
    expect(members[2].username).toEqual('Gene R');
    expect(members.length).toEqual(3);
});

it('fetches single profile', async () => {
    const wk = getKit();

    const userProfile = await wk.fetchUserProfile(
        'http://scpfoundation.net',
        716422
    );
    expect(userProfile.username).toEqual('Resure');
});

it('fetches single profile by username', async () => {
    const wk = getKit();

    const userProfile = await wk.fetchUserProfileByUsername('resure');
    expect(userProfile.username).toEqual('Resure');
    expect(userProfile.uid).toEqual(716422);
    expect(userProfile.userSince.toISOString()).toEqual(
        '2011-02-21T21:28:00.000Z'
    );
});

it('fetches page comments', async () => {
    jest.setTimeout(100 * 1000);
    const wk = getKit();

    const comments = await wk.fetchPageComments('scp-ru', 'scp-173');

    expect(comments[0]['created_by']).toEqual('Kosykh');
    expect(comments[0].content.length).toEqual(146);
    expect(comments[7]['created_by']).toEqual('paranoik');
    expect(comments[7].content.length).toEqual(184);
});
