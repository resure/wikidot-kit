'use strict';

const WikidotAJAX = require('wikidot-ajax');
const XMLRPC = require('xmlrpc');
const Promise = require('bluebird');

const DEFAULT_CONCURRENCY = 4;

class WikidotKit {
    /**
     * @param {String} token
     * @param {String} [user]
     * @param {Number} [concurrency]
     */
    constructor({token, user, concurrency = DEFAULT_CONCURRENCY}) {
        if (!token) {
            throw new Error('token is required');
        }

        this.concurrency = concurrency;

        this.xmlrpc = XMLRPC.createSecureClient({
            host: 'www.wikidot.com',
            port: 443,
            path: '/xml-rpc-api.php',
            basic_auth: {
                user: user || `WikidotKit v${WikidotKit.version}`,
                pass: token
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

    /**
     * Fetches full list of wiki members
     *
     * @param {String} wikiURL
     *
     * @returns {Promise}
     */
    fetchMembersList({wikiURL}) {
        const query = new WikidotAJAX({baseURL: wikiURL});

        return query({
            moduleName: 'membership/MembersListModule'
        })
            .then(($) => {
                const totalPages = parseInt($('.pager .target:nth-last-child(2)').text(), 10);
                const pages = [];
                for (let i = 1; i <= totalPages; i++) {
                    pages.push(i);
                }
                return pages;
            })

            .map((pageNumber) => {
                return query({
                    moduleName: 'membership/MembersListModule',
                    page: pageNumber
                });
            })

            .map(($) => {
                return Array.from($('.printuser a:last-of-type')).map((elem) => {
                    const jqElem = $(elem);
                    return {
                        username: jqElem.text(),
                        uid: jqElem.attr('onclick').replace(/.*\((.*?)\).*/, '$1')
                    };
                });
            }, {concurrency: this.concurrency})

            .reduce((allUsers, pageOfUsers) => allUsers.concat(pageOfUsers), []);
    }

    /**
     * Fetches wikidot user profile by uid
     *
     * @param {String} wikiURL
     * @param {Number} uid
     *
     * @returns {Promise}
     */
    fetchUserProfile({wikiURL, uid}) {
        const query = new WikidotAJAX({baseURL: wikiURL});

        return query({
            moduleName: 'users/UserInfoWinModule',
            user_id: uid
        })
            .then(($) => {
                const username = $('h1').text();
                const about = $('.table tr em').text();
                const date = $('.table tr .odate');
                const userSince = new Date($(date[0]).text());
                const memberSince = new Date($(date[1]).text());
                if (username.length) {
                    return {username, about, userSince, memberSince};
                } else {
                    return {deleted: true};
                }
            });
    }
}

WikidotKit.AJAX = WikidotAJAX;
WikidotKit.version = require('../package.json').version;

module.exports = WikidotKit;
