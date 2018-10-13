import express = require('express');
import puppeteer = require('puppeteer');

const server = express();
const portNumber = process.env.PORT || 8080;

function defaultListener(request: express.Request, response: express.Response) {
  console.log('Hello World!');
  response.send('Hello World!');
}

server.get("/", defaultListener);

function recordListener(request: express.Request, response: express.Response, url: string, local = false) {
  const l = new Logger(response);
  let browser: puppeteer.Browser | null = null;
  (async() => {
    try {
      await header(response);
      await l.log('Launch Chrome', false);
      browser = await puppeteer.launch({
        args: ['--no-sandbox']
      });
      const page = await browser.newPage();
      await page.setViewport({ width: 400, height: 300 });
      l.page = page;
      const pageAsAny = page as any;
      await pageAsAny._client.send('Page.setDownloadBehavior', { behavior: 'allow', downloadPath: './' });

      page.on('console', async(c) => {
        await l.log(`${c.type()}: ${c.text()}: ${c.args()}`);
      });

      await page.goto(url);
      await page.waitFor(1000);

      const recordOnly = await page.$('#record-only');
      if (recordOnly) {
        await recordOnly.click();
      }
      await l.log('Initial', true);

      await page.select('#room', 'test-room');
      await l.log('Select', true);

      const join = await page.$('#join');
      if (join) {
        await join.click();
      }
      await l.log('Join', true);

      const record = await page.$('#record');
      if (record) {
        await record.click();
      }
      await l.log('Record Start', true);

      await page.waitFor(60000);
      if (record) {
        await record.click();
      }
      await l.log('Record Stop', true);


      if (local) {
        await page.waitFor('#download');
        const download = await page.$('#download');
        if (download) {
          await download.click();
        }
        await l.log('Download', true);  
      }

      await page.waitFor('#remote-download');   
      const remoteDownload = await page.$('#remote-download');
      const remoteDownloadHref = await page.evaluate(remoteDownload => remoteDownload.href, remoteDownload);
      if (remoteDownloadHref) {
        await l.log('Remote Downlaod', true);
        await response.write(`<h2><a href="${remoteDownloadHref}" target="_blank">Download from Firebase Storage</a></h2>`);
      }

      const exit = await page.$('#exit');
      if (exit) {
        await exit.click();
      }
      await l.log('Exit', true);

      await l.log('Close Chrome', false);
    } catch(e) {
      l.error(e);
      if (e.stack) {
        l.error(e.stack);
      }
    } finally {
      if (browser) {
        await browser.close();
      }
      await footer(response);
      await response.end();
    }
  })();
}

class Logger {
  private startTime = Date.now();
  private count = 0;
  page: any;

  constructor(private response: express.Response) { }

  async log(message: string, capture = false) {
    console.log(message);
    let style = 'font-weight: bold;';
    if (! capture) {
      style = 'font-weight: lighter; font-family: monospace;';
    }
    await this.response.write(`<p><span>${(Date.now() - this.startTime) / 1000}:</span> <span style="${style}">${message}</span></p>`);
    if (capture && this.page && ! this.page.isClosed() ) {
      const img = await this.page.screenshot({encoding: 'base64', fullPage: true});
      await this.response.write(`<img src="data:image/png;base64,${img}">`);
    }
  }
  async error(message: any) {
    console.error(message);
    const style = 'font-weight: lighter; font-family: monospace; color: red;';
    await this.response.write(`<p><span>${(Date.now() - this.startTime) / 1000}:</span> <span style="${style}">${message}</span></p>`);
  }
}

async function header(response: express.Response) {
  await response.writeHead(200, {'Content-Type': 'text/html'});
  await response.write('<!DOCTYPE html><html><head><title>Test</title></head><body style="font-size: small;">');
}

async function footer(response: express.Response) {
  await response.write('</body></html>');
}

function testRecordListener(request: express.Request, response: express.Response) {
  return recordListener(request, response, 'http://localhost:4200/', true);
}
function productionRecordListener(request: express.Request, response: express.Response) {
  return recordListener(request, response, 'https://chrome-recording-208807.firebaseapp.com/');
}

server.get("/record-test", testRecordListener);

server.get("/record", productionRecordListener);

server.listen(portNumber, () => {
  console.log(`Listening on localhost:${ portNumber }`);
});
