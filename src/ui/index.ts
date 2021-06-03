import { Page } from 'puppeteer-core';
import { wrapPage } from './puppeteer/browser';

import { getBrowser } from './puppeteer/global-browser';

async function launch(): Promise<Page> {
  const browser = await getBrowser();
  const [page] = await browser.pages();
  return wrapPage(browser, page);
}

export { launch };
