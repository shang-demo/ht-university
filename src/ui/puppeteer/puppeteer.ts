import puppeteer, { Browser, ConnectOptions, LaunchOptions, Page } from 'puppeteer-core';

import { getMockBrowser } from './browser';
import { getEndpoint } from './global-browser';

class PuppeteerMock {
  private browser: Browser | undefined;

  public async connect(
    options?: ConnectOptions,
    afterPageCreate = (page: Page): any => {
      return page;
    },
  ): Promise<Browser> {
    if (this.browser) {
      return this.browser;
    }

    let browserWSEndpoint;

    if (!options || !options.browserWSEndpoint) {
      browserWSEndpoint = await getEndpoint();
    } else {
      browserWSEndpoint = options.browserWSEndpoint;
    }

    const originBrowser = await puppeteer.connect({
      ...options,
      browserWSEndpoint,
    });

    this.browser = getMockBrowser(originBrowser, afterPageCreate);
    return this.browser;
  }

  public async launch(options: LaunchOptions | ConnectOptions): Promise<Browser> {
    return this.connect(options);
  }

  public async close(): Promise<void> {
    await this.browser?.close();
  }
}

export { PuppeteerMock };
