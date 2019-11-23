import * as XMLRPC from 'xmlrpc';
import axios from 'axios';

const WikidotAJAX = require('wikidot-ajax');

interface LoggerFn {
  (message: string, type?: string, any?: Object): void;
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

  log(message: string, extra?: any) {
    if (this.logger) {
      this.logger(message, 'info', extra);
    }
  }

  logError(message: string, extra?: any) {
    if (this.logger) {
      this.logger(message, 'error', extra);
    }
  }

  call(method: string, args: Object): Promise<any> {
    return new Promise((resolve, reject) => {
      this.log('rpcCall', { method, args });
      this.xmlrpc.methodCall(method, [args], (error, result) => {
        if (error) {
          reject(error);
        } else {
          resolve(result);
        }
      });
    });
  }

  ajaxCall(wikiUrl: string, args: Object): Promise<CheerioSelector> {
    const query = new WikidotAJAX({ baseURL: wikiUrl });
    this.log('ajaxCall', { wikiUrl, args });
    return query(args);
  }

  fetchPagesList(wiki: string): Promise<string[]> {
    return this.call('pages.select', { site: wiki });
  }

  fetchPage(wiki: string, name: string) {
    return this.call('pages.get_one', { site: wiki, page: name });
  }

  async fetchMembersList(wikiUrl: string): Promise<WKUser[]> {
    this.log('fetchMembersList', { wikiUrl });

    const membersPage: any = await this.ajaxCall(wikiUrl, {
      moduleName: 'membership/MembersListModule',
    });

    const totalPages = parseInt(membersPage('.pager .target:nth-last-child(2)').text(), 10);
    const pages = Array.from({ length: totalPages }, (_, i) => i);

    this.log('fetchMembersList total pages', { wikiUrl, totalPages });

    const fetchMembersPage = async (pageNumber: number): Promise<WKUser[]> => {
      this.log('fetchMembersPage', { wikiUrl, pageNumber });

      const $: any = await this.ajaxCall(wikiUrl, {
        moduleName: 'membership/MembersListModule',
        page: pageNumber,
      });
      return Array.from($('.printuser a:last-of-type')).map((elem) => {
        const jqElem = $(elem);
        return {
          username: jqElem.text(),
          uid: Number(jqElem.attr('onclick').replace(/.*\((.*?)\).*/, '$1')),
        };
      });
    };

    const userLists = await Promise.all(pages
      .map(pageNumber => fetchMembersPage(pageNumber)));

    const fullUserList = userLists
      .reduce((allUsers, pageOfUsers) => allUsers.concat(pageOfUsers), []);

    this.log('fetchMembersList full list is ready');

    return Promise.all(fullUserList.map(({ uid }: WKUser) => this.fetchUserProfile(wikiUrl, uid)));
  }

  async fetchUserProfile(wikiUrl: string, uid: number): Promise<WKUser> {
    this.log('fetchUserProfile', { wikiUrl, uid });

    const $: any = await this.ajaxCall(wikiUrl, {
      moduleName: 'users/UserInfoWinModule',
      user_id: uid,
    });

    const username = $('h1').text();
    const about = $('.table tr em').text();
    const date = $('.table tr .odate');
    const userSince = new Date($(date[0]).text());
    const memberSince = new Date($(date[1]).text());

    if (username.length) {
      return {
        uid, username, about, userSince, memberSince,
      };
    }
    return { uid, deleted: true };
  }

  public async resolvePageId(pageUrl: string): Promise<number | null> { // eslint-disable-line class-methods-use-this
    const PAGE_ID_REGEXP = /WIKIREQUEST\.info\.pageId = (\d+);/;
    const page = await axios({ url: pageUrl });
    const match = PAGE_ID_REGEXP.exec(page.data);
    return (match && parseInt(match[1], 10)) || null;
  }

  public async fetchPageVotes(wikiUrl: string, pageName: string): Promise<WKUserVote[]> {
    const pageUrl = `${wikiUrl}/${pageName}`;
    const pageID = await this.resolvePageId(pageUrl);
    if (!pageID) {
      throw new Error(`Page ${pageName} ID cannot be resolved`);
    }

    const $ = await this.ajaxCall(wikiUrl, {
      moduleName: 'pagerate/WhoRatedPageModule',
      pageId: pageID,
    });

    const uids = Array.from($('span.printuser a:first-of-type')
      .map((i: number, a: CheerioElement) => {
        const uid = $(a)
          .attr('onclick')
          .replace('WIKIDOT.page.listeners.userInfo(', '')
          .replace('); return false;', '');
        return parseInt(uid, 10);
      }));
    const votes = Array
      .from($('span:not([class])').map((i: number, span: CheerioElement) => $(span).text().trim()));

    const userVotes: WKUserVote[] = [];

    uids.forEach((uid, i) => {
      userVotes.push({ uid: Number(uid), vote: String(votes[i]) });
    });

    return userVotes;
  }

  public async fetchPageRevisionsList(wikiUrl: string, pageName: string): Promise<WKPageRevisionMeta[]> {
    const pageUrl = `${wikiUrl}/${pageName}`;
    const pageID = await this.resolvePageId(pageUrl);
    if (!pageID) {
      throw new Error(`Page ${pageName} ID cannot be resolved`);
    }

    const $ = await this.ajaxCall(wikiUrl, {
      moduleName: 'history/PageRevisionListModule',
      page_id: pageID,
      options: { source: true },
      perpage: 3000,
    });

    // @ts-ignore
    return Array.from($('.page-history tr:not(:first-child)').map((i: number, row: CheerioElement) => {
      const revisionNumber = parseInt($(row).find('td:nth-child(1)').text(), 10);

      const rawUID = $(row)
        .find('.printuser a:first-child')
        .attr('onclick');
      const uid = rawUID
        ? parseInt(rawUID
          .replace('WIKIDOT.page.listeners.userInfo(', '')
          .replace('); return false;', ''), 10)
        : -1;

      const date = $(row).find('td:nth-child(6)').text().replace('\n\t\t', '');
      const description = $(row).find('td:nth-child(7)').text();

      const revisionID = $(row)
        .find('a:first-child')
        .attr('onclick')
        .replace('showVersion(', '')
        .replace(')', '');

      return {
        number: revisionNumber,
        id: parseInt(revisionID, 10),
        uid,
        date,
        description,
      };
    }));
  }

  public async fetchPageRevisionContent(wikiUrl: string, revisionId: number): Promise<string> {
    const $ = await this.ajaxCall(wikiUrl, {
      moduleName: 'history/PageSourceModule',
      revision_id: revisionId,
    });

    return unescape($('.page-source').text());
  }
}
