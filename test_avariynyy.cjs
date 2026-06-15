const puppeteer = require('puppeteer');

(async () => {
  try {
    const browser = await puppeteer.launch({ headless: 'new' });
    const page = await browser.newPage();
    
    // Set viewport to a mobile size or something Googlebot-like if we want,
    // but just standard is fine first
    
    let mismatchFound = false;

    page.on('console', msg => {
      const text = msg.text();
      // React logs hydration mismatches as errors or warnings
      if (msg.type() === 'error' || msg.type() === 'warning') {
        console.log(`[${msg.type().toUpperCase()}]`, text);
        if (text.includes('Hydration') || text.includes('did not match') || text.includes('mismatch')) {
          mismatchFound = true;
        }
      }
    });

    page.on('pageerror', err => {
      console.log('PAGE EXCEPTION:', err.toString());
    });

    console.log("Navigating to http://localhost:4321/avariynyy-elektrik");
    await page.goto('http://localhost:4321/avariynyy-elektrik', { waitUntil: 'networkidle0' });
    console.log("Navigation complete");
    
    await browser.close();
  } catch (err) {
    console.error("Script error:", err);
  }
})();
