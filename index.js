'use strict';

const WikidotAJAX = require('wikidot-ajax');
const XMLRPC = require('xmlrpc');
const Promise = require('bluebird');
const Bottleneck = require('bottleneck');

// Wikidot API rate limited to 240 req/min (one request every 250 ms), but we're
// adding here some additional delay just in case and considering concurrency
const DEFAULT_DELAY = 800;
const DEFAULT_CONCURRENCY = 3;

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

		this.concurrency = args.concurrency || DEFAULT_CONCURRENCY;
		this.delay = args.delay || DEFAULT_DELAY;

		this.limiter = new Bottleneck();
		this.limiter.changeReservoir(this.concurrency);

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
	 * Enqueues function using limiter
	 *
	 * @private
	 *
	 * @param {Function} fn
	 * @param {Array} args
	 *
	 * @returns {Promise}
	 */
	enqueue(fn, ...args) {
		return this.limiter.schedule(fn, ...args).finally(() => {
			this.limiter.incrementReservoir(1);
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
		args = Object.assign({}, args, {site: wiki});

		return this.enqueue(() => {
			return new Promise((resolve, reject) => {
				this.xmlrpc.methodCall(method, [args], (error, result) => {
					if (error) {
						reject(error);
					} else {
						resolve(result);
					}
				});
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
}

WikidotKit.AJAX = WikidotAJAX;
WikidotKit.version = require('./package.json').version;
module.exports = WikidotKit;
