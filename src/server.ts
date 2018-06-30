import express = require('express');
import puppeteer = require('puppeteer');

const server = express();
const portNumber = 8080;

function defaultListener(request: express.Request, response: express.Response) {
  console.log('Hello World!');
  response.send('Hello World!');
}

server.get("/", defaultListener);

function runListener(request: express.Request, response: express.Response) {
  console.log('Launch Chrome');
  (async() => {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.goto(`http://localhost:${portNumber}/`);
    console.log('Close Chrome');
    await browser.close();
    response.send('Launch Chrome');
  })();
}

server.get("/run", runListener);

server.listen(portNumber, () => {
  console.log(`Listening on localhost:${ portNumber }`);
});
