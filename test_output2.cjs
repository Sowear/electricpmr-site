const fs = require('fs');
const html = fs.readFileSync('dist/uslugi/index.html', 'utf8');

const regex = /<a[^>]*>Услуги<\/a>/g;
const match = regex.exec(html);
if (match) {
  console.log("Found Услуги link:", match[0]);
}

const mainRegex = /<a[^>]*>Главная<\/a>/g;
const mainMatch = mainRegex.exec(html);
if (mainMatch) {
  console.log("Found Главная link:", mainMatch[0]);
}

