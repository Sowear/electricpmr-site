const puppeteer = require('puppeteer');

(async () => {
  try {
    const browser = await puppeteer.launch({ headless: 'new' });
    const page = await browser.newPage();
    
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log('PAGE ERROR:', msg.text());
      }
    });

    page.on('pageerror', err => {
      console.log('PAGE EXCEPTION:', err.toString());
    });

    console.log("Navigating to http://localhost:4321/uslugi");
    await page.goto('http://localhost:4321/uslugi', { waitUntil: 'networkidle0' });
    console.log("Navigation complete");
    
    await browser.close();
  } catch (err) {
    console.error("Script error:", err);
  }
})();
