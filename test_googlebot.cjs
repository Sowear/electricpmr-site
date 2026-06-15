const puppeteer = require('puppeteer');

(async () => {
  try {
    const browser = await puppeteer.launch({ headless: 'new' });
    const page = await browser.newPage();
    
    // Set Googlebot user agent
    await page.setUserAgent('Mozilla/5.0 (Linux; Android 6.0.1; Nexus 5X Build/MMB29P) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.6261.94 Mobile Safari/537.36 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)');
    
    page.on('console', msg => {
      if (msg.type() === 'error' || msg.type() === 'warning') {
        console.log('PAGE LOG:', msg.text());
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
