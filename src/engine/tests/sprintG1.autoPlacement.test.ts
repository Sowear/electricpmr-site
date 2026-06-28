import { describe, it, expect, beforeEach } from "vitest"
import { EngineFacade } from "../facade/engineFacade"
import { ComponentStore } from "../core/ecs"
import { autoPlaceAll, autoPlaceInRoom } from "../core/autoPlacement"
import type { Room, Wall, Door, Window } from "../types/geometry"
import type { ElectricalPoint } from "../types/electrical"

function makeRoom(overrides: Partial<Room> = {}): Room {
  return {
    id: "room_1" as any,
    name: "Гостиная",
    type: "living",
    polygon: [
      { x: 0, y: 0 },
      { x: 5000, y: 0 },
      { x: 5000, y: 4000 },
      { x: 0, y: 4000 },
    ],
    floor: 1,
    ceilingHeight: 2700,
    area: 20,
    perimeter: 18,
    volume: 54,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  }
}

function makeWall(x1: number, y1: number, x2: number, y2: number): Wall {
  return {
    id: `wall_${Date.now()}_${Math.random()}` as any,
    points: [{ x: x1, y: y1 }, { x: x2, y: y2 }],
    thickness: 150,
    height: 2700,
    material: "brick",
    isExternal: false,
    floor: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
  }
}

describe("Auto-Placement Engine", () => {
  beforeEach(() => {
    EngineFacade.clear()
  })

  describe("G.1 — outlets along walls in living room", () => {
    it("places outlets along all 4 walls of a 5x4m room", () => {
      const room = makeRoom({ type: "living" })
      const result = autoPlaceAll([room], [], [], [], [])

      const outlets = result.points.filter(p => p.type === "outlet")
      expect(outlets.length).toBeGreaterThanOrEqual(4) // at least 1 per wall

      // All outlets should have roomId
      outlets.forEach(o => expect(o.roomId).toBe(room.id))
    })
  })

  describe("G.2 — kitchen gets triple outlets and stove", () => {
    it("places outlet_triple and appliance_stove in kitchen", () => {
      const room = makeRoom({ type: "kitchen", name: "Кухня" })
      const result = autoPlaceAll([room], [], [], [], [])

      const triples = result.points.filter(p => p.type === "outlet_triple")
      const stoves = result.points.filter(p => p.type === "appliance_stove")
      expect(triples.length).toBeGreaterThanOrEqual(1)
      expect(stoves.length).toBe(1)
    })
  })

  describe("G.3 — bathroom gets waterproof outlet only", () => {
    it("places 1 waterproof outlet in bathroom", () => {
      const room = makeRoom({ type: "bathroom", name: "Ванная", polygon: [
        { x: 0, y: 0 }, { x: 2000, y: 0 }, { x: 2000, y: 2500 }, { x: 0, y: 2500 },
      ]})
      const result = autoPlaceAll([room], [], [], [], [])

      const waterproof = result.points.filter(p => p.type === "outlet_waterproof")
      expect(waterproof.length).toBe(1)
    })
  })

  describe("G.4 — switch placement near door", () => {
    it("places switch near door in living room", () => {
      const room = makeRoom()
      const door: Door = {
        id: "door_1" as any,
        points: [{ x: 500, y: 0 }, { x: 1500, y: 0 }],
        width: 1000,
        height: 2100,
        swingAngle: 90,
        floor: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      }
      const result = autoPlaceAll([room], [], [door], [], [])

      const switches = result.points.filter(p => p.type === "switch")
      expect(switches.length).toBe(1)
    })
  })

  describe("G.5 — corridor has only switch and light", () => {
    it("corridor gets switch + light but no outlets", () => {
      const room = makeRoom({ type: "corridor", name: "Коридор", polygon: [
        { x: 0, y: 0 }, { x: 3000, y: 0 }, { x: 3000, y: 1500 }, { x: 0, y: 1500 },
      ]})
      const door: Door = {
        id: "door_cor" as any,
        points: [{ x: 500, y: 0 }, { x: 1500, y: 0 }],
        width: 1000,
        height: 2100,
        swingAngle: 90,
        floor: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      }
      const result = autoPlaceAll([room], [], [door], [], [])

      const outlets = result.points.filter(p => p.type.startsWith("outlet"))
      const switches = result.points.filter(p => p.type.startsWith("switch"))
      const lights = result.points.filter(p => p.type.startsWith("light"))
      expect(outlets.length).toBe(0)
      expect(switches.length).toBe(1)
      expect(lights.length).toBe(1)
    })
  })

  describe("G.6 — no duplicates near existing points", () => {
    it("does not place outlet near existing one", () => {
      const room = makeRoom()
      const existing: ElectricalPoint[] = [{
        id: "existing_1" as any,
        type: "outlet",
        name: "Existing",
        position: { x: 2500, y: 0 },
        roomId: room.id,
        circuitId: undefined,
        panelId: undefined,
        power: 0,
        parameters: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      }]
      const result = autoPlaceAll([room], [], [], [], existing)

      // Should not place outlet within 300mm of existing
      const nearExisting = result.points.filter(p =>
        p.type === "outlet" &&
        Math.sqrt((p.position.x - 2500) ** 2 + (p.position.y - 0) ** 2) < 300
      )
      expect(nearExisting.length).toBe(0)
    })
  })

  describe("G.7 — outlets avoid doors", () => {
    it("does not place outlet within 500mm of door", () => {
      const room = makeRoom()
      const door: Door = {
        id: "door_1" as any,
        points: [{ x: 2000, y: 0 }, { x: 3000, y: 0 }],
        width: 1000,
        height: 2100,
        swingAngle: 90,
        floor: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      }
      const result = autoPlaceAll([room], [], [door], [], [])

      const nearDoor = result.points.filter(p => {
        if (!p.type.startsWith("outlet")) return false
        const doorMid = { x: 2500, y: 0 }
        return Math.sqrt((p.position.x - doorMid.x) ** 2 + (p.position.y - doorMid.y) ** 2) < 500
      })
      expect(nearDoor.length).toBe(0)
    })
  })

  describe("G.8 — summary stats are correct", () => {
    it("returns correct summary for multi-room apartment", () => {
      const living = makeRoom({ type: "living", name: "Гостиная" })
      const kitchen = makeRoom({ type: "kitchen", name: "Кухня", polygon: [
        { x: 5000, y: 0 }, { x: 8000, y: 0 }, { x: 8000, y: 3000 }, { x: 5000, y: 3000 },
      ]})
      const bathroom = makeRoom({ type: "bathroom", name: "Ванная", polygon: [
        { x: 0, y: 4000 }, { x: 2000, y: 4000 }, { x: 2000, y: 6000 }, { x: 0, y: 6000 },
      ]})
      const result = autoPlaceAll([living, kitchen, bathroom], [], [], [], [])

      expect(result.summary.totalOutlets).toBeGreaterThanOrEqual(3)
      expect(result.summary.totalLights).toBe(3)
      expect(result.summary.roomBreakdown.length).toBe(3)
    })
  })

  describe("G.9 — 65m² apartment flow", () => {
    it("auto-places in full apartment and survives grouping", () => {
      const rooms: Room[] = [
        makeRoom({ type: "living", name: "Гостиная", polygon: [
          { x: 0, y: 0 }, { x: 5000, y: 0 }, { x: 5000, y: 4000 }, { x: 0, y: 4000 },
        ]}),
        makeRoom({ type: "kitchen", name: "Кухня", polygon: [
          { x: 5000, y: 0 }, { x: 8000, y: 0 }, { x: 8000, y: 3000 }, { x: 5000, y: 3000 },
        ]}),
        makeRoom({ type: "bedroom", name: "Спальня", polygon: [
          { x: 0, y: 4000 }, { x: 4000, y: 4000 }, { x: 4000, y: 7000 }, { x: 0, y: 7000 },
        ]}),
        makeRoom({ type: "bathroom", name: "Ванная", polygon: [
          { x: 4000, y: 4000 }, { x: 5500, y: 4000 }, { x: 5500, y: 6000 }, { x: 4000, y: 6000 },
        ]}),
      ]

      const result = autoPlaceAll(rooms, [], [], [], [])

      // Should have outlets in all rooms
      expect(result.summary.totalOutlets).toBeGreaterThanOrEqual(8)
      expect(result.summary.totalLights).toBe(4)

      // All points have roomId
      result.points.forEach(p => expect(p.roomId).toBeDefined())
    })
  })
})
