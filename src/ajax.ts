import axios from 'axios';
import cheerio from 'cheerio';
import qs from 'qs';
import {SimpleObject} from './types';


interface InitArgs {
    baseUrl: string;
}

/*
 * This function takes baseURL and returns another function
 * that is ready to make requests to certain Wikidot site.
 */
export default function prepareCaller({baseUrl}: InitArgs): (params: SimpleObject) => Promise<CheerioStatic> {
    const wikidotToken7 = Math.random().toString(36).substring(7);
    const connectorURL = `${baseUrl}/ajax-module-connector.php`;

    /*
	 * This function takes params object which is passed to POST request to
	 * wikidot ajax connector. The only requried param is moduleName but you'll
	 * need to pass some others depending on which ajax method you're working with.
	 *
	 * Just open dev console in browser, make some action on wikidot and look,
	 * which module is used there and what parameters are being passed to it.
	 */
    return async function makeAjaxQuery(params: SimpleObject): Promise<CheerioStatic> {
        const page = await axios.post(
            connectorURL,
            qs.stringify(Object.assign({}, {wikidot_token7: wikidotToken7, callbackIndex: 1}, params)),
            {
                headers: {
                    cookie: `wikidot_token7=${wikidotToken7}`,
                    'content-type': 'application/x-www-form-urlencoded;charset=utf-8',
                },
            },
        );

        return cheerio.load(page.data.body);
    };
}
