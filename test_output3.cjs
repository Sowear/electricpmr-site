const fs = require('fs');
const html = fs.readFileSync('dist/uslugi/index.html', 'utf8');

const navMatch = /<nav[^>]*>([\s\S]*?)<\/nav>/.exec(html);
if (navMatch) {
  console.log("Nav Content:\n", navMatch[1].substring(0, 500));
} else {
  console.log("No nav found");
}
