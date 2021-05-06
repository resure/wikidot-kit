/* eslint-disable camelcase, @typescript-eslint/no-var-requires, @typescript-eslint/naming-convention */

import * as XMLRPC from 'xmlrpc';
import axios from 'axios';
import cheerio from 'cheerio';
import {SimpleObject} from './types';
import prepareCaller from './ajax';

interface LoggerFn {
    (message: string, type?: string, any?: unknown): void;
}

export interface WKUser {
    uid: number;
    username?: string;
    deleted?: boolean;
    about?: string;
    userSince?: Date;
    memberSince?: Date;
}

export interface WKPage {
    fullname: string;
    created_at: string;
    created_by: string;
    updated_at: string;
    updated_by: string;
    title: string;
    title_shown: string;
    tags: string[];
    rating: number;
    revisions: number;
    content: string;
    html: string;
    children: number;
    comments: number;
    commented_at: string;
    commented_by: string;
}

export interface WKComment {
    id: number;
    fullname: string;
    reply_to: null | number;
    title: string;
    content: string;
    html: string;
    created_by: string;
    created_at: string;
}

export interface WKPageRevisionMeta {
    id: number;
    number: number;
    uid: number;
    date: Date;
    description: string;
}

export interface WKUserVote {
    uid: number;
    vote: string;
}

const WIKIDOT_ENDPOINT = 'https://www.wikidot.com';

export default class WikidotKit {
    static version: string;

    xmlrpc: XMLRPC.Client;

    logger?: LoggerFn;

    constructor(token: string, logger?: LoggerFn) {
        if (!token) {
            throw new Error('token is required');
        }

        if (logger) {
            this.logger = logger;
        }

        this.xmlrpc = XMLRPC.createSecureClient({
            host: 'www.wikidot.com',
            port: 443,
            path: '/xml-rpc-api.php',
            basic_auth: {
                user: `WikidotKit v${WikidotKit.version}`,
                pass: token,
            },
        });
    }

    log(message: string, extra?: unknown): void {
        if (this.logger) {
            this.logger(message, 'info', extra);
        }
    }

    logError(message: string, extra?: unknown): void {
        if (this.logger) {
            this.logger(message, 'error', extra);
        }
    }

    call<T>(method: string, args: SimpleObject): Promise<T> {
        return new Promise((resolve, reject) => {
            this.log('rpcCall', {method, args});
            this.xmlrpc.methodCall(method, [args], (error, result) => {
                if (error) {
                    reject(error);
                } else {
                    resolve(result);
                }
            });
        });
    }

    ajaxCall(wikiUrl: string, args: SimpleObject): Promise<cheerio.Selector> {
        const query = prepareCaller({baseUrl: wikiUrl});
        this.log('ajaxCall', {wikiUrl, args});
        return query(args);
    }

    fetchPagesList(wiki: string): Promise<string[]> {
        return this.call<string[]>('pages.select', {site: wiki});
    }

    fetchPage(wiki: string, name: string): Promise<WKPage> {
        return this.call<WKPage>('pages.get_one', {site: wiki, page: name});
    }

    async fetchPageComments(wiki: string, name: string): Promise<WKComment[]> {
        const BATCH_SIZE = 10; // Wikidot API limit
        const fetchBatch = async (ids: string[]) => {
            const comments = await this.call<Record<string, WKComment>>(
                'posts.get',
                {site: wiki, posts: ids}
            );
            return Object.keys(comments).map(
                (commentId) => comments[commentId]
            );
        };
        const commentIds = (
            await this.call<number[]>('posts.select', {site: wiki, page: name})
        ).map((id) => id.toString());

        const comments: WKComment[] = [];

        for (let i = 0; i < Math.ceil(commentIds.length / BATCH_SIZE); i++) {
            const batch = commentIds.slice(
                i * BATCH_SIZE,
                i * BATCH_SIZE + BATCH_SIZE
            );
            const fetchedComments = await fetchBatch(batch);
            comments.push(...fetchedComments);
        }

        return comments;
    }

    async fetchMembersList(
        wikiUrl: string
    ): Promise<Array<{username: string; uid: number}>> {
        this.log('fetchMembersList', {wikiUrl});

        const membersPage = await this.ajaxCall(wikiUrl, {
            moduleName: 'membership/MembersListModule',
        });

        const totalPages = parseInt(
            membersPage('.pager .target:nth-last-child(2)').text(),
            10
        );

        this.log('fetchMembersList total pages', {wikiUrl, totalPages});

        const fetchMembersPage = async (
            pageNumber: number
        ): Promise<Array<{username: string; uid: number}>> => {
            this.log('fetchMembersPage', {wikiUrl, pageNumber});

            const $ = await this.ajaxCall(wikiUrl, {
                moduleName: 'membership/MembersListModule',
                page: pageNumber,
            });
            return Array.from($('.printuser a:last-of-type')).map((elem) => {
                const jqElem = $(elem);
                return {
                    username: jqElem.text(),
                    uid: Number(
                        jqElem.attr('onclick')?.replace(/.*\((.*?)\).*/, '$1')
                    ),
                };
            });
        };

        const userLists = [];
        for (let i = 0; i < totalPages; i++) {
            const userList = await fetchMembersPage(i);
            userLists.push(userList);
        }

        const fullUserList = userLists.reduce(
            (allUsers, pageOfUsers) => allUsers.concat(pageOfUsers),
            []
        );

        this.log('fetchMembersList full list is ready');

        return fullUserList;
    }

    async fetchUserProfile(wikiUrl: string, uid: number): Promise<WKUser> {
        this.log('fetchUserProfile', {wikiUrl, uid});

        const $ = await this.ajaxCall(wikiUrl, {
            moduleName: 'users/UserInfoWinModule',
            user_id: uid,
        });

        const username = $('h1').text().trim();
        const about = $('.table tr em').text().trim();
        const date = $('.table tr .odate');
        const userSince = new Date($(date[0]).text());
        const memberSince = new Date($(date[1]).text());

        if (username.length) {
            return {
                uid,
                username,
                about,
                userSince,
                memberSince,
            };
        }
        return {uid, deleted: true};
    }

    async fetchUserProfileByUsername(inputUsername: string): Promise<WKUser> {
        const preparedUsername = inputUsername
            .toLowerCase()
            .replace(/\s+/g, '-');
        this.log('fetchUserProfileByUsername', {
            username: inputUsername,
            preparedUsername,
        });

        const {data} = await axios.get(
            `${WIKIDOT_ENDPOINT}/user:info/${preparedUsername}`
        );

        const $ = cheerio.load(data);

        const username = $('h1').text().trim();
        const userSince = new Date($('.profile-box dd .odate').text().trim());
        const uidString =
            $('#page-content .btn-danger.pull-right')
                .attr('onclick')
                ?.match(/\d+/)?.[0] || '';

        if (!uidString) {
            throw new Error('Cannot extract user uid');
        }

        const uid = parseInt(uidString, 10);

        if (username.length) {
            return {
                uid,
                username,
                userSince,
            };
        } else {
            return {uid, deleted: true};
        }
    }

    async resolvePageId(pageUrl: string): Promise<number | null> {
        // eslint-disable-line class-methods-use-this
        const PAGE_ID_REGEXP = /WIKIREQUEST\.info\.pageId = (\d+);/;
        const page = await axios({url: pageUrl});
        const match = PAGE_ID_REGEXP.exec(page.data);
        return (match && parseInt(match[1], 10)) || null;
    }

    async fetchPageVotes(
        wikiUrl: string,
        pageName: string
    ): Promise<WKUserVote[]> {
        const pageUrl = `${wikiUrl}/${pageName}`;
        const pageID = await this.resolvePageId(pageUrl);
        if (!pageID) {
            throw new Error(`Page ${pageName} ID cannot be resolved`);
        }

        const $ = await this.ajaxCall(wikiUrl, {
            moduleName: 'pagerate/WhoRatedPageModule',
            pageId: pageID,
        });

        const uids = Array.from(
            $('span.printuser a:first-of-type').map(
                (i: number, a: cheerio.Element) => {
                    const linkOnClick = $(a).attr('onclick');
                    if (!linkOnClick) {
                        return null;
                    }
                    const uid = linkOnClick
                        .replace('WIKIDOT.page.listeners.userInfo(', '')
                        .replace('); return false;', '');
                    return parseInt(uid, 10);
                }
            )
        );
        const votes = Array.from(
            $('span:not([class])').map((i: number, span: cheerio.Element) =>
                $(span).text().trim()
            )
        );

        const userVotes: WKUserVote[] = [];

        uids.forEach((uid, i) => {
            userVotes.push({uid: Number(uid), vote: String(votes[i])});
        });

        return userVotes;
    }

    async fetchPageRevisionsList(
        wikiUrl: string,
        pageName: string
    ): Promise<WKPageRevisionMeta[]> {
        const pageUrl = `${wikiUrl}/${pageName}`;
        const pageID = await this.resolvePageId(pageUrl);
        if (!pageID) {
            throw new Error(`Page ${pageName} ID cannot be resolved`);
        }

        const $ = await this.ajaxCall(wikiUrl, {
            moduleName: 'history/PageRevisionListModule',
            page_id: pageID,
            options: {source: true},
            perpage: 3000,
        });

        const revisionRows = Array.from(
            $('.page-history tr:not(:first-child)')
        );

        const revisions = revisionRows.map((row: cheerio.Element) => {
            const revisionNumber = parseInt(
                $(row).find('td:nth-child(1)').text(),
                10
            );

            const rawUID = $(row)
                .find('.printuser a:first-child')
                .attr('onclick');
            const uid = rawUID
                ? parseInt(
                      rawUID
                          .replace('WIKIDOT.page.listeners.userInfo(', '')
                          .replace('); return false;', ''),
                      10
                  )
                : -1;

            const date = new Date(
                $(row).find('td:nth-child(6)').text().replace('\n\t\t', '')
            );
            const description = $(row).find('td:nth-child(7)').text();

            const rowLink = $(row).find('a:first-child');
            if (!rowLink) {
                return null;
            }
            const rowLinkOnClick = rowLink.attr('onclick');
            if (!rowLinkOnClick) {
                return null;
            }

            const revisionID = rowLinkOnClick
                .replace('showVersion(', '')
                .replace(')', '');

            return {
                number: revisionNumber,
                id: parseInt(revisionID, 10),
                uid,
                date,
                description,
            };
        });

        const filteredRevisions = revisions.filter(
            (revision) => revision !== null
        ) as WKPageRevisionMeta[];

        return filteredRevisions;
    }

    async fetchPageRevisionContent(
        wikiUrl: string,
        revisionId: number
    ): Promise<string> {
        const $ = await this.ajaxCall(wikiUrl, {
            moduleName: 'history/PageSourceModule',
            revision_id: revisionId,
        });

        return unescape($('.page-source').text());
    }
}
