import { describe, it, expect, beforeEach } from "vitest"
import { EngineFacade } from "../facade/engineFacade"
import { ComponentStore } from "../core/ecs"
import { generatePanelSchedule, type PanelSchedule } from "../core/panelSchedule"
import type { CircuitGroup, ElectricalPoint } from "../types/electrical"

function makeCircuit(overrides: Partial<CircuitGroup> = {}): CircuitGroup {
  return {
    id: "circuit_1" as any,
    name: "Гр.1 Освещение",
    type: "lighting",
    floor: 1,
    points: [],
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

describe("Panel Schedule Generator", () => {
  describe("G.10 — basic schedule generation", () => {
    it("generates schedule from circuits", () => {
      const circuits = [
        makeCircuit({ name: "Гр.1 Освещение", type: "lighting", breakerId: "brk_1p_c10", phase: 1 }),
        makeCircuit({ id: "circuit_2" as any, name: "Гр.2 Розетки", type: "outlets_general", breakerId: "brk_1p_c16", phase: 2 }),
        makeCircuit({ id: "circuit_3" as any, name: "Гр.3 Кухня", type: "outlets_kitchen", breakerId: "brk_1p_c16", phase: 3 }),
      ]

      const schedule = generatePanelSchedule(circuits, [])

      expect(schedule.circuits.length).toBe(3)
      expect(schedule.panelName).toBe("ЩЭ")
      expect(schedule.mainBreaker.rating).toBe(50)
    })
  })

  describe("G.11 — breaker info is correct", () => {
    it("maps breaker IDs to models and ratings", () => {
      const circuits = [
        makeCircuit({ breakerId: "brk_1p_c16", cableId: "cable_cu_3x2.5" }),
      ]
      const schedule = generatePanelSchedule(circuits, [])

      expect(schedule.circuits[0].breakerModel).toBe("ABB SH200L C16")
      expect(schedule.circuits[0].breakerRating).toBe(16)
      expect(schedule.circuits[0].cableType).toBe("ВВГнг-LS 3×2.5")
    })
  })

  describe("G.12 — load percent is calculated", () => {
    it("calculates load as percentage of breaker rating", () => {
      const circuits = [
        makeCircuit({
          breakerId: "brk_1p_c16",
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
      const schedule = generatePanelSchedule(circuits, [])

      expect(schedule.circuits[0].loadPercent).toBe(42) // 6.72/16 = 42%
    })
  })

  describe("G.13 — phase summary is correct", () => {
    it("calculates per-phase power distribution", () => {
      const circuits = [
        makeCircuit({ phase: 1, load: { totalPower: 1000, totalCurrent: 4.5, demandFactor: 0.7, simultaneousFactor: 0.6, effectivePower: 420, effectiveCurrent: 1.91 } }),
        makeCircuit({ id: "c2" as any, phase: 2, load: { totalPower: 2000, totalCurrent: 9.1, demandFactor: 0.7, simultaneousFactor: 0.6, effectivePower: 840, effectiveCurrent: 3.82 } }),
        makeCircuit({ id: "c3" as any, phase: 3, load: { totalPower: 1500, totalCurrent: 6.8, demandFactor: 0.7, simultaneousFactor: 0.6, effectivePower: 630, effectiveCurrent: 2.86 } }),
      ]
      const schedule = generatePanelSchedule(circuits, [])

      expect(schedule.summary.phase1Power).toBe(420)
      expect(schedule.summary.phase2Power).toBe(840)
      expect(schedule.summary.phase3Power).toBe(630)
      expect(schedule.summary.phaseBalance).toBeLessThanOrEqual(50)
    })
  })

  describe("G.14 — circuits sorted by phase", () => {
    it("sorts circuits by phase number then name", () => {
      const circuits = [
        makeCircuit({ name: "Гр.3", phase: 3 }),
        makeCircuit({ id: "c2" as any, name: "Гр.1", phase: 1 }),
        makeCircuit({ id: "c3" as any, name: "Гр.2", phase: 2 }),
      ]
      const schedule = generatePanelSchedule(circuits, [])

      expect(schedule.circuits[0].phase).toBe(1)
      expect(schedule.circuits[1].phase).toBe(2)
      expect(schedule.circuits[2].phase).toBe(3)
    })
  })

  describe("G.15 — point count per circuit", () => {
    it("counts points in each circuit", () => {
      const circuits = [
        makeCircuit({ points: ["p1", "p2", "p3"] as any[] }),
      ]
      const points: ElectricalPoint[] = [
        { id: "p1" as any, type: "outlet", name: "Р1", position: { x: 0, y: 0 }, circuitId: "c1" as any, power: 0, parameters: {}, createdAt: new Date(), updatedAt: new Date() },
        { id: "p2" as any, type: "outlet", name: "Р2", position: { x: 100, y: 0 }, circuitId: "c1" as any, power: 0, parameters: {}, createdAt: new Date(), updatedAt: new Date() },
        { id: "p3" as any, type: "light_ceiling", name: "Л1", position: { x: 50, y: 50 }, circuitId: "c1" as any, power: 80, parameters: {}, createdAt: new Date(), updatedAt: new Date() },
      ]
      const schedule = generatePanelSchedule(circuits, points)

      expect(schedule.circuits[0].pointCount).toBe(3)
    })
  })

  describe("G.16 — empty circuits produce valid schedule", () => {
    it("handles empty circuit list", () => {
      const schedule = generatePanelSchedule([], [])

      expect(schedule.circuits.length).toBe(0)
      expect(schedule.summary.totalPower).toBe(0)
      expect(schedule.summary.totalCurrent).toBe(0)
      expect(schedule.summary.utilizationPercent).toBe(0)
    })
  })

  describe("G.17 — full apartment panel schedule", () => {
    it("generates schedule for 65m² apartment", () => {
      const circuits = [
        makeCircuit({ name: "Гр.1 Освещение", type: "lighting", breakerId: "brk_1p_c10", phase: 1, points: ["l1", "l2", "l3", "l4"] as any[], load: { totalPower: 320, totalCurrent: 1.45, demandFactor: 0.7, simultaneousFactor: 0.6, effectivePower: 134.4, effectiveCurrent: 0.61 } }),
        makeCircuit({ id: "c2" as any, name: "Гр.2 Розетки жилые", type: "outlets_general", breakerId: "brk_1p_c16", phase: 2, points: ["o1", "o2", "o3", "o4"] as any[], load: { totalPower: 2000, totalCurrent: 9.09, demandFactor: 0.7, simultaneousFactor: 0.6, effectivePower: 840, effectiveCurrent: 3.82 } }),
        makeCircuit({ id: "c3" as any, name: "Гр.3 Кухня", type: "outlets_kitchen", breakerId: "brk_1p_c16", phase: 3, points: ["o5", "o6", "o7"] as any[], load: { totalPower: 5400, totalCurrent: 24.5, demandFactor: 0.7, simultaneousFactor: 0.6, effectivePower: 2268, effectiveCurrent: 10.31 } }),
        makeCircuit({ id: "c4" as any, name: "Гр.4 Ванная", type: "outlets_bathroom", breakerId: "brk_1p_c16", phase: 1, points: ["o8"] as any[], load: { totalPower: 700, totalCurrent: 3.18, demandFactor: 0.7, simultaneousFactor: 0.6, effectivePower: 294, effectiveCurrent: 1.34 } }),
      ]

      const schedule = generatePanelSchedule(circuits, [])

      expect(schedule.circuits.length).toBe(4)
      expect(schedule.summary.totalPower).toBeGreaterThan(0)
      expect(schedule.summary.utilizationPercent).toBeGreaterThan(0)
      expect(schedule.summary.utilizationPercent).toBeLessThanOrEqual(100)
    })
  })
})
