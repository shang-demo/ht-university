import promiseRetry from 'promise-retry';
import type { Browser, Page } from 'puppeteer-core';
import { getBrowser } from './ui/puppeteer/global-browser';

const studyUrl = `http://university.hengtonggroup.com.cn/sty/mystudytask.htm`;

async function login(username: string | undefined, password: string | undefined, page: Page) {
  if (!username) {
    throw new Error('请输入用户名');
  }

  if (!password) {
    throw new Error('请输入密码');
  }

  console.log('登录账户为: ', { username, password });

  await page.goto(`http://university.hengtonggroup.com.cn/login.htm`, {
    waitUntil: 'networkidle2',
  });

  await page.waitForSelector('#txtUserName2');
  await page.type('#txtUserName2', username, { delay: 100 });
  await page.type('#txtPassword2', password, { delay: 100 });

  console.log('登录中....');
  await Promise.all([
    page.waitForNavigation({ timeout: 30 * 1000, waitUntil: 'networkidle2' }),
    await page.$eval('#btnLogin2', (ele) => {
      (ele as HTMLButtonElement).click();
    }),
  ]);

  return page;
}

async function getStudyPages(page: Page) {
  await page.goto(studyUrl, { waitUntil: 'networkidle2' });

  const doc = await page.content();

  const [v] = doc.match(/(?<=learningKnowledge\((&quot;|"))(.*?\.html)/g) ?? [];

  await page.goto(`http://university.hengtonggroup.com.cn/${v}`, { waitUntil: 'networkidle2' });

  const urlList = await page.$$eval('#tbodyTrainInfo .hand', (list) => {
    return list
      .filter((v) => {
        let ele = v.querySelector<HTMLTableCellElement>('td:last-of-type');

        if (!ele) {
          return false;
        }

        const [percent] = ele.innerText.match(/\d+(?=%)/) ?? [];

        if (!percent) {
          return false;
        }

        if (parseInt(percent, 10) === 100) {
          return false;
        }

        return true;
      })
      .map((ele) => {
        const [path] = ele.outerHTML.match(/(?<=StudyRowClick\((&quot;|"|'))(.*?\.html)/g) ?? [];

        return path;
      });
  });

  return urlList;
}

async function playVideo(browser: Browser, url: string) {
  const page = await browser.newPage();
  await page.goto(`http://university.hengtonggroup.com.cn/${url}`, { waitUntil: 'networkidle2' });

  await page.$eval('video', (e) => {
    let ele = e as HTMLVideoElement;
    return new Promise((resolve, reject) => {
      // 超时
      setTimeout(() => {
        reject(new Error('time out'));
      }, 30 * 1000);

      // 成功播放
      ele.addEventListener(
        'playing',
        () => {
          setTimeout(resolve, 3 * 1000);
        },
        { once: true },
      );

      // 播放结束
      ele.addEventListener(
        'ended',
        () => {
          setTimeout(() => {
            page.close();
          }, 3 * 1000);
        },
        { once: true },
      );

      ele.play();
      ele.muted = true;
    });
  });
}

async function retryPlayVideo(browser: Browser, url: string, options: Record<string, any>) {
  return promiseRetry((retry, number) => {
    console.log('attempt number', number);

    return playVideo(browser, url).catch(retry);
  }, options);
}

(async () => {
  console.log('启动浏览器中.....');
  const browser = await getBrowser();
  const page = await browser.newPage();

  const [username, password] = process.argv.slice(2);
  await login(username, password, page);
  const list = await getStudyPages(page);

  console.log('正在打开网页做任务~, 共有任务: ', list.length);
  for (const item of list) {
    await retryPlayVideo(browser, item, { retries: 3 });
  }

  console.log('执行中, 没有结束判断, 等半小时自己 ctrl+c 关闭吧');
})().catch(console.warn);
