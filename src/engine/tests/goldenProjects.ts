// ============================================================
// ElectricPMR — Golden Projects
// ============================================================
//
// Эталонные проекты с заранее известными результатами.
// После любого изменения движка результаты сравниваются.
// ============================================================

import type { UUID } from "../types/common"

// ============================================================
// GOLDEN PROJECT INTERFACE
// ============================================================

export interface GoldenProject {
  name: string
  description: string
  expected: ExpectedResults
  objects: GoldenObject[]
  relationships: GoldenRelationship[]
}

export interface GoldenObject {
  type: string
  name: string
  x?: number
  y?: number
  width?: number
  height?: number
  electrical?: {
    power?: number
    voltage?: number
    current?: number
    breakerRating?: number
  }
}

export interface GoldenRelationship {
  from: string // имя объекта
  to: string
  type: string
}

export interface ExpectedResults {
  objectCount: number
  totalPower: number // Вт
  totalCurrent: number // А
  circuits: number
  breakers: Array<{
    rating: number
    load: number
  }>
  cableLengths: Record<string, number> // тип кабеля → длина в метрах
}

// ============================================================
// GOLDEN PROJECTS
// ============================================================

export const GOLDEN_PROJECTS: GoldenProject[] = [
  // --- Квартира 45м² ---
  {
    name: "Apartment_45m2",
    description: "Однокомнатная квартира 45м²: кухня, гостиная, ванная, прихожая",
    expected: {
      objectCount: 28,
      totalPower: 8500,
      totalCurrent: 38.6,
      circuits: 6,
      breakers: [
        { rating: 16, load: 3520 }, // Освещение
        { rating: 16, load: 3520 }, // Розетки гостиная
        { rating: 16, load: 3520 }, // Розетки кухня
        { rating: 25, load: 5500 }, // Электроплита
        { rating: 10, load: 2200 }, // Ванная
        { rating: 16, load: 3520 }, // Кондиционер
      ],
      cableLengths: {
        VVGng_3x2_5: 45, // Освещение
        VVGng_3x2_5: 60, // Розетки
        VVGng_3x4: 15, // Электроплита
        VVGng_3x2_5: 12, // Ванная
      },
    },
    objects: [
      // Кухня
      { type: "room", name: "Кухня", width: 3000, height: 2500 },
      { type: "outlet", name: "Розетка кухня 1", x: 500, y: 300 },
      { type: "outlet", name: "Розетка кухня 2", x: 1500, y: 300 },
      { type: "outlet", name: "Розетка кухня 3", x: 2500, y: 300 },
      { type: "light_ceiling", name: "Светильник кухня", x: 1500, y: 1250 },
      { type: "switch", name: "Выключатель кухня", x: 100, y: 900 },
      // Гостиная
      { type: "room", name: "Гостиная", width: 4000, height: 3500 },
      { type: "outlet", name: "Розетка гостиная 1", x: 500, y: 300 },
      { type: "outlet", name: "Розетка гостиная 2", x: 3500, y: 300 },
      { type: "light_ceiling", name: "Светильник гостиная", x: 2000, y: 1750 },
      { type: "switch", name: "Выключатель гостиная", x: 100, y: 900 },
      // Ванная
      { type: "room", name: "Ванная", width: 2000, height: 2000 },
      { type: "outlet_waterproof", name: "Розетка ванная", x: 500, y: 300 },
      { type: "light_ceiling", name: "Светильник ванная", x: 1000, y: 1000 },
      { type: "switch", name: "Выключатель ванная", x: 100, y: 900 },
      // Прихожая
      { type: "room", name: "Прихожая", width: 3000, height: 1500 },
      { type: "light_ceiling", name: "Светильник прихожая", x: 1500, y: 750 },
      { type: "switch", name: "Выключатель прихожая", x: 100, y: 900 },
      // Щит
      { type: "panel", name: "Щит квартиры", x: 200, y: 100 },
      { type: "breaker", name: "Автомат освещение", x: 0, y: 0 },
      { type: "breaker", name: "Автомат розетки гостиная", x: 0, y: 0 },
      { type: "breaker", name: "Автомат розетки кухня", x: 0, y: 0 },
      { type: "breaker", name: "Автомат электроплита", x: 0, y: 0 },
      { type: "breaker", name: "Автомат ванная", x: 0, y: 0 },
      { type: "breaker", name: "Автомат кондиционер", x: 0, y: 0 },
    ],
    relationships: [
      { from: "Розетка кухня 1", to: "Автомат розетки кухня", type: "poweredBy" },
      { from: "Розетка кухня 2", to: "Автомат розетки кухня", type: "poweredBy" },
      { from: "Розетка кухня 3", to: "Автомат розетки кухня", type: "poweredBy" },
      { from: "Светильник кухня", to: "Автомат освещение", type: "poweredBy" },
      { from: "Розетка гостиная 1", to: "Автомат розетки гостиная", type: "poweredBy" },
      { from: "Розетка гостиная 2", to: "Автомат розетки гостиная", type: "poweredBy" },
      { from: "Светильник гостиная", to: "Автомат освещение", type: "poweredBy" },
      { from: "Розетка ванная", to: "Автомат ванная", type: "poweredBy" },
      { from: "Светильник ванная", to: "Автомат освещение", type: "poweredBy" },
      { from: "Светильник прихожая", to: "Автомат освещение", type: "poweredBy" },
    ],
  },

  // --- Дом 180м² ---
  {
    name: "House_180m2",
    description: "Двухэтажный дом 180м²: гостиная, кухня, 3 спальни, 2 ванные, гараж",
    expected: {
      objectCount: 65,
      totalPower: 25000,
      totalCurrent: 113.6,
      circuits: 12,
      breakers: [
        { rating: 16, load: 3520 }, // Освещение 1 этаж
        { rating: 16, load: 3520 }, // Освещение 2 этаж
        { rating: 16, load: 3520 }, // Розетки гостиная
        { rating: 16, load: 3520 }, // Розетки кухня
        { rating: 25, load: 5500 }, // Электроплита
        { rating: 16, load: 3520 }, // Розетки спальня 1
        { rating: 16, load: 3520 }, // Розетки спальня 2
        { rating: 16, load: 3520 }, // Розетки спальня 3
        { rating: 10, load: 2200 }, // Ванная 1
        { rating: 10, load: 2200 }, // Ванная 2
        { rating: 16, load: 3520 }, // Кондиционер
        { rating: 32, load: 7040 }, // Гараж
      ],
      cableLengths: {
        VVGng_3x2_5: 120,
        VVGng_3x4: 30,
        VVGng_3x6: 20,
      },
    },
    objects: [], // Упрощено для примера
    relationships: [],
  },

  // --- Офис 400м² ---
  {
    name: "Office_400m2",
    description: "Офис 400м²: 10 рабочих мест, переговорная, серверная, кухня",
    expected: {
      objectCount: 85,
      totalPower: 35000,
      totalCurrent: 159.1,
      circuits: 15,
      breakers: [
        { rating: 16, load: 3520 }, // Освещение
        { rating: 16, load: 3520 }, // Розетки рабочие места 1-5
        { rating: 16, load: 3520 }, // Розетки рабочие места 6-10
        { rating: 16, load: 3520 }, // Розетки переговорная
        { rating: 16, load: 3520 }, // Розетки кухня
        { rating: 25, load: 5500 }, // Кондиционер
        { rating: 32, load: 7040 }, // Серверная
      ],
      cableLengths: {
        VVGng_3x2_5: 200,
        VVGng_3x4: 50,
        FTP: 150,
      },
    },
    objects: [],
    relationships: [],
  },
]

// ============================================================
// VALIDATION FUNCTION
// ============================================================

export function validateGoldenProject(
  actual: {
    objectCount: number
    totalPower: number
    totalCurrent: number
    circuits: number
  },
  golden: GoldenProject
): ValidationResult {
  const errors: string[] = []

  if (actual.objectCount !== golden.expected.objectCount) {
    errors.push(
      `Object count: expected ${golden.expected.objectCount}, got ${actual.objectCount}`
    )
  }

  const powerDiff = Math.abs(actual.totalPower - golden.expected.totalPower)
  if (powerDiff > golden.expected.totalPower * 0.1) {
    errors.push(
      `Total power: expected ~${golden.expected.totalPower}W, got ${actual.totalPower}W (diff: ${powerDiff}W)`
    )
  }

  const currentDiff = Math.abs(actual.totalCurrent - golden.expected.totalCurrent)
  if (currentDiff > golden.expected.totalCurrent * 0.1) {
    errors.push(
      `Total current: expected ~${golden.expected.totalCurrent}A, got ${actual.totalCurrent}A`
    )
  }

  if (actual.circuits !== golden.expected.circuits) {
    errors.push(
      `Circuits: expected ${golden.expected.circuits}, got ${actual.circuits}`
    )
  }

  return {
    valid: errors.length === 0,
    errors,
    projectName: golden.name,
  }
}

export interface ValidationResult {
  valid: boolean
  errors: string[]
  projectName: string
}
