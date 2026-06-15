const fs = require('fs');
const html = fs.readFileSync('dist/uslugi/index.html', 'utf8');

const regex = /<a[^>]*href="\/uslugi"[^>]*>Услуги<\/a>/g;
const match = regex.exec(html);
if (match) {
  console.log("Found Услуги link:", match[0]);
}

const mainRegex = /<a[^>]*href="\/"[^>]*>Главная<\/a>/g;
const matchMain = mainRegex.exec(html);
if (matchMain) {
  console.log("Found Главная link:", matchMain[0]);
}

