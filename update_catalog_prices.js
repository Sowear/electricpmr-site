import fs from 'fs';

const mdPath = "C:/Users/mmxxn/Downloads/orientirovochnye_ceny_elektromontazh.md";
const lines = fs.readFileSync(mdPath, "utf-8").split("\n");

const updates = [];
for (const line of lines) {
  let nameMatch = line.match(/^- (.+?) — \*\*(.+?)\*\*/);
  if (nameMatch) {
    let name = nameMatch[1].trim();
    let priceStr = nameMatch[2];
    
    if (priceStr.includes('Договорная')) {
      updates.push({ name, contract: true });
    } else {
      let nums = priceStr.match(/\d[\d\s]*/g);
      if (nums && nums.length > 0) {
        let min = parseInt(nums[0].replace(/\s/g, ''));
        let max = nums.length > 1 ? parseInt(nums[1].replace(/\s/g, '')) : min;
        let base = Math.round((min + max) / 2);
        updates.push({ name, min, max, base });
      }
    }
  }
}

console.log(`Found ${updates.length} price updates from markdown.`);

let catalogTs = fs.readFileSync("../../src/data/catalog.ts", "utf-8");
let arrayStart = catalogTs.indexOf("[");
let arrayEnd = catalogTs.lastIndexOf("]");
let arrayString = catalogTs.substring(arrayStart, arrayEnd + 1);

let catalog;
try {
  catalog = eval("(" + arrayString + ")");
} catch (e) {
  console.error("Eval failed", e);
  process.exit(1);
}

let exactMatchCount = 0;
let partialMatchCount = 0;

for (const update of updates) {
  let exactMatch = catalog.find(item => item.name.toLowerCase() === update.name.toLowerCase());
  
  if (exactMatch) {
    exactMatchCount++;
    applyUpdate(exactMatch, update);
  } else {
    // Try to find a partial match
    let matches = catalog.filter(item => 
      item.name.toLowerCase().includes(update.name.toLowerCase()) ||
      update.name.toLowerCase().includes(item.name.toLowerCase())
    );
    
    matches.sort((a, b) => Math.abs(a.name.length - update.name.length) - Math.abs(b.name.length - update.name.length));
    
    if (matches.length > 0) {
      let bestMatch = matches[0];
      // Only apply if length diff is reasonable (avoiding too broad matches like "Демонтаж" -> "Демонтаж старого щита")
      if (Math.abs(bestMatch.name.length - update.name.length) < 20) {
        partialMatchCount++;
        applyUpdate(bestMatch, update);
        update.applied = true;
      }
    }
  }
}

let addedCount = 0;
let maxId = 0;
for (const item of catalog) {
  let idMatch = item.id.match(/^cat-item-(\d+)$/);
  if (idMatch) {
    let num = parseInt(idMatch[1], 10);
    if (num > maxId) maxId = num;
  }
}

for (const update of updates) {
  if (!update.applied) {
    maxId++;
    let newItem = {
      id: "cat-item-" + maxId,
      name: update.name,
      item_type: "service",
      description: update.name,
      unit: "усл",
      quantity: 1,
      unit_price: update.contract ? 0 : update.base,
      base_price: update.contract ? 0 : update.base,
      labor_hours: 0,
      labor_rate: 0,
      cost_price: 0,
      markup_pct: 0,
      category: "other",
      category_key: "other",
      tags: [],
      synonyms: [],
      keywords: [],
      complexity: "medium",
      popularity_score: 0,
      popular: false,
      calc_default: update.contract ? "contract" : "piece",
      source: "custom",
      is_active: true,
      market_min: update.contract ? 0 : update.min,
      market_max: update.contract ? 0 : update.max
    };
    catalog.push(newItem);
    addedCount++;
  }
}

function applyUpdate(item, update) {
  update.applied = true;
  if (update.contract) {
    item.calc_default = "contract";
    item.unit_price = 0;
    item.base_price = 0;
    item.market_min = 0;
    item.market_max = 0;
  } else {
    item.unit_price = update.base;
    item.base_price = update.base;
    item.market_min = update.min;
    item.market_max = update.max;
  }
}

console.log(`Successfully updated ${exactMatchCount} items exactly and ${partialMatchCount} partially. Added ${addedCount} new items.`);

const newCatalogContent = `import { LineItemPreset } from "@/types/estimator";

export const defaultCatalogItems: LineItemPreset[] = ${JSON.stringify(catalog, null, 2)};
`;

fs.writeFileSync("../../src/data/catalog.ts", newCatalogContent);
console.log("Wrote src/data/catalog.ts");
