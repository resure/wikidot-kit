'use strict';

const WikidotAJAX = require('wikidot-ajax');
const XMLRPC = require('xmlrpc');
const Promise = require('bluebird');

class WikidotKit {
	/**
	 * @param {Object} args
	 * @param {String} args.wikiName
	 * @param {String} [args.user]
	 * @param {String} args.token
	 */
	constructor(args) {
		if (!args.wikiName) {
			throw new Error('wikiName is required');
		}
		if (!args.token) {
			throw new Error('token is required');
		}

		this.wikiName = args.wikiName;
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
	 * @param {String} method
	 * @param {Object} [args]
	 *
	 * @returns {Promise}
	 */
	call(method, args) {
		args = Object.assign({}, args, {site: this.wikiName});
		return new Promise((resolve, reject) => {

			this.xmlrpc.methodCall(method, [args], (error, result) => {
				if (error) {
					reject(error);
				} else {
					resolve(result);
				}
			});
		});
	}

	fetchPagesList() {
		return this.call('pages.select');
	}
}

WikidotKit.AJAX = WikidotAJAX;
WikidotKit.version = require('./package.json').version;
module.exports = WikidotKit;
