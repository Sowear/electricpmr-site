const fs = require('fs');
const path = require('path');

const pagesDir = path.join(process.cwd(), 'src/pages');
const files = fs.readdirSync(pagesDir).filter(f => f.endsWith('.astro'));

for (const file of files) {
  const filePath = path.join(pagesDir, file);
  let content = fs.readFileSync(filePath, 'utf8');

  // Match nested paths like @/pages/services/ComponentName or @/pages/Index
  const match = content.match(/import PageComponent from '@\/pages\/([a-zA-Z0-9_\/]+)';/);
  if (match) {
    const importPath = match[1]; 
    
    // Replace the import
    content = content.replace(/import PageComponent from '@\/pages\/[a-zA-Z0-9_\/]+';\n/, '');
    
    // Replace the component usage
    content = content.replace(/<PageWrapper Component=\{PageComponent\} client:load \/>/, `<PageWrapper pagePath="${importPath}" client:load />`);
    
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('Fixed', file, 'using', importPath);
  }
}
