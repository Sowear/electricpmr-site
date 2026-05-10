const fs = require('fs');
const path = require('path');

const rootDir = path.join(__dirname, '..', '..');
const rawPath = path.join(rootDir, 'raw_catalog.txt');
const outPath = path.join(rootDir, 'src', 'data', 'catalog.ts');

const raw = fs.readFileSync(rawPath, 'utf8');
const lines = raw.split('\n').map(l => l.trim()).filter(Boolean);

let currentCategoryStr = '';
const items = [];
let idCounter = 1;

for (const line of lines) {
  if (/^\d+\)/.test(line)) {
    currentCategoryStr = line.replace(/^\d+\)\s*/, '');
    continue;
  }
  
  if (line.includes('Вот это уже отдельный большой блок')) continue;

  let dbCategory = 'other';
  let unit = 'шт';

  const lower = line.toLowerCase();
  
  if (lower.includes('розет') || lower.includes('выключател') || lower.includes('диммер') || lower.includes('usb')) {
    dbCategory = 'sockets';
  } else if (lower.includes('освещ') || lower.includes('свет') || lower.includes('люстр') || lower.includes('бра') || lower.includes('led') || lower.includes('подсветк') || lower.includes('спот')) {
    dbCategory = 'lighting';
  } else if (lower.includes('кабел') || lower.includes('провод') || lower.includes('штроб') || lower.includes('трасс') || lower.includes('гофр') || lower.includes('пвх') || lower.includes('рукав') || lower.includes('интернет') || lower.includes('tv') || lower.includes('слаботоч') || lower.includes('сигнализац') || lower.includes('видеонаблюден') || lower.includes('коробк') || lower.includes('подрозетник') || lower.includes('линии')) {
    dbCategory = 'cable';
  } else if (lower.includes('щит') || lower.includes('автомат') || lower.includes('узо') || lower.includes('заземлен') || lower.includes('дин-рейк') || lower.includes('реле') || lower.includes('узип') || lower.includes('шина') || lower.includes('ввод') || lower.includes('счётчик')) {
    dbCategory = 'panels';
  } else if (lower.includes('уличн') || lower.includes('фасад') || lower.includes('транше') || lower.includes('гараж')) {
    dbCategory = 'outdoor';
  } else if (lower.includes('демонтаж') || lower.includes('сверление') || lower.includes('штробление') || lower.includes('пробивка') || lower.includes('очистка') || lower.includes('заделка') || lower.includes('уборка') || lower.includes('подключение') || lower.includes('умный дом') || lower.includes('выезд') || lower.includes('осмотр') || lower.includes('проверка') || lower.includes('диагностик') || lower.includes('составление') || lower.includes('разметка') || lower.includes('замер')) {
    dbCategory = 'additional';
  } else {
    dbCategory = 'other';
  }

  if (currentCategoryStr.includes('Щит') || currentCategoryStr.includes('Земля')) dbCategory = 'panels';
  if (currentCategoryStr.includes('Демонтаж')) dbCategory = 'additional';
  if (currentCategoryStr.includes('Освещение')) dbCategory = 'lighting';
  if (currentCategoryStr.includes('розеток')) dbCategory = 'sockets';

  if (lower.includes('штробление') || lower.includes('прокладка') || lower.includes('монтаж кабель-канала') || lower.includes('монтаж гофры') || lower.includes('монтаж трубы') || lower.includes('монтаж плинтуса') || lower.includes('монтаж коробов') || lower.includes('монтаж лотков')) {
    unit = 'м';
  } else if (lower.includes('проект') || lower.includes('схема') || lower.includes('осмотр') || lower.includes('выезд') || lower.includes('расчёт') || lower.includes('консультация') || lower.includes('акт') || lower.includes('уборка') || lower.includes('замер')) {
    unit = 'усл';
  }

  const safeName = line.replace(/"/g, '\\"');
  items.push({ 
    id: `cat-item-${idCounter++}`, 
    name: safeName, 
    dbCategory, 
    unit 
  });
}

// Generate TS file content
let tsContent = `import { LineItemPreset } from "@/types/estimator";

export const defaultCatalogItems: LineItemPreset[] = [
`;

for (const item of items) {
  tsContent += `  {
    id: "${item.id}",
    name: "${item.name}",
    item_type: "service",
    description: "${item.name}",
    unit: "${item.unit}",
    quantity: 1,
    unit_price: 0,
    base_price: 0,
    labor_hours: 0,
    labor_rate: 0,
    cost_price: 0,
    markup_pct: 0,
    category: "${item.dbCategory}",
    category_key: "${item.dbCategory}",
    tags: [],
    synonyms: [],
    keywords: [],
    complexity: "medium",
    popularity_score: 0,
    popular: false,
    calc_default: "piece",
    source: "custom",
    is_active: true
  },
`;
}

tsContent += `];
`;

fs.mkdirSync(path.join(rootDir, 'src', 'data'), { recursive: true });
fs.writeFileSync(outPath, tsContent);
console.log('Generated TS catalog file at ' + outPath);
