import express = require('express');
import puppeteer = require('puppeteer');

const server = express();
const portNumber = 8080;

function defaultListener(request: express.Request, response: express.Response) {
  console.log('Hello World!');
  response.send('Hello World!');
}

server.get("/", defaultListener);

function recordListener(request: express.Request, response: express.Response) {
  console.log('Launch Chrome');
  (async() => {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    page.on('console', (c) => {
      console.log(`${c.type()}: ${c.text()}: ${c.args()}`);
    });

    await page.goto(`http://localhost:4200/`);
    await page.waitFor(500);

    await page.screenshot({path: 'Capture-01-initial.png', fullPage: true});

    await page.select('#room', 'test-room');
    await page.waitFor(500);
    await page.screenshot({path: 'Capture-02-select.png', fullPage: true});

    const join = await page.$('#join');
    if (join) {
      join.click();
    }
    await page.waitFor(500);
    await page.screenshot({path: 'Capture-03-join.png', fullPage: true});

    const record = await page.$('#record');
    if (record) {
      record.click();
    }
    await page.waitFor(500);
    await page.screenshot({path: 'Capture-04-record-start.png', fullPage: true});

    await page.waitFor(10000);
    if (record) {
      record.click();
    }
    await page.screenshot({path: 'Capture-05-record-stop.png', fullPage: true});

    await page.waitFor(10000);

    const download = await page.$('#download');
    if (download) {
      download.click();
    }
    await page.waitFor(500);
    await page.screenshot({path: 'Capture-06-download.png', fullPage: true});

    const exit = await page.$('#exit');
    if (exit) {
      exit.click();
    }
    await page.waitFor(500);
    await page.screenshot({path: 'Capture-07-exit.png', fullPage: true});

    console.log('Close Chrome');
    await browser.close();
    response.send('Launch Chrome');
  })();
}

server.get("/record", recordListener);

server.listen(portNumber, () => {
  console.log(`Listening on localhost:${ portNumber }`);
});
