import { describe, it, expect, beforeEach } from "vitest"
import { useBuildingStore } from "../../stores/buildingStore"
import type { Wall, Room, Door, Window } from "../engine/types/geometry"
import type { ElectricalPoint } from "../engine/types/electrical"

function makeWall(x1: number, y1: number, x2: number, y2: number): Wall {
  return {
    id: `wall_${Date.now()}_${Math.random()}` as any,
    points: [{ x: x1, y: y1 }, { x: x2, y: y2 }],
    thickness: 150, height: 2700, material: "brick", isExternal: false, floor: 1,
    createdAt: new Date(), updatedAt: new Date(),
  }
}

function makeRoom(overrides: Partial<Room> = {}): Room {
  return {
    id: `room_${Date.now()}` as any,
    name: "Гостиная",
    type: "living",
    polygon: [{ x: 0, y: 0 }, { x: 5000, y: 0 }, { x: 5000, y: 4000 }, { x: 0, y: 4000 }],
    floor: 1, ceilingHeight: 2700, area: 20, perimeter: 18, volume: 54,
    createdAt: new Date(), updatedAt: new Date(),
    ...overrides,
  }
}

describe("Building Store — Multi-Apartment", () => {
  beforeEach(() => {
    // Reset store
    useBuildingStore.setState({
      building: {
        id: "test_building" as any,
        name: "Тестовый дом",
        address: "",
        floors: [],
        apartments: [],
        commonPanel: { mainBreakerRating: 100, totalPower: 0, riserCount: 0 },
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      activeApartmentId: null,
    })
  })

  describe("G.35 — add apartment", () => {
    it("creates apartment on specified floor", () => {
      const store = useBuildingStore.getState()
      const id = store.addApartment("Кв. 1", 1)

      const state = useBuildingStore.getState()
      expect(state.building.apartments.length).toBe(1)
      expect(state.building.apartments[0].name).toBe("Кв. 1")
      expect(state.building.apartments[0].floor).toBe(1)
      expect(state.building.floors.length).toBe(1)
      expect(state.building.floors[0].apartments).toContain(id)
    })
  })

  describe("G.36 — multiple apartments on same floor", () => {
    it("groups apartments by floor", () => {
      const store = useBuildingStore.getState()
      store.addApartment("Кв. 1", 1)
      store.addApartment("Кв. 2", 1)
      store.addApartment("Кв. 3", 2)

      const state = useBuildingStore.getState()
      expect(state.building.floors.length).toBe(2)
      expect(state.building.floors[0].apartments.length).toBe(2)
      expect(state.building.floors[1].apartments.length).toBe(1)
    })
  })

  describe("G.37 — remove apartment", () => {
    it("removes apartment and cleans up floor", () => {
      const store = useBuildingStore.getState()
      const id = store.addApartment("Кв. 1", 1)
      store.addApartment("Кв. 2", 1)

      useBuildingStore.getState().removeApartment(id)

      const state = useBuildingStore.getState()
      expect(state.building.apartments.length).toBe(1)
      expect(state.building.floors[0].apartments.length).toBe(1)
    })
  })

  describe("G.38 — active apartment switching", () => {
    it("switches active apartment", () => {
      const store = useBuildingStore.getState()
      const id1 = store.addApartment("Кв. 1", 1)
      const id2 = store.addApartment("Кв. 2", 1)

      useBuildingStore.getState().setActiveApartment(id1)
      expect(useBuildingStore.getState().activeApartmentId).toBe(id1)

      useBuildingStore.getState().setActiveApartment(id2)
      expect(useBuildingStore.getState().activeApartmentId).toBe(id2)
    })
  })

  describe("G.39 — add wall to active apartment", () => {
    it("adds wall to the active apartment's scene", () => {
      const store = useBuildingStore.getState()
      const id = store.addApartment("Кв. 1", 1)
      useBuildingStore.getState().setActiveApartment(id)

      const wall = makeWall(0, 0, 5000, 0)
      useBuildingStore.getState().addWall(wall)

      const apt = useBuildingStore.getState().getActiveApartment()
      expect(apt?.scene.walls.length).toBe(1)
    })
  })

  describe("G.40 — add electrical point to apartment", () => {
    it("adds point to active apartment", () => {
      const store = useBuildingStore.getState()
      const id = store.addApartment("Кв. 1", 1)
      useBuildingStore.getState().setActiveApartment(id)

      const point: ElectricalPoint = {
        id: "p1" as any,
        type: "outlet",
        name: "Розетка",
        position: { x: 1000, y: 500 },
        power: 0,
        parameters: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      }
      useBuildingStore.getState().addElectricalPoint(point)

      const apt = useBuildingStore.getState().getActiveApartment()
      expect(apt?.electrical.points.length).toBe(1)
    })
  })

  describe("G.41 — building summary", () => {
    it("calculates total area, power, apartments", () => {
      const store = useBuildingStore.getState()
      const id1 = store.addApartment("Кв. 1", 1)
      const id2 = store.addApartment("Кв. 2", 1)

      // Add rooms to apartment 1
      useBuildingStore.getState().setActiveApartment(id1)
      useBuildingStore.getState().addRoom(makeRoom({ area: 20 }))
      useBuildingStore.getState().addRoom(makeRoom({ name: "Кухня", type: "kitchen", area: 12 }))

      // Add rooms to apartment 2
      useBuildingStore.getState().setActiveApartment(id2)
      useBuildingStore.getState().addRoom(makeRoom({ name: "Спальня", area: 15 }))

      const summary = useBuildingStore.getState().getSummary()
      expect(summary.totalApartments).toBe(2)
      expect(summary.totalFloors).toBe(1)
      expect(summary.totalArea).toBe(47) // 20+12+15
      expect(summary.perFloor[0].apartments).toBe(2)
    })
  })

  describe("G.42 — 9-apartment building flow", () => {
    it("manages 3-floor building with 3 apartments each", () => {
      const store = useBuildingStore.getState()

      // Floor 1
      store.addApartment("Кв. 1.1", 1)
      store.addApartment("Кв. 1.2", 1)
      store.addApartment("Кв. 1.3", 1)

      // Floor 2
      store.addApartment("Кв. 2.1", 2)
      store.addApartment("Кв. 2.2", 2)
      store.addApartment("Кв. 2.3", 2)

      // Floor 3
      store.addApartment("Кв. 3.1", 3)
      store.addApartment("Кв. 3.2", 3)
      store.addApartment("Кв. 3.3", 3)

      const state = useBuildingStore.getState()
      expect(state.building.apartments.length).toBe(9)
      expect(state.building.floors.length).toBe(3)

      const summary = state.getSummary()
      expect(summary.totalApartments).toBe(9)
      expect(summary.totalFloors).toBe(3)
      expect(summary.perFloor.length).toBe(3)
    })
  })

  describe("G.43 — apartment data isolation", () => {
    it("apartments don't share scene data", () => {
      const store = useBuildingStore.getState()
      const id1 = store.addApartment("Кв. 1", 1)
      const id2 = store.addApartment("Кв. 2", 1)

      useBuildingStore.getState().setActiveApartment(id1)
      useBuildingStore.getState().addWall(makeWall(0, 0, 5000, 0))
      useBuildingStore.getState().addRoom(makeRoom())

      useBuildingStore.getState().setActiveApartment(id2)

      const apt1 = useBuildingStore.getState().building.apartments.find(a => a.id === id1)
      const apt2 = useBuildingStore.getState().building.apartments.find(a => a.id === id2)

      expect(apt1?.scene.walls.length).toBe(1)
      expect(apt1?.scene.rooms.length).toBe(1)
      expect(apt2?.scene.walls.length).toBe(0)
      expect(apt2?.scene.rooms.length).toBe(0)
    })
  })
})
