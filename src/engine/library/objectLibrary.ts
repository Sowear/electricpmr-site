// ============================================================
// ElectricPMR — Object Library (каталог объектов)
// ============================================================
//
// AI не создаёт объекты вручную. Он выбирает из библиотеки.
// ============================================================

import type { ElectricalPointType } from "../types/electrical"
import type { RoomType, WallMaterial } from "../types/geometry"

// ============================================================
// ТИПЫ ЭЛЕМЕНТОВ БИБЛИОТЕКИ
// ============================================================

export interface LibraryItem {
  id: string
  type: "electrical_point" | "wall_material" | "room_type" | "breaker" | "rcd" | "cable" | "panel"
  name: string
  nameRu: string
  description: string
  icon: string                      // Unicode/emoji
  category: string
  subcategory?: string
  defaultParams: Record<string, unknown>
  physical: {
    width: number                   // мм
    height: number                  // мм
    depth?: number                  // мм
    mountingHeight?: number         // мм
  }
  tags: string[]
}

// ============================================================
// ЭЛЕКТРИЧЕСКИЕ ТОЧКИ
// ============================================================

const ELECTRICAL_POINTS: LibraryItem[] = [
  // --- Розетки ---
  {
    id: "lib_outlet_single",
    type: "electrical_point",
    name: "Outlet",
    nameRu: "Розетка",
    description: "Одинарная розетка 220В",
    icon: "🔌",
    category: "outlets",
    subcategory: "standard",
    defaultParams: { type: "outlet", mountingHeight: 300 },
    physical: { width: 72, height: 72, depth: 32, mountingHeight: 300 },
    tags: ["розетка", "outlet", "220", "socket"],
  },
  {
    id: "lib_outlet_double",
    type: "electrical_point",
    name: "Double Outlet",
    nameRu: "Двойная розетка",
    description: "Двойная розетка 220В",
    icon: "🔌🔌",
    category: "outlets",
    subcategory: "standard",
    defaultParams: { type: "outlet", mountingHeight: 300 },
    physical: { width: 144, height: 72, depth: 32, mountingHeight: 300 },
    tags: ["розетка", "двойная", "outlet", "double"],
  },
  {
    id: "lib_outlet_triple",
    type: "electrical_point",
    name: "Triple Outlet",
    nameRu: "Тройная розетка",
    description: "Тройная розетка 220В",
    icon: "🔌🔌🔌",
    category: "outlets",
    subcategory: "standard",
    defaultParams: { type: "outlet_triple", mountingHeight: 300 },
    physical: { width: 216, height: 72, depth: 32, mountingHeight: 300 },
    tags: ["розетка", "тройная", "outlet", "triple"],
  },
  {
    id: "lib_outlet_waterproof",
    type: "electrical_point",
    name: "Waterproof Outlet",
    nameRu: "Розетка IP44",
    description: "Розетка с защитой IP44 для ванных",
    icon: "💧",
    category: "outlets",
    subcategory: "waterproof",
    defaultParams: { type: "outlet_waterproof", mountingHeight: 600 },
    physical: { width: 80, height: 80, depth: 40, mountingHeight: 600 },
    tags: ["розетка", "влагозащита", "ip44", "ванная", "waterproof"],
  },

  // --- Выключатели ---
  {
    id: "lib_switch_single",
    type: "electrical_point",
    name: "Switch",
    nameRu: "Выключатель",
    description: "Одноклавишный выключатель",
    icon: "🔘",
    category: "switches",
    subcategory: "single",
    defaultParams: { type: "switch", mountingHeight: 900 },
    physical: { width: 72, height: 72, depth: 32, mountingHeight: 900 },
    tags: ["выключатель", "switch", "одноклавишный"],
  },
  {
    id: "lib_switch_double",
    type: "electrical_point",
    name: "Double Switch",
    nameRu: "Двухклавишный выключатель",
    description: "Двухклавишный выключатель",
    icon: "🔘🔘",
    category: "switches",
    subcategory: "double",
    defaultParams: { type: "switch", mountingHeight: 900 },
    physical: { width: 72, height: 72, depth: 32, mountingHeight: 900 },
    tags: ["выключатель", "двухклавишный", "switch", "double"],
  },
  {
    id: "lib_switch_pass_through",
    type: "electrical_point",
    name: "Pass-through Switch",
    nameRu: "Проходной выключатель",
    description: "Проходной выключатель (переключатель)",
    icon: "🔀",
    category: "switches",
    subcategory: "pass_through",
    defaultParams: { type: "switch_pass_through", mountingHeight: 900 },
    physical: { width: 72, height: 72, depth: 32, mountingHeight: 900 },
    tags: ["выключатель", "проходной", "переключатель", "pass-through"],
  },
  {
    id: "lib_dimmer",
    type: "electrical_point",
    name: "Dimmer",
    nameRu: "Диммер",
    description: "Регулятор яркости",
    icon: "🎛️",
    category: "switches",
    subcategory: "dimmer",
    defaultParams: { type: "dimmer", mountingHeight: 900 },
    physical: { width: 72, height: 72, depth: 32, mountingHeight: 900 },
    tags: ["диммер", "регулятор", "яркость", "dimmer"],
  },

  // --- Светильники ---
  {
    id: "lib_light_ceiling",
    type: "electrical_point",
    name: "Ceiling Light",
    nameRu: "Потолочный светильник",
    description: "Потолочный светильник",
    icon: "💡",
    category: "lighting",
    subcategory: "ceiling",
    defaultParams: { type: "light_ceiling", mountingHeight: 2700 },
    physical: { width: 300, height: 300, depth: 50, mountingHeight: 2700 },
    tags: ["светильник", "потолочный", "light", "ceiling"],
  },
  {
    id: "lib_light_wall",
    type: "electrical_point",
    name: "Wall Sconce",
    nameRu: "Бра",
    description: "Настенный светильник",
    icon: "🏮",
    category: "lighting",
    subcategory: "wall",
    defaultParams: { type: "light_wall", mountingHeight: 1500 },
    physical: { width: 200, height: 150, depth: 100, mountingHeight: 1500 },
    tags: ["светильник", "настенный", "бра", "wall", "sconce"],
  },
  {
    id: "lib_light_spot",
    type: "electrical_point",
    name: "Spot Light",
    nameRu: "Точечный светильник",
    description: "Точечный светильник (спот)",
    icon: "🔦",
    category: "lighting",
    subcategory: "spot",
    defaultParams: { type: "light_spot", mountingHeight: 2700 },
    physical: { width: 80, height: 80, depth: 40, mountingHeight: 2700 },
    tags: ["светильник", "точечный", "спот", "spot"],
  },
  {
    id: "lib_light_strip",
    type: "electrical_point",
    name: "LED Strip",
    nameRu: "Светодиодная лента",
    description: "Светодиодная лента (1м)",
    icon: "✨",
    category: "lighting",
    subcategory: "strip",
    defaultParams: { type: "light_strip", mountingHeight: 2700 },
    physical: { width: 1000, height: 10, depth: 10, mountingHeight: 2700 },
    tags: ["лента", "светодиодная", "led", "strip"],
  },

  // --- Датчики ---
  {
    id: "lib_sensor_motion",
    type: "electrical_point",
    name: "Motion Sensor",
    nameRu: "Датчик движения",
    description: "Датчик движения",
    icon: "📡",
    category: "sensors",
    subcategory: "motion",
    defaultParams: { type: "sensor_motion", mountingHeight: 2400 },
    physical: { width: 80, height: 80, depth: 40, mountingHeight: 2400 },
    tags: ["датчик", "движения", "motion", "sensor"],
  },
  {
    id: "lib_sensor_smoke",
    type: "electrical_point",
    name: "Smoke Detector",
    nameRu: "Датчик дыма",
    description: "Извещатель дымовой",
    icon: "🔥",
    category: "sensors",
    subcategory: "smoke",
    defaultParams: { type: "sensor_smoke", mountingHeight: 2400 },
    physical: { width: 100, height: 100, depth: 40, mountingHeight: 2400 },
    tags: ["датчик", "дыма", "пожарный", "smoke", "detector"],
  },
  {
    id: "lib_sensor_leak",
    type: "electrical_point",
    name: "Leak Sensor",
    nameRu: "Датчик протечки",
    description: "Датчик протечки воды",
    icon: "💧",
    category: "sensors",
    subcategory: "leak",
    defaultParams: { type: "sensor_leak", mountingHeight: 50 },
    physical: { width: 50, height: 50, depth: 20, mountingHeight: 50 },
    tags: ["датчик", "протечки", "вода", "leak"],
  },

  // --- Щиты и коробки ---
  {
    id: "lib_panel",
    type: "electrical_point",
    name: "Electrical Panel",
    nameRu: "Электрощит",
    description: "Вводно-распределительный щит",
    icon: "⚡",
    category: "panels",
    subcategory: "main",
    defaultParams: { type: "panel", mountingHeight: 1500 },
    physical: { width: 400, height: 600, depth: 120, mountingHeight: 1500 },
    tags: ["щит", "распределительный", "panel", "board"],
  },
  {
    id: "lib_junction_box",
    type: "electrical_point",
    name: "Junction Box",
    nameRu: "Распределительная коробка",
    description: "Распределительная коробка",
    icon: "📦",
    category: "panels",
    subcategory: "junction",
    defaultParams: { type: "junction_box", mountingHeight: 2400 },
    physical: { width: 100, height: 100, depth: 50, mountingHeight: 2400 },
    tags: ["коробка", "распределительная", "junction", "box"],
  },

  // --- Бытовая техника ---
  {
    id: "lib_appliance_stove",
    type: "electrical_point",
    name: "Electric Stove",
    nameRu: "Электроплита",
    description: "Электрическая плита/духовка",
    icon: "🍳",
    category: "appliances",
    subcategory: "kitchen",
    defaultParams: { type: "appliance_stove", mountingHeight: 300 },
    physical: { width: 600, height: 600, depth: 600, mountingHeight: 300 },
    tags: ["плита", "электрическая", "духовка", "stove", "oven"],
  },
  {
    id: "lib_appliance_boiler",
    type: "electrical_point",
    name: "Boiler",
    nameRu: "Бойлер",
    description: "Накопительный водонагреватель",
    icon: "🌡️",
    category: "appliances",
    subcategory: "water",
    defaultParams: { type: "appliance_boiler", mountingHeight: 1500 },
    physical: { width: 400, height: 800, depth: 300, mountingHeight: 1500 },
    tags: ["бойлер", "водонагреватель", "boiler", "water_heater"],
  },
  {
    id: "lib_appliance_ac",
    type: "electrical_point",
    name: "Air Conditioner",
    nameRu: "Кондиционер",
    description: "Сплит-система",
    icon: "❄️",
    category: "appliances",
    subcategory: "climate",
    defaultParams: { type: "appliance_ac", mountingHeight: 2400 },
    physical: { width: 800, height: 300, depth: 200, mountingHeight: 2400 },
    tags: ["кондиционер", "сплит", "климат", "ac", "conditioner"],
  },
  {
    id: "lib_appliance_washing_machine",
    type: "electrical_point",
    name: "Washing Machine",
    nameRu: "Стиральная машина",
    description: "Стиральная машина-автомат",
    icon: "🫧",
    category: "appliances",
    subcategory: "laundry",
    defaultParams: { type: "appliance_washing_machine", mountingHeight: 300 },
    physical: { width: 600, height: 850, depth: 600, mountingHeight: 300 },
    tags: ["стиральная", "машина", "washing", "machine"],
  },
  {
    id: "lib_appliance_floor_heating",
    type: "electrical_point",
    name: "Floor Heating",
    nameRu: "Тёплый пол",
    description: "Электрический тёплый пол",
    icon: "♨️",
    category: "appliances",
    subcategory: "heating",
    defaultParams: { type: "appliance_floor_heating", mountingHeight: 0 },
    physical: { width: 1000, height: 1000, depth: 10, mountingHeight: 0 },
    tags: ["тёплый", "пол", "отопление", "floor", "heating"],
  },
]

// ============================================================
// МАТЕРИАЛЫ СТЕН
// ============================================================

const WALL_MATERIALS: LibraryItem[] = [
  { id: "mat_brick", type: "wall_material", name: "Brick", nameRu: "Кирпич", description: "Кирпичная кладка", icon: "🧱", category: "materials", defaultParams: { material: "brick", thickness: 380 }, physical: { width: 380, height: 0 }, tags: ["кирпич", "brick"] },
  { id: "mat_concrete", type: "wall_material", name: "Concrete", nameRu: "Бетон", description: "Железобетон", icon: "🏗️", category: "materials", defaultParams: { material: "concrete", thickness: 200 }, physical: { width: 200, height: 0 }, tags: ["бетон", "concrete"] },
  { id: "mat_drywall", type: "wall_material", name: "Drywall", nameRu: "Гипсокартон", description: "Гипсокартонная перегородка", icon: "📋", category: "materials", defaultParams: { material: "drywall", thickness: 120 }, physical: { width: 120, height: 0 }, tags: ["гипсокартон", "перегородка", "drywall"] },
  { id: "mat_wood", type: "wall_material", name: "Wood", nameRu: "Дерево", description: "Деревянная стена", icon: "🪵", category: "materials", defaultParams: { material: "wood", thickness: 150 }, physical: { width: 150, height: 0 }, tags: ["дерево", "wood", "брус"] },
]

// ============================================================
// ТИПЫ КОМНАТ
// ============================================================

const ROOM_TYPES: LibraryItem[] = [
  { id: "room_living", type: "room_type", name: "Living Room", nameRu: "Гостиная", description: "Гостиная / зал", icon: "🛋️", category: "rooms", defaultParams: { type: "living" }, physical: { width: 0, height: 0 }, tags: ["гостиная", "зал", "living"] },
  { id: "room_bedroom", type: "room_type", name: "Bedroom", nameRu: "Спальня", description: "Спальня", icon: "🛏️", category: "rooms", defaultParams: { type: "bedroom" }, physical: { width: 0, height: 0 }, tags: ["спальня", "bedroom"] },
  { id: "room_kitchen", type: "room_type", name: "Kitchen", nameRu: "Кухня", description: "Кухня", icon: "🍳", category: "rooms", defaultParams: { type: "kitchen" }, physical: { width: 0, height: 0 }, tags: ["кухня", "kitchen"] },
  { id: "room_bathroom", type: "room_type", name: "Bathroom", nameRu: "Ванная", description: "Ванная комната", icon: "🚿", category: "rooms", defaultParams: { type: "bathroom" }, physical: { width: 0, height: 0 }, tags: ["ванная", "туалет", "bathroom"] },
  { id: "room_hall", type: "room_type", name: "Hall", nameRu: "Прихожая", description: "Прихожая / коридор", icon: "🚪", category: "rooms", defaultParams: { type: "hall" }, physical: { width: 0, height: 0 }, tags: ["прихожая", "коридор", "hall"] },
  { id: "room_garage", type: "room_type", name: "Garage", nameRu: "Гараж", description: "Гараж", icon: "🚗", category: "rooms", defaultParams: { type: "garage" }, physical: { width: 0, height: 0 }, tags: ["гараж", "garage"] },
]

// ============================================================
// ВСЯ БИБЛИОТЕКА
// ============================================================

export const ObjectLibrary: LibraryItem[] = [
  ...ELECTRICAL_POINTS,
  ...WALL_MATERIALS,
  ...ROOM_TYPES,
]

// ============================================================
// ПОИСК ПО БИБЛИОТЕКЕ
// ============================================================

export function searchLibrary(query: string): LibraryItem[] {
  const q = query.toLowerCase().trim()
  if (!q) return ObjectLibrary

  return ObjectLibrary.filter(item => {
    return (
      item.name.toLowerCase().includes(q) ||
      item.nameRu.toLowerCase().includes(q) ||
      item.description.toLowerCase().includes(q) ||
      item.category.toLowerCase().includes(q) ||
      item.tags.some(tag => tag.includes(q))
    )
  })
}

// ============================================================
// ПОЛУЧИТЬ ПО КАТЕГОРИИ
// ============================================================

export function getLibraryByCategory(category: string): LibraryItem[] {
  return ObjectLibrary.filter(item => item.category === category)
}

// ============================================================
// ПОЛУЧИТЬ ПО ID
// ============================================================

export function getLibraryItem(id: string): LibraryItem | undefined {
  return ObjectLibrary.find(item => item.id === id)
}

// ============================================================
// КАТЕГОРИИ
// ============================================================

export const LIBRARY_CATEGORIES = [
  { id: "outlets", nameRu: "Розетки", icon: "🔌" },
  { id: "switches", nameRu: "Выключатели", icon: "🔘" },
  { id: "lighting", nameRu: "Освещение", icon: "💡" },
  { id: "sensors", nameRu: "Датчики", icon: "📡" },
  { id: "panels", nameRu: "Щиты и коробки", icon: "⚡" },
  { id: "appliances", nameRu: "Бытовая техника", icon: "🏠" },
  { id: "materials", nameRu: "Материалы стен", icon: "🧱" },
  { id: "rooms", nameRu: "Типы комнат", icon: "🏡" },
] as const
