const { join } = require('path');

/**
 * @type {import("puppeteer").Configuration}
 */
module.exports = {
  // Changes the cache location for Puppeteer to the local project directory
  // so Vercel can properly cache it and find Chrome during the build step.
  cacheDirectory: join(__dirname, '.cache', 'puppeteer'),
};
