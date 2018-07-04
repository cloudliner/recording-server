import express = require('express');
import puppeteer = require('puppeteer');

/*
declare var puppeteer.Page._client: any;
 */

const server = express();
const portNumber = 8080;

function defaultListener(request: express.Request, response: express.Response) {
  console.log('Hello World!');
  response.send('Hello World!');
}

server.get("/", defaultListener);

function recordListener(request: express.Request, response: express.Response) {
  const l = new Logger(response);
  (async() => {
    await l.log('Launch Chrome');
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    l.page = page;
    await page._client.send('Page.setDownloadBehavior', { behavior: 'allow', downloadPath: './' });

    page.on('console', (c) => {
      l.log(`${c.type()}: ${c.text()}: ${c.args()}`);
    });

    await page.goto(`http://localhost:4200/`);
    await page.waitFor(1000);

    const recordOnly = await page.$('#record-only');
    if (recordOnly) {
      recordOnly.click();
    }
    await l.log('initial', true);

    await page.select('#room', 'test-room');
    await l.log('select', true);

    const join = await page.$('#join');
    if (join) {
      join.click();
    }
    await l.log('join', true);

    const record = await page.$('#record');
    if (record) {
      record.click();
    }
    await l.log('record-start', true);

    await page.waitFor(5000);
    if (record) {
      record.click();
    }
    await l.log('record-stop', true);

    await page.waitFor('#download');

    const download = await page.$('#download');
    if (download) {
      download.click();
    }
    await l.log('download', true);

    const exit = await page.$('#exit');
    if (exit) {
      exit.click();
    }
    await l.log('exit', true);

    await browser.close();
    await l.log('Close Chrome');
    response.end();
  })();
}

class Logger {
  private startTime = Date.now();
  private count = 0;
  page: any;

  constructor(private response: express.Response) { }

  async log(message: string, capture = false) {
    this.response.write(`${(Date.now() - this.startTime) / 1000}: ${message}\n`);
    console.log(message);
    if (capture && this.page) {
      await this.page.screenshot({path: `capture-${++ this.count}-${message}.png`, fullPage: true});
    }
  }
}

server.get("/record", recordListener);

server.listen(portNumber, () => {
  console.log(`Listening on localhost:${ portNumber }`);
});
