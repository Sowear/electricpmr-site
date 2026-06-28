// ============================================================
// ElectricPMR — Domain Knowledge Base
// ============================================================
//
// Инженерная практика, а не нормативы.
// Типовые решения для разных помещений и сценариев.
// ============================================================

import type { UUID } from "../types/common"

// ============================================================
// KNOWLEDGE TYPES
// ============================================================

export interface RoomTemplate {
  id: string
  name: string
  nameRu: string
  typicalObjects: TemplateObject[]
  typicalCircuits: TemplateCircuit[]
  tips: string[]
}

export interface TemplateObject {
  type: string
  name: string
  count: number | { min: number; max: number }
  mountingHeight?: number
  notes?: string
}

export interface TemplateCircuit {
  name: string
  breakerRating: number
  cableSection: number
  load: number
  objects: string[] // типы объектов
  notes?: string
}

export interface DesignPattern {
  id: string
  name: string
  nameRu: string
  description: string
 适用于: string[] // типы помещений
  objects: TemplateObject[]
  circuits: TemplateCircuit[]
  panel: {
    maxModules: number
    mainBreaker: number
    rcdRequired: boolean
  }
}

// ============================================================
// ROOM KNOWLEDGE BASE
// ============================================================

export const ROOM_KNOWLEDGE: Record<string, RoomTemplate> = {
  kitchen: {
    id: "kitchen",
    name: "Kitchen",
    nameRu: "Кухня",
    typicalObjects: [
      { type: "outlet", name: "Розетки рабочая зона", count: { min: 4, max: 6 }, mountingHeight: 1100, notes: "Над столешницей, через каждые 60-80см" },
      { type: "outlet", name: "Розетка холодильник", count: 1, mountingHeight: 300, notes: "За холодильником" },
      { type: "outlet", name: "Розетка посудомоечная машина", count: 1, mountingHeight: 300, notes: "Под столешницей" },
      { type: "outlet", name: "Розетка микроволновка", count: 1, mountingHeight: 1100, notes: "На рабочей зоне" },
      { type: "outlet", name: "Розетка чайник", count: 1, mountingHeight: 1100, notes: "На рабочей зоне" },
      { type: "light_ceiling", name: "Светильник", count: 1 },
      { type: "switch", name: "Выключатель", count: 1, mountingHeight: 900 },
    ],
    typicalCircuits: [
      { name: "Освещение", breakerRating: 10, cableSection: 1.5, load: 800, objects: ["light_ceiling"] },
      { name: "Розетки рабочая зона", breakerRating: 16, cableSection: 2.5, load: 3500, objects: ["outlet"] },
      { name: "Холодильник", breakerRating: 10, cableSection: 2.5, load: 300, objects: ["outlet"] },
      { name: "Посудомоечная машина", breakerRating: 16, cableSection: 2.5, load: 2200, objects: ["outlet"] },
      { name: "Электроплита/духовой шкаф", breakerRating: 32, cableSection: 6, load: 7000, objects: ["outlet"], notes: "Отдельная линия" },
    ],
    tips: [
      "Розетки на рабочей зоне — через каждые 60-80см",
      "Холодильник — отдельная линия с автоматом 10А",
      "Посудомоечная машина — отдельная линия с УЗО 30мА",
      "Электроплита — отдельная линия 6мм² с автоматом 32А",
      "Не размещать розетки над варочной поверхностью",
      "УЗО обязательно для линий с влагой",
    ],
  },

  bedroom: {
    id: "bedroom",
    name: "Bedroom",
    nameRu: "Спальня",
    typicalObjects: [
      { type: "outlet", name: "Розетки у кровати", count: { min: 2, max: 4 }, mountingHeight: 700, notes: "По обе стороны кровати" },
      { type: "outlet", name: "Розетка кондиционер", count: 1, mountingHeight: 2200, notes: "Под потолком" },
      { type: "outlet", name: "Розетка тумбочка", count: 1, mountingHeight: 700, notes: "Для зарядки телефона" },
      { type: "light_ceiling", name: "Светильник", count: 1 },
      { type: "switch", name: "Выключатель у двери", count: 1, mountingHeight: 900 },
      { type: "switch", name: "Выключатель у кровати", count: 1, mountingHeight: 700, notes: "Проходной или двухклавишный" },
    ],
    typicalCircuits: [
      { name: "Освещение", breakerRating: 10, cableSection: 1.5, load: 600, objects: ["light_ceiling"] },
      { name: "Розетки", breakerRating: 16, cableSection: 2.5, load: 3500, objects: ["outlet"] },
      { name: "Кондиционер", breakerRating: 16, cableSection: 2.5, load: 2500, objects: ["outlet"] },
    ],
    tips: [
      "Розетки по обе стороны кровати — минимум 2 шт",
      "Выключатель у кровати — проходной для удобства",
      "Кондиционер — отдельная линия",
      "Не размещать розетки за кроватью",
    ],
  },

  living: {
    id: "living",
    name: "Living Room",
    nameRu: "Гостиная",
    typicalObjects: [
      { type: "outlet", name: "Розетки телевизор", count: { min: 2, max: 4 }, mountingHeight: 1100, notes: "Под телевизором" },
      { type: "outlet", name: "Розетки рабочая зона", count: { min: 2, max: 4 }, mountingHeight: 300, notes: "Вдоль стен" },
      { type: "outlet", name: "Розетка кондиционер", count: 1, mountingHeight: 2200 },
      { type: "light_ceiling", name: "Светильник", count: 1 },
      { type: "switch", name: "Выключатель", count: 1, mountingHeight: 900 },
    ],
    typicalCircuits: [
      { name: "Освещение", breakerRating: 10, cableSection: 1.5, load: 800, objects: ["light_ceiling"] },
      { name: "Розетки", breakerRating: 16, cableSection: 2.5, load: 3500, objects: ["outlet"] },
      { name: "Кондиционер", breakerRating: 16, cableSection: 2.5, load: 2500, objects: ["outlet"] },
    ],
    tips: [
      "Телевизор — 2-4 розетки под ним",
      "Розетки вдоль стен — через каждые 1.5-2м",
      "Проходной выключатель у входа",
    ],
  },

  bathroom: {
    id: "bathroom",
    name: "Bathroom",
    nameRu: "Ванная комната",
    typicalObjects: [
      { type: "outlet_waterproof", name: "Розетка для бритвы", count: 1, mountingHeight: 1100, notes: "IP44, возле зеркала" },
      { type: "outlet", name: "Розетка стиральная машина", count: 1, mountingHeight: 1100, notes: "С УЗО 30мА" },
      { type: "outlet", name: "Розетка водонагреватель", count: 1, mountingHeight: 2200, notes: "С УЗО 30мА" },
      { type: "light_ceiling", name: "Светильник", count: 1, notes: "IP44" },
      { type: "switch", name: "Выключатель", count: 1, mountingHeight: 900, notes: "Вне зоны влаги" },
      { type: "sensor_smoke", name: "Датчик протечки", count: 1, mountingHeight: 0, notes: "На полу" },
    ],
    typicalCircuits: [
      { name: "Освещение", breakerRating: 10, cableSection: 1.5, load: 400, objects: ["light_ceiling"] },
      { name: "Розетки", breakerRating: 10, cableSection: 2.5, load: 2200, objects: ["outlet"], notes: "С УЗО 30мА" },
      { name: "Стиральная машина", breakerRating: 16, cableSection: 2.5, load: 2200, objects: ["outlet"], notes: "С УЗО 30мА" },
      { name: "Водонагреватель", breakerRating: 16, cableSection: 2.5, load: 2000, objects: ["outlet"], notes: "С УЗО 30мА" },
    ],
    tips: [
      "Все розетки через УЗО 30мА — обязательно",
      "Зона 0 (ванна) — только светильники IP67",
      "Зона 1 (над ванной) — только светильники IP44",
      "Зона 2 (60см от ванны) — розетки IP44 через УЗО",
      "Зона 3 (далее 60см) — обычные розетки через УЗО",
      "Выключатель — вне зоны влаги",
    ],
  },

  hall: {
    id: "hall",
    name: "Hallway",
    nameRu: "Прихожая",
    typicalObjects: [
      { type: "outlet", name: "Розетка пылесос", count: 1, mountingHeight: 300 },
      { type: "outlet", name: "Розетка обувной сушка", count: 1, mountingHeight: 300 },
      { type: "light_ceiling", name: "Светильник", count: 1 },
      { type: "switch", name: "Выключатель", count: 1, mountingHeight: 900 },
      { type: "sensor_motion", name: "Датчик движения", count: 1, notes: "Для автоматического освещения" },
    ],
    typicalCircuits: [
      { name: "Освещение", breakerRating: 10, cableSection: 1.5, load: 600, objects: ["light_ceiling"] },
      { name: "Розетки", breakerRating: 16, cableSection: 2.5, load: 3500, objects: ["outlet"] },
    ],
    tips: [
      "Щит обычно размещается в прихожей",
      "Датчик движения для удобства",
      "Розетка для пылесоса — у пола",
    ],
  },
}

// ============================================================
// DESIGN PATTERNS
// ============================================================

export const DESIGN_PATTERNS: DesignPattern[] = [
  {
    id: "one_room_apartment",
    name: "One-Room Apartment",
    nameRu: "Однокомнатная квартира",
    description: "Стандартная однокомнатная квартира 30-45м²",
   适用于: ["apartment", "studio"],
    objects: [
      // Кухня
      { type: "outlet", name: "Розетки кухня", count: 6, mountingHeight: 1100 },
      { type: "light_ceiling", name: "Светильник кухня", count: 1 },
      // Спальня/гостиная
      { type: "outlet", name: "Розетки комната", count: 6, mountingHeight: 300 },
      { type: "light_ceiling", name: "Светильник комната", count: 1 },
      // Ванная
      { type: "outlet_waterproof", name: "Розетка ванная", count: 2, mountingHeight: 1100 },
      { type: "light_ceiling", name: "Светильник ванная", count: 1 },
      // Прихожая
      { type: "light_ceiling", name: "Светильник прихожая", count: 1 },
    ],
    circuits: [
      { name: "Освещение", breakerRating: 10, cableSection: 1.5, load: 800, objects: ["light_ceiling"] },
      { name: "Розетки комната", breakerRating: 16, cableSection: 2.5, load: 3500, objects: ["outlet"] },
      { name: "Розетки кухня", breakerRating: 16, cableSection: 2.5, load: 3500, objects: ["outlet"] },
      { name: "Электроплита", breakerRating: 32, cableSection: 6, load: 7000, objects: ["outlet"] },
      { name: "Ванная", breakerRating: 10, cableSection: 2.5, load: 2200, objects: ["outlet"], notes: "С УЗО 30мА" },
    ],
    panel: {
      maxModules: 12,
      mainBreaker: 32,
      rcdRequired: true,
    },
  },

  {
    id: "two_room_apartment",
    name: "Two-Room Apartment",
    nameRu: "Двухкомнатная квартира",
    description: "Стандартная двухкомнатная квартира 45-65м²",
   适用于: ["apartment"],
    objects: [
      // Кухня
      { type: "outlet", name: "Розетки кухня", count: 8, mountingHeight: 1100 },
      { type: "light_ceiling", name: "Светильник кухня", count: 1 },
      // Спальня
      { type: "outlet", name: "Розетки спальня", count: 6, mountingHeight: 300 },
      { type: "light_ceiling", name: "Светильник спальня", count: 1 },
      // Гостиная
      { type: "outlet", name: "Розетки гостиная", count: 8, mountingHeight: 300 },
      { type: "light_ceiling", name: "Светильник гостиная", count: 1 },
      // Ванная
      { type: "outlet_waterproof", name: "Розетка ванная", count: 2, mountingHeight: 1100 },
      { type: "light_ceiling", name: "Светильник ванная", count: 1 },
      // Прихожая
      { type: "light_ceiling", name: "Светильник прихожая", count: 1 },
    ],
    circuits: [
      { name: "Освещение", breakerRating: 10, cableSection: 1.5, load: 1200, objects: ["light_ceiling"] },
      { name: "Розетки спальня", breakerRating: 16, cableSection: 2.5, load: 3500, objects: ["outlet"] },
      { name: "Розетки гостиная", breakerRating: 16, cableSection: 2.5, load: 3500, objects: ["outlet"] },
      { name: "Розетки кухня", breakerRating: 16, cableSection: 2.5, load: 3500, objects: ["outlet"] },
      { name: "Электроплита", breakerRating: 32, cableSection: 6, load: 7000, objects: ["outlet"] },
      { name: "Ванная", breakerRating: 10, cableSection: 2.5, load: 2200, objects: ["outlet"], notes: "С УЗО 30мА" },
      { name: "Кондиционер", breakerRating: 16, cableSection: 2.5, load: 2500, objects: ["outlet"] },
    ],
    panel: {
      maxModules: 18,
      mainBreaker: 40,
      rcdRequired: true,
    },
  },

  {
    id: "house_standard",
    name: "Standard House",
    nameRu: "Стандартный дом",
    description: "Двухэтажный дом 120-200м²",
   适用于: ["house", "cottage"],
    objects: [
      // Гостиная
      { type: "outlet", name: "Розетки гостиная", count: 10, mountingHeight: 300 },
      { type: "light_ceiling", name: "Светильник гостиная", count: 2 },
      // Кухня
      { type: "outlet", name: "Розетки кухня", count: 10, mountingHeight: 1100 },
      { type: "light_ceiling", name: "Светильник кухня", count: 1 },
      // Спальни (3)
      { type: "outlet", name: "Розетки спальня", count: 6, mountingHeight: 300 },
      { type: "light_ceiling", name: "Светильник спальня", count: 1 },
      // Ванные (2)
      { type: "outlet_waterproof", name: "Розетка ванная", count: 2, mountingHeight: 1100 },
      { type: "light_ceiling", name: "Светильник ванная", count: 1 },
      // Гараж
      { type: "outlet", name: "Розетки гараж", count: 4, mountingHeight: 1100 },
      { type: "light_ceiling", name: "Светильник гараж", count: 2 },
    ],
    circuits: [
      { name: "Освещение 1 этаж", breakerRating: 10, cableSection: 1.5, load: 1500, objects: ["light_ceiling"] },
      { name: "Освещение 2 этаж", breakerRating: 10, cableSection: 1.5, load: 1500, objects: ["light_ceiling"] },
      { name: "Розетки гостиная", breakerRating: 16, cableSection: 2.5, load: 3500, objects: ["outlet"] },
      { name: "Розетки кухня", breakerRating: 16, cableSection: 2.5, load: 3500, objects: ["outlet"] },
      { name: "Электроплита", breakerRating: 32, cableSection: 6, load: 7000, objects: ["outlet"] },
      { name: "Розетки спальни", breakerRating: 16, cableSection: 2.5, load: 3500, objects: ["outlet"] },
      { name: "Ванные", breakerRating: 10, cableSection: 2.5, load: 2200, objects: ["outlet"], notes: "С УЗО 30мА" },
      { name: "Гараж", breakerRating: 16, cableSection: 4, load: 5000, objects: ["outlet"] },
      { name: "Кондиционеры", breakerRating: 16, cableSection: 2.5, load: 5000, objects: ["outlet"] },
    ],
    panel: {
      maxModules: 36,
      mainBreaker: 63,
      rcdRequired: true,
    },
  },
]

// ============================================================
// KNOWLEDGE QUERY
// ============================================================

class KnowledgeBaseImpl {

  getRoomTemplate(roomType: string): RoomTemplate | undefined {
    return ROOM_KNOWLEDGE[roomType]
  }

  getDesignPattern(patternId: string): DesignPattern | undefined {
    return DESIGN_PATTERNS.find(p => p.id === patternId)
  }

  findPatternForRoom(roomType: string): DesignPattern | undefined {
    return DESIGN_PATTERNS.find(p => p.适用于.includes(roomType))
  }

  getAllRoomTemplates(): RoomTemplate[] {
    return Object.values(ROOM_KNOWLEDGE)
  }

  getAllDesignPatterns(): DesignPattern[] {
    return DESIGN_PATTERNS
  }

  getTipsForRoom(roomType: string): string[] {
    return ROOM_KNOWLEDGE[roomType]?.tips ?? []
  }

  getTypicalCircuit(roomType: string, objectType: string): TemplateCircuit | undefined {
    const template = ROOM_KNOWLEDGE[roomType]
    return template?.typicalCircuits.find(c => c.objects.includes(objectType))
  }
}

export const KnowledgeBase = new KnowledgeBaseImpl()
