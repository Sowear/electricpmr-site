const fs = require('fs');
const path = require('path');

const pagesDir = path.join(process.cwd(), 'src', 'pages');
const files = fs.readdirSync(pagesDir).filter(f => f.endsWith('.astro'));

for (const file of files) {
  const filePath = path.join(pagesDir, file);
  let content = fs.readFileSync(filePath, 'utf8');
  
  if (content.includes('<PageWrapper') && !content.includes('currentPath={Astro.url.pathname}')) {
    content = content.replace(/<PageWrapper([\s\S]*?)client:(load|idle|visible|only)(.*?)\/>/g, '<PageWrapper$1currentPath={Astro.url.pathname} client:$2$3/>');
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('Updated ' + file);
  }
}
