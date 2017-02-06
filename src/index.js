import WikidotAJAX from 'wikidot-ajax';
import XMLRPC from 'xmlrpc';
import Promise from 'bluebird';

class WikidotKit {
    /**
     * @param {Object} args
     * @param {String} args.wikiName
     * @param {String} [args.user]
     * @param {Number} [args.concurrency]
     * @param {Number} [args.delay]
     * @param {String} args.token
     */
    constructor(args) {
        if (!args.token) {
            throw new Error('token is required');
        }

        this.xmlrpc = XMLRPC.createSecureClient({
            host: 'www.wikidot.com',
            port: 443,
            path: '/xml-rpc-api.php',
            basic_auth: {
                user: args.user || `WikidotKit v${WikidotKit.version}`,
                pass: args.token
            }
        });
    }

    /**
     * XMLRPC API method call
     *
     * @private
     *
     * @param {String} wiki
     * @param {String} method
     * @param {Object} [args]
     *
     * @returns {Promise}
     */
    call({wiki, method, args}) {
        const callArgs = Object.assign({}, args, {site: wiki});

        return new Promise((resolve, reject) => {
            this.xmlrpc.methodCall(method, [callArgs], (error, result) => {
                if (error) {
                    reject(error);
                } else {
                    resolve(result);
                }
            });
        });
    }

    /**
     * @param {String} wiki
     *
     * @returns {Promise}
     */
    fetchPagesList({wiki}) {
        return this.call({wiki, method: 'pages.select'});
    }

    /**
     * Fetches single page metadata and content by wiki and name
     *
     * @param {String} wiki
     * @param {String} name
     *
     * @returns {Promise}
     */
    fetchPage({wiki, name}) {
        return this.call({
            wiki,
            method: 'pages.get_one',
            args: {
                site: wiki,
                page: name
            }
        });
    }
}

WikidotKit.AJAX = WikidotAJAX;
WikidotKit.version = require('../package.json').version;

export default WikidotKit;
