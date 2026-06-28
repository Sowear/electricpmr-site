// ============================================================
// ElectricPMR — Building Store
// ============================================================
//
// Zustand store для многоквартирного дома.
// Управляет квартирой, этажами, сводкой по зданию.
// ============================================================

import { create } from "zustand"
import type { Apartment, Building, BuildingFloor, BuildingSummary } from "../engine/types/building"
import type { GeometryScene, Room, Wall, Door, Window } from "../engine/types/geometry"
import type { ElectricalData, ElectricalPoint, CircuitGroup } from "../engine/types/electrical"
import type { UUID } from "../engine/types/common"

// ============================================================
// EMPTY STATE
// ============================================================

function emptyScene(name: string): GeometryScene {
  return {
    id: `scene_${Date.now()}` as any,
    name,
    floors: [],
    walls: [],
    rooms: [],
    doors: [],
    windows: [],
    objects: [],
  }
}

function emptyElectrical(): ElectricalData {
  return {
    points: [],
    circuits: [],
    cables: [],
    panels: [],
    totalLoad: { totalPower: 0, totalCurrent: 0, demandFactor: 0.7, simultaneousFactor: 0.6, effectivePower: 0, effectiveCurrent: 0 },
    phaseBalance: {
      phase1: { totalPower: 0, totalCurrent: 0, demandFactor: 1, simultaneousFactor: 1, effectivePower: 0, effectiveCurrent: 0 },
      phase2: { totalPower: 0, totalCurrent: 0, demandFactor: 1, simultaneousFactor: 1, effectivePower: 0, effectiveCurrent: 0 },
      phase3: { totalPower: 0, totalCurrent: 0, demandFactor: 1, simultaneousFactor: 1, effectivePower: 0, effectiveCurrent: 0 },
      deviation: 0,
    },
  }
}

// ============================================================
// STATE
// ============================================================

interface BuildingState {
  building: Building
  activeApartmentId: string | null

  // Apartment CRUD
  addApartment: (name: string, floor: number) => string
  removeApartment: (id: string) => void
  setActiveApartment: (id: string | null) => void
  getActiveApartment: () => Apartment | null

  // Apartment scene editing
  addWall: (wall: Wall) => void
  addDoor: (door: Door) => void
  addWindow: (win: Window) => void
  addRoom: (room: Room) => void
  addElectricalPoint: (point: ElectricalPoint) => void

  // Building summary
  getSummary: () => BuildingSummary
  getTotalPower: () => number
}

// ============================================================
// HELPERS
// ============================================================

function genId(): UUID {
  return `id_${Date.now()}_${Math.random().toString(36).slice(2, 9)}` as UUID
}

function calcApartmentArea(scene: GeometryScene): number {
  return scene.rooms.reduce((sum, r) => sum + r.area, 0)
}

// ============================================================
// STORE
// ============================================================

export const useBuildingStore = create<BuildingState>((set, get) => ({
  building: {
    id: genId(),
    name: "Новый дом",
    address: "",
    floors: [],
    apartments: [],
    commonPanel: {
      mainBreakerRating: 100,
      totalPower: 0,
      riserCount: 0,
    },
    createdAt: new Date(),
    updatedAt: new Date(),
  },

  activeApartmentId: null,

  addApartment: (name: string, floor: number): string => {
    const id = genId()
    const scene = emptyScene(name)
    const apartment: Apartment = {
      id,
      name,
      floor,
      position: { x: 0, y: 0 },
      scene,
      electrical: emptyElectrical(),
      area: 0,
      rooms: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    set(state => {
      const existingFloor = state.building.floors.find(f => f.number === floor)
      const floors = existingFloor
        ? state.building.floors.map(f =>
            f.number === floor ? { ...f, apartments: [...f.apartments, id] } : f
          )
        : [...state.building.floors, { number: floor, apartments: [id], commonAreas: [] }]

      return {
        building: {
          ...state.building,
          floors,
          apartments: [...state.building.apartments, apartment],
        },
      }
    })

    return id
  },

  removeApartment: (id: string) => {
    set(state => ({
      building: {
        ...state.building,
        apartments: state.building.apartments.filter(a => a.id !== id),
        floors: state.building.floors.map(f => ({
          ...f,
          apartments: f.apartments.filter(aId => aId !== id),
        })).filter(f => f.apartments.length > 0 || f.commonAreas.length > 0),
      },
      activeApartmentId: state.activeApartmentId === id ? null : state.activeApartmentId,
    }))
  },

  setActiveApartment: (id: string | null) => {
    set({ activeApartmentId: id })
  },

  getActiveApartment: () => {
    const state = get()
    if (!state.activeApartmentId) return null
    return state.building.apartments.find(a => a.id === state.activeApartmentId) ?? null
  },

  addWall: (wall: Wall) => {
    const state = get()
    if (!state.activeApartmentId) return

    set(state => ({
      building: {
        ...state.building,
        apartments: state.building.apartments.map(a =>
          a.id === state.activeApartmentId
            ? {
                ...a,
                scene: { ...a.scene, walls: [...a.scene.walls, wall] },
                updatedAt: new Date(),
              }
            : a
        ),
      },
    }))
  },

  addDoor: (door: Door) => {
    const state = get()
    if (!state.activeApartmentId) return

    set(state => ({
      building: {
        ...state.building,
        apartments: state.building.apartments.map(a =>
          a.id === state.activeApartmentId
            ? {
                ...a,
                scene: { ...a.scene, doors: [...a.scene.doors, door] },
                updatedAt: new Date(),
              }
            : a
        ),
      },
    }))
  },

  addWindow: (win: Window) => {
    const state = get()
    if (!state.activeApartmentId) return

    set(state => ({
      building: {
        ...state.building,
        apartments: state.building.apartments.map(a =>
          a.id === state.activeApartmentId
            ? {
                ...a,
                scene: { ...a.scene, windows: [...a.scene.windows, win] },
                updatedAt: new Date(),
              }
            : a
        ),
      },
    }))
  },

  addRoom: (room: Room) => {
    const state = get()
    if (!state.activeApartmentId) return

    set(state => ({
      building: {
        ...state.building,
        apartments: state.building.apartments.map(a =>
          a.id === state.activeApartmentId
            ? {
                ...a,
                scene: { ...a.scene, rooms: [...a.scene.rooms, room] },
                updatedAt: new Date(),
              }
            : a
        ),
      },
    }))
  },

  addElectricalPoint: (point: ElectricalPoint) => {
    const state = get()
    if (!state.activeApartmentId) return

    set(state => ({
      building: {
        ...state.building,
        apartments: state.building.apartments.map(a =>
          a.id === state.activeApartmentId
            ? {
                ...a,
                electrical: {
                  ...a.electrical,
                  points: [...a.electrical.points, point],
                },
                updatedAt: new Date(),
              }
            : a
        ),
      },
    }))
  },

  getSummary: (): BuildingSummary => {
    const { building } = get()
    const perApartment = building.apartments.map(a => ({
      id: a.id,
      name: a.name,
      floor: a.floor,
      area: calcApartmentArea(a.scene),
      rooms: a.scene.rooms.length,
      power: a.electrical.totalLoad.effectivePower,
    }))

    const perFloor = building.floors.map(f => ({
      floor: f.number,
      apartments: f.apartments.length,
      totalPower: f.apartments.reduce((sum, aId) => {
        const apt = building.apartments.find(a => a.id === aId)
        return sum + (apt?.electrical.totalLoad.effectivePower ?? 0)
      }, 0),
    }))

    return {
      totalApartments: building.apartments.length,
      totalFloors: building.floors.length,
      totalArea: perApartment.reduce((sum, a) => sum + a.area, 0),
      totalPower: perApartment.reduce((sum, a) => sum + a.power, 0),
      totalCurrent: perApartment.reduce((sum, a) => sum + a.power, 0) / 220,
      totalBreakers: building.apartments.reduce((sum, a) => sum + a.electrical.circuits.length, 0),
      perFloor,
      perApartment,
    }
  },

  getTotalPower: (): number => {
    const { building } = get()
    return building.apartments.reduce((sum, a) => sum + a.electrical.totalLoad.effectivePower, 0)
  },
}))
