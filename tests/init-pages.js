import fs from 'node:fs';
import path from 'node:path';
import { fork, execSync } from 'node:child_process';

import rimraf from 'rimraf';
import mkdirp from 'mkdirp';
import puppeteer from 'puppeteer';

let browser;
let page;

const appPath = path.join(process.cwd(), 'tests', 'init-pages');

console.log(`
----------------------------------------------------------------------------------------
----------------------------------------------------------------------------------------
>
> This test takes screenshots of a quite complete set of the possible launcher screens.
> Screenshots will be stored in the "tests/screenshots" directory.
>
----------------------------------------------------------------------------------------
----------------------------------------------------------------------------------------
`);

if (!fs.existsSync(path.join(appPath, 'node_modules'))) {
  console.log('> Installing deps');

  execSync('npm install', {
    cwd: appPath,
    stdio: 'inherit',
  });
}

console.log('> Building app');

execSync('npm run build', {
  cwd: appPath,
  stdio: 'inherit',
});

(async function() {
  browser = await puppeteer.launch();
  page = await browser.newPage();

  page.on('console', msg => console.log('PAGE LOG:', msg.text()));

  const appPath = path.join(process.cwd(), 'tests', 'init-pages');
  const serverIndex = path.join(appPath, '.build', 'server', 'index.js');
  const forked = fork(serverIndex, { cwd: appPath });

  forked.on('message', async msg => {
    console.log(msg);
    if (msg === 'soundworks:server:started') {
      await capturePlaformScreenshots();

      await browser.close();
      forked.kill();
    }
  });
}());

// test platform
async function capturePlaformScreenshots() {
  const screenshots = path.join(process.cwd(), 'tests', 'screenshots');

  rimraf.sync(screenshots);
  mkdirp.sync(screenshots);

  for (let orientation of ['portrait', 'landscape']) {
    await page.setViewport({
      width: orientation === 'landscape' ? 667 : 375,
      height: orientation === 'landscape' ? 375 : 667,
      deviceScaleFactor: 1,
      isMobile: false,
      hasTouch: false,
      isLandScape: orientation === 'landscape',
    });

    // ----------------------------------------------------
    // platform screens screenshots
    // ----------------------------------------------------
    for (let lang of ['en', 'fr']) {
      for (let testCase of ['platform-inited', 'platform-errored-1', 'platform-errored-2']) {

        const name = `${testCase}-${orientation}-${lang}`;
        console.log(`>> ${name}`);

        await page.goto(`http://127.0.0.1:8000?case=${testCase}&lang=${lang}`);
        await new Promise(resolve => setTimeout(resolve, 200));

        // activation error needs a click
        if (testCase === 'platform-errored-2') {
          const btn = await (await page.evaluateHandle(`document.querySelector('sw-launcher').shadowRoot.querySelector('sw-plugin-platform-init').shadowRoot.querySelector('div')`)).asElement();
          await btn.click();
          await new Promise(resolve => setTimeout(resolve, 100));
        }

        await page.screenshot({
          path: path.join(screenshots, `${name}.png`),
        });
      }
    }

    // ----------------------------------------------------
    // position screens screenshots
    // ----------------------------------------------------
    // for (let lang of ['en', 'fr']) {
    //   for (let testCase of ['position-default', 'position-xrange', 'position-yrange', 'position-background']) {
    //     const name = `${testCase}-${orientation}-${lang}`;
    //     console.log(`>> ${name}`);

    //     await page.goto(`http://127.0.0.1:8000?case=${testCase}&lang=${lang}`);
    //     await new Promise(resolve => setTimeout(resolve, 200));

    //     // take unclicked screenshot
    //     await page.screenshot({
    //       path: path.join(screenshots, `${name}-before-click.png`),
    //     });

    //     // should be goo in al cases
    //     page.mouse.move(375 / 2, 375 / 2);
    //     page.mouse.down();
    //     // take clicked screenshot
    //     // const btn = await (await page.evaluateHandle(`document.querySelector('sw-launcher').shadowRoot.querySelector('sw-plugin-position').shadowRoot.querySelector('div')`)).asElement();
    //     // await btn.click(`.has-listener`);

    //     await page.screenshot({
    //       path: path.join(screenshots, `${name}-clicked.png`),
    //     });
    //   }
    // }

    // ----------------------------------------------------
    // default screens screenshots
    // ----------------------------------------------------
    for (let lang of ['en', 'fr']) {
      for (let testCase of ['default-inited', 'default-errored', 'default-sync', 'default-audio-buffer-loader', 'default-checkin-errored']) {

        const name = `${testCase}-${orientation}-${lang}`;
        console.log(`>> ${name}`);

        await page.goto(`http://127.0.0.1:8000?case=${testCase}&lang=${lang}`);
        await new Promise(resolve => setTimeout(resolve, 200));

        await page.screenshot({
          path: path.join(screenshots, `${name}.png`),
        });
      }
    }
  }
}
