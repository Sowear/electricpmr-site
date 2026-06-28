import type { ElectricalPointType } from "../types/electrical"

export interface LibraryItem {
  id: string
  nameRu: string
  description: string
  icon: string
  category: string
  tags: string[]
  defaultParams: {
    type: ElectricalPointType
    mountingHeight: number
    power?: number
    ip?: string
  }
}

export interface LibraryCategory {
  id: string
  nameRu: string
  icon: string
}

export const LIBRARY_CATEGORIES: LibraryCategory[] = [
  { id: "outlets", nameRu: "Розетки", icon: "plug" },
  { id: "switches", nameRu: "Выключатели", icon: "switch" },
  { id: "lighting", nameRu: "Свет", icon: "light" },
  { id: "sensors", nameRu: "Датчики", icon: "sensor" },
  { id: "panels", nameRu: "Щиты", icon: "panel" },
  { id: "appliances", nameRu: "Нагрузки", icon: "load" },
]

const LIBRARY_ITEMS: LibraryItem[] = [
  {
    id: "outlet_standard",
    nameRu: "Розетка 220 В",
    description: "Одинарная розетка для общих групп",
    icon: "Р",
    category: "outlets",
    tags: ["розетка", "220", "socket", "outlet"],
    defaultParams: { type: "outlet", mountingHeight: 300, power: 500 },
  },
  {
    id: "outlet_waterproof",
    nameRu: "Розетка IP44",
    description: "Влагозащищенная розетка для ванной, кухни или улицы",
    icon: "IP",
    category: "outlets",
    tags: ["розетка", "ip44", "влага", "ванная"],
    defaultParams: { type: "outlet_waterproof", mountingHeight: 600, power: 700, ip: "IP44" },
  },
  {
    id: "outlet_triple",
    nameRu: "Тройная розетка",
    description: "Блок из трех розеток в одной зоне",
    icon: "3Р",
    category: "outlets",
    tags: ["розетка", "тройная", "блок"],
    defaultParams: { type: "outlet_triple", mountingHeight: 300, power: 1500 },
  },
  {
    id: "switch_standard",
    nameRu: "Выключатель",
    description: "Одноклавишный выключатель освещения",
    icon: "В",
    category: "switches",
    tags: ["выключатель", "switch", "свет"],
    defaultParams: { type: "switch", mountingHeight: 900 },
  },
  {
    id: "switch_pass_through",
    nameRu: "Проходной выключатель",
    description: "Управление светом из двух точек",
    icon: "ПВ",
    category: "switches",
    tags: ["проходной", "выключатель", "лестница", "коридор"],
    defaultParams: { type: "switch_pass_through", mountingHeight: 900 },
  },
  {
    id: "switch_dimmer",
    nameRu: "Диммер",
    description: "Регулировка яркости освещения",
    icon: "Д",
    category: "switches",
    tags: ["диммер", "яркость", "регулятор"],
    defaultParams: { type: "dimmer", mountingHeight: 900 },
  },
  {
    id: "light_ceiling",
    nameRu: "Потолочный светильник",
    description: "Основная точка освещения помещения",
    icon: "Л",
    category: "lighting",
    tags: ["свет", "люстра", "потолок", "lighting"],
    defaultParams: { type: "light_ceiling", mountingHeight: 2700, power: 120 },
  },
  {
    id: "light_wall",
    nameRu: "Бра",
    description: "Настенный светильник",
    icon: "Б",
    category: "lighting",
    tags: ["бра", "свет", "настенный"],
    defaultParams: { type: "light_wall", mountingHeight: 1800, power: 60 },
  },
  {
    id: "light_spot",
    nameRu: "Точечный светильник",
    description: "Встраиваемый потолочный светильник",
    icon: "Т",
    category: "lighting",
    tags: ["спот", "точечный", "свет"],
    defaultParams: { type: "light_spot", mountingHeight: 2700, power: 12 },
  },
  {
    id: "sensor_motion",
    nameRu: "Датчик движения",
    description: "Автоматическое включение света по движению",
    icon: "ДД",
    category: "sensors",
    tags: ["датчик", "движение", "сенсор"],
    defaultParams: { type: "sensor_motion", mountingHeight: 2200 },
  },
  {
    id: "sensor_smoke",
    nameRu: "Датчик дыма",
    description: "Пожарное извещение",
    icon: "ДМ",
    category: "sensors",
    tags: ["датчик", "дым", "пожар"],
    defaultParams: { type: "sensor_smoke", mountingHeight: 2700 },
  },
  {
    id: "sensor_leak",
    nameRu: "Датчик протечки",
    description: "Контроль протечки воды",
    icon: "ДП",
    category: "sensors",
    tags: ["датчик", "протечка", "вода"],
    defaultParams: { type: "sensor_leak", mountingHeight: 50 },
  },
  {
    id: "panel_standard",
    nameRu: "Распределительный щит",
    description: "Вводной или квартирный щит",
    icon: "Щ",
    category: "panels",
    tags: ["щит", "автоматы", "panel"],
    defaultParams: { type: "panel", mountingHeight: 1500 },
  },
  {
    id: "junction_box",
    nameRu: "Распределительная коробка",
    description: "Коробка соединений и ответвлений",
    icon: "К",
    category: "panels",
    tags: ["коробка", "распайка", "junction"],
    defaultParams: { type: "junction_box", mountingHeight: 2400 },
  },
  {
    id: "appliance_stove",
    nameRu: "Электроплита",
    description: "Силовая линия кухни",
    icon: "П",
    category: "appliances",
    tags: ["плита", "кухня", "силовая"],
    defaultParams: { type: "appliance_stove", mountingHeight: 300, power: 7000 },
  },
  {
    id: "appliance_boiler",
    nameRu: "Бойлер",
    description: "Накопительный водонагреватель",
    icon: "БЛ",
    category: "appliances",
    tags: ["бойлер", "ванная", "водонагреватель"],
    defaultParams: { type: "appliance_boiler", mountingHeight: 1500, power: 2000 },
  },
  {
    id: "appliance_washer",
    nameRu: "Стиральная машина",
    description: "Отдельная нагрузка с защитой УЗО",
    icon: "СМ",
    category: "appliances",
    tags: ["стиральная", "машина", "ванная"],
    defaultParams: { type: "appliance_washing_machine", mountingHeight: 300, power: 2200 },
  },
]

export function searchLibrary(query: string): LibraryItem[] {
  const q = query.toLowerCase().trim()
  if (!q) return LIBRARY_ITEMS

  return LIBRARY_ITEMS.filter(item =>
    item.nameRu.toLowerCase().includes(q) ||
    item.description.toLowerCase().includes(q) ||
    item.category.toLowerCase().includes(q) ||
    item.tags.some(tag => tag.toLowerCase().includes(q))
  )
}

export function getLibraryByCategory(category: string): LibraryItem[] {
  return LIBRARY_ITEMS.filter(item => item.category === category)
}
