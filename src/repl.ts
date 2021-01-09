import WikidotKit from '.';
import repl = require('repl');

const wk = new WikidotKit(process.env.WIKIDOT_API_TOKEN as string, console.log);
process.env.REPL_MODE = '1';
const replServer = repl.start();

Object.assign(replServer.context, {
    r: (p: Promise<unknown>) => {
        p.then((result) =>
            console.log('\n\n', result, '\n\nPress enter to continue')
        ).catch(console.error);
    },

    s: (p: Promise<unknown>) => {
        p.then(() =>
            console.log('\n\nDone', '\n\nPress enter to continue')
        ).catch(console.error);
    },

    wk,
});
