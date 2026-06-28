// ============================================================
// ElectricPMR — Building Types
// ============================================================
//
// Типы для многоквартирного дома: здание → этаж → квартира.
// ============================================================

import type { UUID } from "./common"
import type { GeometryScene } from "./geometry"
import type { ElectricalData } from "./electrical"

// ============================================================
// APARTMENT
// ============================================================

export interface Apartment {
  id: UUID
  name: string                    // "Кв. 1", "Кв. 2"
  floor: number                   // этаж
  position: { x: number; y: number } // позиция на плане этажа
  scene: GeometryScene            // стены, комнаты, двери, окна
  electrical: ElectricalData      // точки, цепи, кабели
  area: number                    // м²
  rooms: number                   // кол-во комнат
  createdAt: Date
  updatedAt: Date
}

// ============================================================
// FLOOR
// ============================================================

export interface BuildingFloor {
  number: number
  apartments: UUID[]              // IDs квартир на этаже
  commonAreas: UUID[]             // IDs общих зон (коридор, лестница)
}

// ============================================================
// BUILDING
// ============================================================

export interface Building {
  id: UUID
  name: string
  address: string
  floors: BuildingFloor[]
  apartments: Apartment[]
  commonPanel: {
    mainBreakerRating: number
    totalPower: number
    riserCount: number
  }
  createdAt: Date
  updatedAt: Date
}

// ============================================================
// BUILDING SUMMARY
// ============================================================

export interface BuildingSummary {
  totalApartments: number
  totalFloors: number
  totalArea: number
  totalPower: number
  totalCurrent: number
  totalBreakers: number
  perFloor: Array<{
    floor: number
    apartments: number
    totalPower: number
  }>
  perApartment: Array<{
    id: string
    name: string
    floor: number
    area: number
    rooms: number
    power: number
  }>
}
