import { describe, it, expect } from "vitest"
import { generateCableJournal, type CableJournal } from "../core/cableJournal"
import type { CircuitGroup, CableRoute, ElectricalPoint } from "../types/electrical"

function makeCircuit(overrides: Partial<CircuitGroup> = {}): CircuitGroup {
  return {
    id: "circuit_1" as any,
    name: "Гр.1 Освещение",
    type: "lighting",
    floor: 1,
    points: ["p1"] as any[],
    load: {
      totalPower: 800,
      totalCurrent: 3.6,
      demandFactor: 0.7,
      simultaneousFactor: 0.6,
      effectivePower: 336,
      effectiveCurrent: 1.53,
    },
    phase: 1,
    color: "#eab308",
    breakerId: "brk_1p_c10",
    cableId: "cable_cu_3x1.5",
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  }
}

function makePoint(overrides: Partial<ElectricalPoint> = {}): ElectricalPoint {
  return {
    id: "p1" as any,
    type: "outlet",
    name: "Розетка",
    position: { x: 1000, y: 500 },
    circuitId: "c1" as any,
    power: 0,
    parameters: {},
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  }
}

describe("Cable Journal Generator", () => {
  describe("G.18 — basic cable journal", () => {
    it("generates journal from circuits and cables", () => {
      const circuits = [
        makeCircuit({ cableId: "cable_cu_3x1.5" }),
        makeCircuit({ id: "c2" as any, name: "Гр.2 Розетки", cableId: "cable_cu_3x2.5", points: ["p2"] as any[] }),
      ]
      const journal = generateCableJournal(circuits, [], [])

      expect(journal.rows.length).toBe(2)
      expect(journal.summary.totalLength).toBeGreaterThan(0)
    })
  })

  describe("G.19 — cable info is correct", () => {
    it("maps cable IDs to specs", () => {
      const circuits = [makeCircuit({ cableId: "cable_cu_3x2.5" })]
      const journal = generateCableJournal(circuits, [], [])

      expect(journal.rows[0].cableLabel).toBe("ВВГнг-LS 3×2.5")
      expect(journal.rows[0].crossSection).toBe(2.5)
      expect(journal.rows[0].cores).toBe(3)
      expect(journal.rows[0].currentCapacity).toBe(25)
    })
  })

  describe("G.20 — voltage drop is calculated", () => {
    it("calculates voltage drop for long cable run", () => {
      const circuits = [
        makeCircuit({
          cableId: "cable_cu_3x1.5",
          load: {
            totalPower: 3520,
            totalCurrent: 16,
            demandFactor: 0.7,
            simultaneousFactor: 0.6,
            effectivePower: 1478.4,
            effectiveCurrent: 6.72,
          },
        }),
      ]
      // Cable with length=50m
      const cables: CableRoute[] = [{
        id: "route_1" as any,
        cableId: "cable_cu_3x1.5" as any,
        from: "p1" as any,
        to: "panel" as any,
        waypoints: [],
        length: 50,
        method: "in_wall",
        viaJunctionBoxes: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      }]
      const journal = generateCableJournal(circuits, cables, [])

      expect(journal.rows[0].length).toBe(50)
      expect(journal.rows[0].voltageDrop).toBeGreaterThan(0)
    })
  })

  describe("G.21 — overload detection", () => {
    it("detects when cable is overloaded", () => {
      const circuits = [
        makeCircuit({
          cableId: "cable_cu_3x1.5", // 16.5A capacity
          load: {
            totalPower: 5000,
            totalCurrent: 22.7,
            demandFactor: 0.7,
            simultaneousFactor: 0.6,
            effectivePower: 2100,
            effectiveCurrent: 9.55,
          },
        }),
      ]
      const journal = generateCableJournal(circuits, [], [])

      expect(journal.rows[0].utilizationPercent).toBeGreaterThan(50)
    })
  })

  describe("G.22 — summary stats", () => {
    it("calculates total length, cost, and max voltage drop", () => {
      const circuits = [
        makeCircuit({ cableId: "cable_cu_3x1.5", points: ["p1"] as any[] }),
        makeCircuit({ id: "c2" as any, name: "Гр.2", cableId: "cable_cu_3x2.5", points: ["p2"] as any[] }),
      ]
      const cables: CableRoute[] = [
        { id: "r1" as any, cableId: "cable_cu_3x1.5" as any, from: "p1" as any, to: "panel" as any, waypoints: [], length: 10, method: "in_wall", viaJunctionBoxes: [], createdAt: new Date(), updatedAt: new Date() },
        { id: "r2" as any, cableId: "cable_cu_3x2.5" as any, from: "p2" as any, to: "panel" as any, waypoints: [], length: 15, method: "in_wall", viaJunctionBoxes: [], createdAt: new Date(), updatedAt: new Date() },
      ]
      const journal = generateCableJournal(circuits, cables, [])

      expect(journal.summary.totalLength).toBe(25)
      // reserve is per-row: ceil(10*1.15)=12 + ceil(15*1.15)=18 = 30
      expect(journal.summary.totalLengthWithReserve).toBe(30)
      expect(journal.summary.totalCost).toBeGreaterThan(0)
      expect(journal.summary.maxVoltageDrop).toBeGreaterThanOrEqual(0)
    })
  })

  describe("G.23 — empty circuits produce valid journal", () => {
    it("handles empty input", () => {
      const journal = generateCableJournal([], [], [])

      expect(journal.rows.length).toBe(0)
      expect(journal.summary.totalLength).toBe(0)
      expect(journal.summary.totalCost).toBe(0)
    })
  })

  describe("G.24 — 15% reserve is applied", () => {
    it("adds 15% reserve to cable length", () => {
      const circuits = [makeCircuit()]
      const cables: CableRoute[] = [{
        id: "r1" as any, cableId: "cable_cu_3x1.5" as any, from: "p1" as any, to: "panel" as any,
        waypoints: [], length: 20, method: "in_wall", viaJunctionBoxes: [],
        createdAt: new Date(), updatedAt: new Date(),
      }]
      const journal = generateCableJournal(circuits, cables, [])

      expect(journal.rows[0].length).toBe(20)
      expect(journal.rows[0].lengthWithReserve).toBe(23) // 20 * 1.15 = 23
    })
  })

  describe("G.25 — full apartment cable journal", () => {
    it("generates journal for 65m² apartment", () => {
      const circuits = [
        makeCircuit({ name: "Гр.1 Освещение", cableId: "cable_cu_3x1.5", points: ["l1", "l2", "l3", "l4"] as any[] }),
        makeCircuit({ id: "c2" as any, name: "Гр.2 Розетки", cableId: "cable_cu_3x2.5", points: ["o1", "o2", "o3"] as any[] }),
        makeCircuit({ id: "c3" as any, name: "Гр.3 Кухня", cableId: "cable_cu_3x2.5", points: ["o4", "o5"] as any[] }),
        makeCircuit({ id: "c4" as any, name: "Гр.4 Ванная", cableId: "cable_cu_3x2.5", points: ["o6"] as any[] }),
      ]
      const points = [
        makePoint({ id: "l1" as any, position: { x: 1000, y: 1000 } }),
        makePoint({ id: "l2" as any, position: { x: 3000, y: 1000 } }),
        makePoint({ id: "l3" as any, position: { x: 1000, y: 3000 } }),
        makePoint({ id: "l4" as any, position: { x: 3000, y: 3000 } }),
        makePoint({ id: "o1" as any, position: { x: 500, y: 500 } }),
        makePoint({ id: "o2" as any, position: { x: 2500, y: 500 } }),
        makePoint({ id: "o3" as any, position: { x: 4000, y: 2000 } }),
        makePoint({ id: "o4" as any, position: { x: 5500, y: 1000 } }),
        makePoint({ id: "o5" as any, position: { x: 7000, y: 1500 } }),
        makePoint({ id: "o6" as any, position: { x: 1000, y: 5000 } }),
      ]

      const journal = generateCableJournal(circuits, [], points)

      expect(journal.rows.length).toBe(4)
      expect(journal.summary.totalLength).toBeGreaterThan(0)
      expect(journal.summary.totalCost).toBeGreaterThan(0)
      journal.rows.forEach(r => {
        expect(r.cableLabel).toContain("ВВГнг-LS")
        expect(r.lengthWithReserve).toBeGreaterThanOrEqual(r.length)
      })
    })
  })
})
