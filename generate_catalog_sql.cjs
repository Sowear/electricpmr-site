const fs = require('fs');

const raw = fs.readFileSync('..\..\raw_catalog.txt', 'utf8');
const lines = raw.split('\n').map(l => l.trim()).filter(Boolean);

let currentCategoryStr = '';
const items = [];

for (const line of lines) {
  // Check if line is a category header like "1) Выезд на объект и подготовка"
  if (/^\d+\)/.test(line)) {
    currentCategoryStr = line.replace(/^\d+\)\s*/, '');
    continue;
  }
  
  // Skip "Вот это уже отдельный большой блок."
  if (line.includes('Вот это уже отдельный большой блок')) continue;

  let dbCategory = 'other';
  let unit = 'шт';

  const lower = line.toLowerCase();
  
  if (lower.includes('розет') || lower.includes('выключател') || lower.includes('диммер') || lower.includes('usb')) {
    dbCategory = 'sockets';
  } else if (lower.includes('освещ') || lower.includes('свет') || lower.includes('люстр') || lower.includes('бра') || lower.includes('led')) {
    dbCategory = 'lighting';
  } else if (lower.includes('кабел') || lower.includes('провод') || lower.includes('штроб') || lower.includes('трасс') || lower.includes('гофр') || lower.includes('пвх') || lower.includes('рукав') || lower.includes('интернет') || lower.includes('tv') || lower.includes('слаботоч') || lower.includes('сигнализац') || lower.includes('видеонаблюден') || lower.includes('коробк') || lower.includes('подрозетник')) {
    dbCategory = 'cable';
  } else if (lower.includes('щит') || lower.includes('автомат') || lower.includes('узо') || lower.includes('заземлен') || lower.includes('дин-рейк') || lower.includes('реле') || lower.includes('узип') || lower.includes('шина') || lower.includes('ввод')) {
    dbCategory = 'panels';
  } else if (lower.includes('уличн') || lower.includes('фасад') || lower.includes('транше') || lower.includes('гараж')) {
    dbCategory = 'outdoor';
  } else if (lower.includes('демонтаж') || lower.includes('сверление') || lower.includes('штробление') || lower.includes('пробивка') || lower.includes('очистка') || lower.includes('заделка') || lower.includes('уборка') || lower.includes('подключение') || lower.includes('умный дом') || lower.includes('выезд') || lower.includes('осмотр') || lower.includes('проверка') || lower.includes('диагностик') || lower.includes('составление') || lower.includes('разметка')) {
    dbCategory = 'additional';
  } else {
    dbCategory = 'other';
  }

  // Refine category based on currentCategoryStr
  if (currentCategoryStr.includes('Щит') || currentCategoryStr.includes('Земля')) dbCategory = 'panels';
  if (currentCategoryStr.includes('Демонтаж')) dbCategory = 'additional';
  if (currentCategoryStr.includes('Освещение')) dbCategory = 'lighting';
  if (currentCategoryStr.includes('Розеток')) dbCategory = 'sockets';

  if (lower.includes('штробление') || lower.includes('прокладка') || lower.includes('монтаж кабель-канала') || lower.includes('монтаж гофры') || lower.includes('монтаж трубы')) {
    unit = 'м';
  } else if (lower.includes('проект') || lower.includes('схема') || lower.includes('осмотр') || lower.includes('выезд') || lower.includes('расчёт') || lower.includes('консультация') || lower.includes('акт') || lower.includes('уборка')) {
    unit = 'усл';
  }

  // Escape single quotes
  const safeName = line.replace(/'/g, "''");
  
  items.push({ name: safeName, dbCategory, unit });
}

let sql = `-- Seed catalog items from user list\n`;
sql += `INSERT INTO public.catalog_items (name, category, unit, base_price, complexity, popularity_score) VALUES\n`;

const values = items.map(item => {
  return `  ('${item.name}', '${item.dbCategory}', '${item.unit}', 0, 'medium', 0)`;
});

sql += values.join(',\n') + ';\n';

fs.writeFileSync('..\..\supabase/migrations/20260511000000_seed_new_catalog_items.sql', sql);
console.log('Generated SQL migration file.');
