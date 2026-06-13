const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3000;
const DIST_DIR = path.join(__dirname, 'dist');
const SITE_URL = "https://electricpmr.vercel.app";

const PUBLIC_ROUTES = [
  '/',
  '/uslugi',
  '/stoimost',
  '/contact',
  '/zamena-provodki',
  '/sborka-elektroshchita',
  '/avariynyy-elektrik',
  '/elektromontazh-v-kvartire',
  '/elektromontazh-v-dome',
  '/elektrik-v-tiraspole',
  '/elektrik-v-benderah',
  '/elektrik-v-slobodzee'
];

const SPA_ROUTES = [
  '/auth',
  '/dashboard',
  '/projects',
  '/estimator',
  '/admin',
  '/catalog'
];

// Helper to check if a path is an SPA route requiring rewrite to root index.html
function isSpaRoute(urlPath) {
  return SPA_ROUTES.some(route => 
    urlPath === route || urlPath.startsWith(route + '/')
  );
}

// Start a local server mimicking Vercel's cleanUrls: true and custom rewrites
const server = http.createServer((req, res) => {
  const parsedUrl = new URL(req.url, `http://localhost:${PORT}`);
  let pathname = parsedUrl.pathname;

  // Enforce trailingSlash: false (redirect if ends with slash, except root)
  if (pathname !== '/' && pathname.endsWith('/')) {
    pathname = pathname.slice(0, -1);
    res.writeHead(308, { 'Location': pathname });
    res.end();
    return;
  }

  // Check custom SPA rewrites
  if (isSpaRoute(pathname)) {
    const fileContent = fs.readFileSync(path.join(DIST_DIR, 'index.html'));
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(fileContent);
    return;
  }

  // Resolve static file paths
  let filePath = path.join(DIST_DIR, pathname);
  
  if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
    filePath = path.join(filePath, 'index.html');
  } else if (!fs.existsSync(filePath) && fs.existsSync(filePath + '.html')) {
    filePath = filePath + '.html';
  }

  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    const fileContent = fs.readFileSync(filePath);
    const contentType = filePath.endsWith('.xml') ? 'application/xml' : 'text/html; charset=utf-8';
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(fileContent);
  } else {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Not Found');
  }
});

// Run verification tests
server.listen(PORT, async () => {
  console.log(`Temp server listening on port ${PORT}`);
  let failed = false;

  for (const route of PUBLIC_ROUTES) {
    const cleanUrlPath = route;
    const indexUrlPath = route === '/' ? '/index.html' : `${route}/index.html`;

    console.log(`\nChecking route: ${route}`);

    try {
      const htmlClean = await fetchHtml(cleanUrlPath);
      const htmlIndex = await fetchHtml(indexUrlPath);

      // 1. Verify Identical Content
      if (htmlClean !== htmlIndex) {
        console.error(`❌ FAILURE: HTML for clean URL "${cleanUrlPath}" and index URL "${indexUrlPath}" are NOT identical!`);
        failed = true;
      } else {
        console.log(`✅ SUCCESS: Clean URL and index.html serve identical HTML.`);
      }

      // 2. Verify Canonical Tag
      const canonicalMatch = htmlClean.match(/<link\s+rel="canonical"\s+href="([^"]+)"\s*\/?>/i);
      const expectedCanonical = `${SITE_URL}${route === '/' ? '' : route}`;

      if (!canonicalMatch) {
        console.error(`❌ FAILURE: No canonical tag found on route ${route}`);
        failed = true;
      } else {
        const canonicalHref = canonicalMatch[1];
        if (canonicalHref !== expectedCanonical) {
          console.error(`❌ FAILURE: Canonical tag mismatch. Expected "${expectedCanonical}", found "${canonicalHref}"`);
          failed = true;
        } else {
          console.log(`✅ SUCCESS: Self-referencing canonical tag is correct: "${canonicalHref}"`);
        }
      }

      // 3. Verify exactly one canonical tag exists
      const allCanonicalTags = htmlClean.match(/<link\s+rel="canonical"/gi) || [];
      if (allCanonicalTags.length !== 1) {
        console.error(`❌ FAILURE: Expected exactly 1 canonical tag, found ${allCanonicalTags.length}`);
        failed = true;
      } else {
        console.log(`✅ SUCCESS: Exactly 1 canonical tag exists.`);
      }

      // 4. Verify title tag is present
      const titleMatch = htmlClean.match(/<title>([^<]+)<\/title>/i);
      if (!titleMatch) {
        console.error(`❌ FAILURE: No title tag found on route ${route}`);
        failed = true;
      } else {
        console.log(`✅ SUCCESS: Title tag is present: "${titleMatch[1]}"`);
      }

    } catch (err) {
      console.error(`❌ ERROR fetching route ${route}:`, err.message);
      failed = true;
    }
  }

  server.close(() => {
    console.log('\nVerification server closed.');
    if (failed) {
      console.error('\n❌ VERIFICATION FAILED! Please review the errors above.');
      process.exit(1);
    } else {
      console.log('\n🎉 ALL VERIFICATIONS PASSED SUCCESSFULLY!');
      process.exit(0);
    }
  });
});

function fetchHtml(urlPath) {
  return new Promise((resolve, reject) => {
    http.get(`http://localhost:${PORT}${urlPath}`, (res) => {
      if (res.statusCode !== 200) {
        reject(new Error(`Failed to fetch ${urlPath}: status code ${res.statusCode}`));
        return;
      }
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}
