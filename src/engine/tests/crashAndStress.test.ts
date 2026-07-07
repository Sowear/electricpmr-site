import { describe, it, expect, beforeEach } from "vitest"
import { EngineFacade } from "../facade/engineFacade"
import { ComponentStore } from "../core/ecs"

type UUID = string

function resetEngine(): void {
  EngineFacade.clear()
}

// ============================================================
// CRASH TESTS — граничные сценарии
// ============================================================

describe("Crash: empty scene operations", () => {
  beforeEach(() => resetEngine())

  it("undo on empty stack — no crash", () => {
    expect(() => EngineFacade.undo()).not.toThrow()
    expect(EngineFacade.undo()).toBe(false)
  })

  it("redo on empty stack — no crash", () => {
    expect(() => EngineFacade.redo()).not.toThrow()
    expect(EngineFacade.redo()).toBe(false)
  })

  it("validate empty project — no crash", () => {
    const report = EngineFacade.validateProject()
    expect(report.valid).toBe(true)
    expect(report.errors).toHaveLength(0)
    expect(report.objectCount).toBe(0)
  })

  it("save and load empty project — no crash", () => {
    const saved = EngineFacade.saveProject("empty")
    resetEngine()
    expect(() => EngineFacade.loadProject(saved)).not.toThrow()
    expect(EngineFacade.getStats().entities).toBe(0)
  })

  it("queryByType on empty — returns empty array", () => {
    expect(EngineFacade.queryByType("wall")).toEqual([])
    expect(EngineFacade.queryByType("outlet")).toEqual([])
  })

  it("getEntity on non-existent ID — undefined", () => {
    expect(EngineFacade.getEntity("non-existent-id")).toBeUndefined()
  })

  it("destroyEntity on non-existent ID — no crash", () => {
    expect(() => EngineFacade.destroyEntity("ghost-id")).not.toThrow()
  })
})

describe("Crash: negative and extreme coordinates", () => {
  beforeEach(() => resetEngine())

  it("wall with negative coordinates", () => {
    const id = EngineFacade.createWall(-5000, -5000, -1000, -1000)
    const entity = EngineFacade.getEntity(id)
    expect(entity).toBeDefined()
    expect(entity!.geometry!.x).toBe(-5000)
    expect(entity!.geometry!.y).toBe(-5000)
  })

  it("outlet with negative coordinates", () => {
    const id = EngineFacade.createOutlet(-200, -300)
    const entity = EngineFacade.getEntity(id)
    expect(entity!.geometry!.x).toBe(-200)
    expect(entity!.geometry!.y).toBe(-300)
  })

  it("wall with zero-length (degenerate)", () => {
    const id = EngineFacade.createWall(100, 100, 100, 100)
    const entity = EngineFacade.getEntity(id)
    expect(entity!.geometry!.width).toBe(0)
  })

  it("outlet at origin (0,0)", () => {
    const id = EngineFacade.createOutlet(0, 0)
    const entity = EngineFacade.getEntity(id)
    expect(entity!.geometry!.x).toBe(0)
    expect(entity!.geometry!.y).toBe(0)
  })

  it("large coordinates (1km x 1km)", () => {
    const id = EngineFacade.createWall(0, 0, 1000000, 1000000)
    const entity = EngineFacade.getEntity(id)
    expect(entity!.geometry!.width).toBeCloseTo(1414213.56, -1)
  })

  it("huge coordinate value does not crash JSON serialization", () => {
    EngineFacade.createWall(1e15, 0, 1e15 + 5000, 0)
    const saved = EngineFacade.saveProject("huge")
    resetEngine()
    expect(() => EngineFacade.loadProject(saved)).not.toThrow()
  })
})

describe("Crash: duplicate and null edge cases", () => {
  beforeEach(() => resetEngine())

  it("double delete of same entity", () => {
    const id = EngineFacade.createOutlet(100, 100)
    EngineFacade.destroyEntity(id)
    expect(() => EngineFacade.destroyEntity(id)).not.toThrow()
  })

  it("delete then undo then delete again", () => {
    const id = EngineFacade.createOutlet(100, 100)
    EngineFacade.destroyEntity(id)
    EngineFacade.undo()
    expect(() => EngineFacade.destroyEntity(id)).not.toThrow()
  })

  it("create entity with empty component map", () => {
    const id = EngineFacade.createEntity({})
    expect(id).toBeDefined()
    const entity = EngineFacade.getEntity(id)
    expect(entity).toBeDefined()
  })

  // BUG: addComponent should handle missing entity gracefully (throws "Entity ghost does not exist")
  it("addComponent to non-existent entity — throws (needs fix)", () => {
    expect(() =>
      EngineFacade.addComponent("ghost", "visual", { shape: "rect", fill: "#000" } as never)
    ).toThrow()
  })

  it("removeComponent from non-existent entity — no crash", () => {
    expect(() => EngineFacade.removeComponent("ghost", "geometry")).not.toThrow()
  })

  it("moveEntity on non-existent entity — throws", () => {
    expect(() => EngineFacade.moveEntity("ghost", 100, 100)).toThrow()
  })
})

describe("Crash: relationship edge cases", () => {
  beforeEach(() => resetEngine())

  // BUG: addRelationship should handle missing entity gracefully (throws "Object a not found")
  it("add relationship between non-existent entities — throws (needs fix)", () => {
    expect(() =>
      EngineFacade.addRelationship("a", "b", "poweredBy" as never)
    ).toThrow()
  })

  // BUG: removeRelationship should handle non-existent ID gracefully (throws "Relationship ghost not found")
  it("remove non-existent relationship — throws (needs fix)", () => {
    expect(() => EngineFacade.removeRelationship("ghost")).toThrow()
  })

  it("add self-referential relationship", () => {
    const id = EngineFacade.createOutlet(100, 100)
    expect(() =>
      EngineFacade.addRelationship(id, id, "poweredBy" as never)
    ).not.toThrow()
  })
})

// ============================================================
// STRESS TESTS — выносливость
// ============================================================

describe("Stress: 200 walls", () => {
  beforeEach(() => resetEngine())

  it("creates 200 walls without crash", { timeout: 15000 }, () => {
    for (let i = 0; i < 200; i++) {
      EngineFacade.createWall(i * 10, 0, i * 10 + 1000, 200)
    }
    const walls = EngineFacade.queryByType("wall")
    expect(walls.length).toBe(200)
  })

  it("creates 200 walls, validates project", { timeout: 15000 }, () => {
    for (let i = 0; i < 200; i++) {
      EngineFacade.createWall(i * 10, 0, i * 10 + 1000, 200)
    }
    const report = EngineFacade.validateProject()
    expect(report.valid).toBe(true)
    expect(report.objectCount).toBe(200)
  })
})

describe("Stress: 200 outlets", () => {
  beforeEach(() => resetEngine())

  it("creates 200 outlets without crash", { timeout: 15000 }, () => {
    for (let i = 0; i < 200; i++) {
      EngineFacade.createOutlet(i * 50, 100)
    }
    const outlets = EngineFacade.queryByType("outlet")
    expect(outlets.length).toBe(200)
  })

  it("creates 200 outlets + saves + loads", { timeout: 15000 }, () => {
    for (let i = 0; i < 200; i++) {
      EngineFacade.createOutlet(i * 50, 100)
    }
    const saved = EngineFacade.saveProject("200-outlets")
    resetEngine()
    EngineFacade.loadProject(saved)
    const outlets = EngineFacade.queryByType("outlet")
    expect(outlets.length).toBe(200)
  })
})

describe("Stress: mixed 500 entities", () => {
  beforeEach(() => resetEngine())

  it("creates 500 mixed entities without crash", () => {
    for (let i = 0; i < 100; i++) {
      EngineFacade.createWall(i * 100, 0, i * 100 + 4000, 200)
      EngineFacade.createOutlet(i * 100 + 500, 300)
      EngineFacade.createLight(i * 100 + 500, 1000)
      EngineFacade.createSwitch(i * 100 + 500, 2000)
      EngineFacade.createPanel(i * 100 + 500, 3000)
    }
    expect(EngineFacade.getStats().entities).toBe(500)
  })

  it("500 entities roundtrip save/load preserves types", () => {
    for (let i = 0; i < 100; i++) {
      EngineFacade.createWall(i * 100, 0, i * 100 + 4000, 200)
      EngineFacade.createOutlet(i * 100 + 500, 300)
      EngineFacade.createLight(i * 100 + 500, 1000)
      EngineFacade.createSwitch(i * 100 + 500, 2000)
      EngineFacade.createPanel(i * 100 + 500, 3000)
    }
    const saved = EngineFacade.saveProject("mixed-500")
    resetEngine()
    EngineFacade.loadProject(saved)

    expect(EngineFacade.queryByType("wall").length).toBe(100)
    expect(EngineFacade.queryByType("outlet").length).toBe(100)
    expect(EngineFacade.queryByType("light_ceiling").length).toBe(100)
    expect(EngineFacade.queryByType("switch").length).toBe(100)
    expect(EngineFacade.queryByType("panel").length).toBe(100)
  })
})

describe("Stress: rapid undo/redo cycles", () => {
  beforeEach(() => resetEngine())

  it("100 undo/redo cycles", () => {
    for (let cycle = 0; cycle < 100; cycle++) {
      EngineFacade.createOutlet(cycle * 10, cycle * 10)
    }
    expect(EngineFacade.queryByType("outlet").length).toBe(100)

    for (let cycle = 0; cycle < 100; cycle++) {
      EngineFacade.undo()
    }
    expect(EngineFacade.queryByType("outlet").length).toBe(0)

    for (let cycle = 0; cycle < 100; cycle++) {
      EngineFacade.redo()
    }
    expect(EngineFacade.queryByType("outlet").length).toBe(100)
  })

  it("no state drift after 50 undo/redo cycles", () => {
    const id = EngineFacade.createOutlet(500, 500)
    const originalPos = EngineFacade.getEntity(id)!.geometry!.x

    for (let i = 0; i < 50; i++) {
      EngineFacade.undo()
      EngineFacade.redo()
    }

    const posAfter = EngineFacade.getEntity(id)!.geometry!.x
    expect(posAfter).toBe(originalPos)
  })
})

describe("Stress: large project with relationships", () => {
  beforeEach(() => resetEngine())

  it("creates panel + 100 breakers + 200 outlets with relations", { timeout: 15000 }, () => {
    const panelId = EngineFacade.createPanel(200, 100)
    const breakerIds: UUID[] = []
    const outletIds: UUID[] = []

    for (let i = 0; i < 100; i++) {
      const breaker = EngineFacade.createBreaker(panelId, { rating: 16 })
      breakerIds.push(breaker)
    }

    for (let i = 0; i < 200; i++) {
      const outlet = EngineFacade.createOutlet(i * 20, 300, { panelId })
      outletIds.push(outlet)
    }

    for (let i = 0; i < 100; i++) {
      EngineFacade.addRelationship(outletIds[i], breakerIds[i % 100], "poweredBy")
    }

    expect(EngineFacade.getStats().entities).toBe(301) // 1 panel + 100 breakers + 200 outlets
  })
})

// ============================================================
// BUG FINDERS — известные сценарии сбоев
// ============================================================

describe("Bug: reference integrity", () => {
  beforeEach(() => resetEngine())

  it("deleting panel referenced by outlet — outlet still exists", () => {
    const panelId = EngineFacade.createPanel(0, 0)
    const outletId = EngineFacade.createOutlet(100, 100, { panelId })
    EngineFacade.destroyEntity(panelId)

    const outlet = EngineFacade.getEntity(outletId)
    expect(outlet).toBeDefined()
  })

  it("deleting breaker referenced by outlet — no cascade crash", () => {
    const panelId = EngineFacade.createPanel(0, 0)
    const breakerId = EngineFacade.createBreaker(panelId)
    const outletId = EngineFacade.createOutlet(100, 100, { panelId })

    EngineFacade.addRelationship(outletId, breakerId, "poweredBy")
    EngineFacade.destroyEntity(breakerId)

    const outlet = EngineFacade.getEntity(outletId)
    expect(outlet).toBeDefined()
  })
})

describe("Bug: serialization with Date objects", () => {
  beforeEach(() => resetEngine())

  it("dates survive JSON serialization roundtrip", () => {
    EngineFacade.createOutlet(100, 100)
    const saved = EngineFacade.saveProject("date-test")
    const raw = JSON.stringify(saved)
    const parsed = JSON.parse(raw)
    resetEngine()
    expect(() => EngineFacade.loadProject(parsed)).not.toThrow()
  })
})

describe("Bug: undo/redo after save/load", () => {
  beforeEach(() => resetEngine())

  it("undo after save/load does not corrupt", () => {
    EngineFacade.createOutlet(100, 100)
    const saved = EngineFacade.saveProject("test")
    resetEngine()
    EngineFacade.loadProject(saved)

    // Undo after load should not crash even though history is empty
    expect(() => EngineFacade.undo()).not.toThrow()
  })

  it("undo after load with new operations", () => {
    EngineFacade.createOutlet(100, 100)
    const saved = EngineFacade.saveProject("test")
    resetEngine()
    EngineFacade.loadProject(saved)

    EngineFacade.createOutlet(200, 200)
    EngineFacade.undo()

    const outlets = EngineFacade.queryByType("outlet")
    expect(outlets.length).toBe(1) // the one from load, not the new one
  })
})

describe("Bug: multiple projects in sequence", () => {
  beforeEach(() => resetEngine())

  it("create, save, clear, load two different projects", () => {
    // Project A
    EngineFacade.createWall(0, 0, 4000, 0)
    const projA = EngineFacade.saveProject("Project A")

    resetEngine()

    // Project B
    EngineFacade.createOutlet(500, 500)
    EngineFacade.createOutlet(1000, 1000)
    const projB = EngineFacade.saveProject("Project B")

    resetEngine()
    EngineFacade.loadProject(projA)
    expect(EngineFacade.queryByType("wall").length).toBe(1)
    expect(EngineFacade.queryByType("outlet").length).toBe(0)

    resetEngine()
    EngineFacade.loadProject(projB)
    expect(EngineFacade.queryByType("wall").length).toBe(0)
    expect(EngineFacade.queryByType("outlet").length).toBe(2)
  })
})

describe("Bug: clear then immediate operations", () => {
  beforeEach(() => resetEngine())

  it("clear followed by create works", () => {
    resetEngine()
    const id = EngineFacade.createOutlet(50, 50)
    expect(EngineFacade.getEntity(id)).toBeDefined()
  })

  it("double clear does not crash", () => {
    EngineFacade.clear()
    expect(() => EngineFacade.clear()).not.toThrow()
  })
})

describe("Bug: outlet with unusual coordinates", () => {
  beforeEach(() => resetEngine())

  it("outlet with NaN coordinates — should not crash facade", () => {
    expect(() => EngineFacade.createOutlet(NaN, NaN)).not.toThrow()
  })

  it("outlet with Infinity coordinates", () => {
    expect(() => EngineFacade.createOutlet(Infinity, 0)).not.toThrow()
  })
})

describe("Bug: wall with inverted coordinates", () => {
  beforeEach(() => resetEngine())

  it("wall with x2 < x1 (right-to-left)", () => {
    const id = EngineFacade.createWall(4000, 0, 0, 0)
    const entity = EngineFacade.getEntity(id)
    expect(entity!.geometry!.width).toBe(4000)
  })

  it("wall with y2 < y1 (bottom-to-top)", () => {
    const id = EngineFacade.createWall(0, 4000, 0, 0)
    const entity = EngineFacade.getEntity(id)
    expect(entity!.geometry!.width).toBe(4000)
  })
})
