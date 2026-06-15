const fs = require('fs');
const path = require('path');

const keywords = ['window\\.', 'document\\.', 'localStorage', 'sessionStorage', 'navigator\\.', 'Date\\.now', 'Math\\.random', 'new Date', 'crypto\\.randomUUID', 'useId', 'useLayoutEffect', 'window\\.innerWidth', 'window\\.matchMedia'];
const regex = new RegExp('(' + keywords.join('|') + ')', 'gi');

function walk(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      walk(filePath);
    } else if (filePath.endsWith('.tsx') || filePath.endsWith('.ts') || filePath.endsWith('.jsx') || filePath.endsWith('.js')) {
      const content = fs.readFileSync(filePath, 'utf8');
      const lines = content.split('\n');
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].match(regex)) {
          console.log(`${filePath}:${i + 1}: ${lines[i].trim()}`);
        }
      }
    }
  }
}

walk(path.join(process.cwd(), 'src'));
