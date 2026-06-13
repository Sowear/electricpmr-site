const fs = require('fs');
const html = fs.readFileSync('dist/elektrik-v-tiraspole/index.html', 'utf-8');
const hasTitle = html.includes('<title>Электрик в Тирасполе: услуги и цены | ЭлектроМастер</title>');
const hasDesc = html.includes('Услуги электрика в Тирасполе. Замена проводки, установка розеток и выключателей, сборка электрощитов, поиск неисправностей и аварийный выезд по городу.');
const hasCanonical = html.includes('<link rel="canonical"');

console.log('Title OK?', hasTitle);
console.log('Desc OK?', hasDesc);
console.log('Canonical OK?', hasCanonical);
if (!hasTitle || !hasDesc || !hasCanonical) process.exit(1);
console.log('Validation passed!');
