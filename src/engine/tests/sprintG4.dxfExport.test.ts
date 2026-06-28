import { describe, it, expect } from "vitest"
import { generateDXF } from "../persistence/dxfExport"
import type { Wall, Room, Door, Window, Point } from "../types/geometry"
import type { ElectricalPoint, CableRoute } from "../types/electrical"

function makeWall(x1: number, y1: number, x2: number, y2: number): Wall {
  return {
    id: `wall_${Date.now()}` as any,
    points: [{ x: x1, y: y1 }, { x: x2, y: y2 }],
    thickness: 150, height: 2700, material: "brick", isExternal: false, floor: 1,
    createdAt: new Date(), updatedAt: new Date(),
  }
}

function makeRoom(type: string = "living"): Room {
  return {
    id: "room_1" as any, name: "Гостиная", type: type as any,
    polygon: [{ x: 0, y: 0 }, { x: 5000, y: 0 }, { x: 5000, y: 4000 }, { x: 0, y: 4000 }],
    floor: 1, ceilingHeight: 2700, area: 20, perimeter: 18, volume: 54,
    createdAt: new Date(), updatedAt: new Date(),
  }
}

function makePoint(type: string = "outlet", x: number = 1000, y: number = 500): ElectricalPoint {
  return {
    id: `p_${Date.now()}_${Math.random()}` as any,
    type: type as any, name: "Test", position: { x, y },
    power: 0, parameters: {}, createdAt: new Date(), updatedAt: new Date(),
  }
}

describe("DXF Export", () => {
  describe("G.26 — basic DXF generation", () => {
    it("generates valid DXF structure", () => {
      const dxf = generateDXF([], [], [], [], [], [])

      expect(dxf).toContain("SECTION")
      expect(dxf).toContain("HEADER")
      expect(dxf).toContain("TABLES")
      expect(dxf).toContain("ENTITIES")
      expect(dxf).toContain("EOF")
      expect(dxf).toContain("ACADVER")
    })
  })

  describe("G.27 — walls are exported", () => {
    it("exports walls as LINE entities", () => {
      const walls = [makeWall(0, 0, 5000, 0), makeWall(5000, 0, 5000, 4000)]
      const dxf = generateDXF(walls, [], [], [], [], [])

      expect(dxf).toContain("LINE")
      expect(dxf).toContain("WALLS")
      expect(dxf).toContain("0.000")
      expect(dxf).toContain("5000.000")
    })
  })

  describe("G.28 — rooms are exported", () => {
    it("exports rooms as POLYLINE with labels", () => {
      const rooms = [makeRoom()]
      const dxf = generateDXF([], rooms, [], [], [], [])

      expect(dxf).toContain("POLYLINE")
      expect(dxf).toContain("ROOMS")
      expect(dxf).toContain("Гостиная")
      expect(dxf).toContain("20.0м²")
    })
  })

  describe("G.29 — doors are exported", () => {
    it("exports doors as LINE + ARC", () => {
      const doors: Door[] = [{
        id: "door_1" as any,
        points: [{ x: 500, y: 0 }, { x: 1500, y: 0 }],
        width: 1000, height: 2100, swingAngle: 90, floor: 1,
        createdAt: new Date(), updatedAt: new Date(),
      }]
      const dxf = generateDXF([], [], doors, [], [], [])

      expect(dxf).toContain("LINE")
      expect(dxf).toContain("ARC")
      expect(dxf).toContain("DOORS")
    })
  })

  describe("G.30 — electrical points are exported", () => {
    it("exports outlets as CIRCLE with labels", () => {
      const points = [makePoint("outlet", 1000, 500), makePoint("light_ceiling", 2500, 2000)]
      const dxf = generateDXF([], [], [], [], points, [])

      expect(dxf).toContain("CIRCLE")
      expect(dxf).toContain("ELECTRICAL")
      expect(dxf).toContain("TEXT")
      expect(dxf).toContain("1000.000")
    })
  })

  describe("G.31 — panel is larger circle", () => {
    it("panel gets radius 200 vs 80 for other points", () => {
      const points = [makePoint("panel", 500, 500)]
      const dxf = generateDXF([], [], [], [], points, [])

      // Panel circle radius = 200
      const circleMatch = dxf.match(/CIRCLE[\s\S]*?40\s*\n\s*([\d.]+)/)
      expect(circleMatch).toBeTruthy()
    })
  })

  describe("G.32 — DXF is downloadable", () => {
    it("generates DXF for full project", () => {
      const walls = [
        makeWall(0, 0, 5000, 0),
        makeWall(5000, 0, 5000, 4000),
        makeWall(5000, 4000, 0, 4000),
        makeWall(0, 4000, 0, 0),
      ]
      const rooms = [makeRoom()]
      const points = [
        makePoint("outlet", 500, 300),
        makePoint("outlet", 2500, 300),
        makePoint("light_ceiling", 2500, 2000),
      ]
      const dxf = generateDXF(walls, rooms, [], [], points, [])

      expect(dxf.length).toBeGreaterThan(500)
      expect(dxf).toContain("LINE")
      expect(dxf).toContain("POLYLINE")
      expect(dxf).toContain("CIRCLE")
      expect(dxf).toContain("TEXT")
    })
  })

  describe("G.33 — options can disable layers", () => {
    it("respects includeWalls=false", () => {
      const walls = [makeWall(0, 0, 5000, 0)]
      const dxf = generateDXF(walls, [], [], [], [], [], { includeWalls: false })

      expect(dxf).not.toContain("WALLS")
    })

    it("respects includeElectrical=false", () => {
      const points = [makePoint("outlet")]
      const dxf = generateDXF([], [], [], [], points, [], { includeElectrical: false })

      expect(dxf).not.toContain("ELECTRICAL")
    })
  })

  describe("G.34 — full apartment DXF", () => {
    it("exports 65m² apartment with all layers", () => {
      const walls = [
        makeWall(0, 0, 8000, 0),
        makeWall(8000, 0, 8000, 7000),
        makeWall(8000, 7000, 0, 7000),
        makeWall(0, 7000, 0, 0),
      ]
      const rooms = [
        { ...makeRoom("living"), name: "Гостиная" },
        { ...makeRoom("kitchen"), name: "Кухня", polygon: [
          { x: 5000, y: 0 }, { x: 8000, y: 0 }, { x: 8000, y: 3000 }, { x: 5000, y: 3000 },
        ]},
      ]
      const points = [
        makePoint("outlet", 500, 300),
        makePoint("outlet", 2500, 300),
        makePoint("light_ceiling", 2500, 2000),
        makePoint("panel", 500, 3500),
      ]
      const dxf = generateDXF(walls, rooms, [], [], points, [])

      expect(dxf).toContain("Гостиная")
      expect(dxf).toContain("Кухня")
      expect(dxf).toContain("LINE")
      expect(dxf).toContain("POLYLINE")
      expect(dxf).toContain("CIRCLE")
    })
  })
})
