import express = require('express');
import puppeteer = require('puppeteer');

/*
declare class puppeteer {
  dePage {
  _client: any;
};
*/

const server = express();
const portNumber = 8080;

function defaultListener(request: express.Request, response: express.Response) {
  console.log('Hello World!');
  response.send('Hello World!');
}

server.get("/", defaultListener);

function recordListener(request: express.Request, response: express.Response) {
  console.log('Launch Chrome');
  response.write(`Launch Chrome`);
  (async() => {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page._client.send('Page.setDownloadBehavior', { behavior: 'allow', downloadPath: './' });

    page.on('console', (c) => {
      console.log(`${c.type()}: ${c.text()}: ${c.args()}`);
    });

    await page.goto(`http://localhost:4200/`);

    const recordOnly = await page.$('#record-only');
    if (recordOnly) {
      recordOnly.click();
    }
    await page.screenshot({path: 'capture-01-initial.png', fullPage: true});
    response.write(`initial`);

    await page.select('#room', 'test-room');
    await page.screenshot({path: 'capture-02-select.png', fullPage: true});
    response.write(`select`);

    const join = await page.$('#join');
    if (join) {
      join.click();
    }
    await page.screenshot({path: 'capture-03-join.png', fullPage: true});
    response.write(`join`);

    const record = await page.$('#record');
    if (record) {
      record.click();
    }
    await page.screenshot({path: 'capture-04-record-start.png', fullPage: true});
    response.write(`record-start`);

    await page.waitFor(5000);
    if (record) {
      record.click();
    }
    await page.screenshot({path: 'capture-05-record-stop.png', fullPage: true});
    response.write(`record-stop`);

    await page.waitFor('#download');

    const download = await page.$('#download');
    if (download) {
      download.click();
    }
    await page.screenshot({path: 'capture-06-download.png', fullPage: true});
    response.write(`download`);

    const exit = await page.$('#exit');
    if (exit) {
      exit.click();
    }
    await page.screenshot({path: 'capture-07-exit.png', fullPage: true});
    response.write(`exit`);

    await browser.close();
    console.log('Close Chrome');
    response.write(`Close Chrome`);
    response.end();
  })();
}

server.get("/record", recordListener);

server.listen(portNumber, () => {
  console.log(`Listening on localhost:${ portNumber }`);
});
