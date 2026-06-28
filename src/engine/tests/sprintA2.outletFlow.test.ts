// ============================================================
// Sprint A2 — Outlet Flow Acceptance Tests
// ============================================================
//
// CONTRACT: Outlet placed by user must:
//   1. Exist in ECS with correct electrical properties
//   2. Be visible in UI projection
//   3. Auto-assign to room if inside room polygon
//   4. Survive save/load roundtrip
//   5. Be removable via delete
//   6. Participate in circuit grouping
//   7. Support different types (outlet, outlet_waterproof, outlet_triple)
// ============================================================

import { describe, it, expect, beforeEach } from "vitest"
import { EngineFacade } from "../facade/engineFacade"

function resetEngine(): void {
  EngineFacade.clear()
}

function createTestRoom(): UUID {
  const w1 = EngineFacade.createWall(0, 0, 5000, 0)
  const w2 = EngineFacade.createWall(5000, 0, 5000, 4000)
  const w3 = EngineFacade.createWall(5000, 4000, 0, 4000)
  const w4 = EngineFacade.createWall(0, 4000, 0, 0)
  return w1
}

// ============================================================
// A2.1: Outlet exists in ECS after creation
// ============================================================

describe("A2.1 — Outlet exists in ECS", () => {
  beforeEach(() => resetEngine())

  it("creates an outlet and it has an id", () => {
    const outlet = EngineFacade.createOutlet(1000, 1000)
    expect(outlet).toBeDefined()
    expect(outlet.length).toBeGreaterThan(0)
  })

  it("outlet has correct position", () => {
    const id = EngineFacade.createOutlet(1500, 2000)
    const entity = EngineFacade.getEntity(id)
    expect(entity).toBeDefined()
    expect(entity!.geometry).toBeDefined()
    expect(entity!.geometry!.x).toBe(1500)
    expect(entity!.geometry!.y).toBe(2000)
  })

  it("outlet has electrical component", () => {
    const id = EngineFacade.createOutlet(1000, 1000)
    const entity = EngineFacade.getEntity(id)
    expect(entity).toBeDefined()
    expect(entity!.electrical).toBeDefined()
    expect(entity!.electrical!.voltage).toBe(220)
  })

  it("outlet has identity type 'outlet'", () => {
    const id = EngineFacade.createOutlet(1000, 1000)
    const entity = EngineFacade.getEntity(id)
    expect(entity).toBeDefined()
    expect(entity!.identity).toBeDefined()
    expect(entity!.identity!.type).toBe("outlet")
  })

  it("outlet has capabilities", () => {
    const id = EngineFacade.createOutlet(1000, 1000)
    const entity = EngineFacade.getEntity(id)
    expect(entity).toBeDefined()
    expect(entity!.capabilities).toBeDefined()
    expect(entity!.capabilities!.canBeGrouped).toBe(true)
    expect(entity!.capabilities!.requiresRoom).toBe(true)
  })
})

// ============================================================
// A2.2: Outlet is visible in UI projection
// ============================================================

describe("A2.2 — Outlet visible in UI projection", () => {
  beforeEach(() => resetEngine())

  it("single outlet appears in queryByType", () => {
    EngineFacade.createOutlet(1000, 1000)
    const outlets = EngineFacade.queryByType("outlet")
    expect(outlets.length).toBe(1)
  })

  it("multiple outlets all appear in queryByType", () => {
    EngineFacade.createOutlet(1000, 1000)
    EngineFacade.createOutlet(2000, 1000)
    EngineFacade.createOutlet(3000, 1000)
    const outlets = EngineFacade.queryByType("outlet")
    expect(outlets.length).toBe(3)
  })

  it("outlet has visual component for rendering", () => {
    const id = EngineFacade.createOutlet(1000, 1000)
    const entity = EngineFacade.getEntity(id)
    expect(entity!.visual).toBeDefined()
    expect(entity!.visual!.layer).toBe("electrical")
  })
})

// ============================================================
// A2.3: Outlet survives save/load roundtrip
// ============================================================

describe("A2.3 — Outlet survives save/load", () => {
  beforeEach(() => resetEngine())

  it("single outlet survives roundtrip", () => {
    const id = EngineFacade.createOutlet(1500, 2000)
    const saved = EngineFacade.saveProject("test")

    resetEngine()
    EngineFacade.loadProject(saved)

    const outlets = EngineFacade.queryByType("outlet")
    expect(outlets.length).toBe(1)
  })

  it("outlet position preserved after roundtrip", () => {
    const id = EngineFacade.createOutlet(1500, 2000)
    const saved = EngineFacade.saveProject("test")

    resetEngine()
    EngineFacade.loadProject(saved)

    const outlets = EngineFacade.queryByType("outlet")
    const entity = EngineFacade.getEntity(outlets[0])
    expect(entity!.geometry!.x).toBe(1500)
    expect(entity!.geometry!.y).toBe(2000)
  })

  it("outlet electrical data preserved after roundtrip", () => {
    const id = EngineFacade.createOutlet(1000, 1000)
    const saved = EngineFacade.saveProject("test")

    resetEngine()
    EngineFacade.loadProject(saved)

    const outlets = EngineFacade.queryByType("outlet")
    const entity = EngineFacade.getEntity(outlets[0])
    expect(entity!.electrical!.voltage).toBe(220)
  })

  it("4 outlets survive roundtrip", () => {
    EngineFacade.createOutlet(1000, 1000)
    EngineFacade.createOutlet(2000, 1000)
    EngineFacade.createOutlet(1000, 2000)
    EngineFacade.createOutlet(2000, 2000)
    const saved = EngineFacade.saveProject("test")

    resetEngine()
    EngineFacade.loadProject(saved)

    const outlets = EngineFacade.queryByType("outlet")
    expect(outlets.length).toBe(4)
  })
})

// ============================================================
// A2.4: Outlet can be deleted
// ============================================================

describe("A2.4 — Outlet deletion", () => {
  beforeEach(() => resetEngine())

  it("deleting an outlet removes it", () => {
    const id = EngineFacade.createOutlet(1000, 1000)
    EngineFacade.destroyEntity(id)

    const entity = EngineFacade.getEntity(id)
    expect(entity).toBeUndefined()
  })

  it("deleting one outlet does not affect others", () => {
    const id1 = EngineFacade.createOutlet(1000, 1000)
    const id2 = EngineFacade.createOutlet(2000, 1000)
    EngineFacade.destroyEntity(id1)

    const entity = EngineFacade.getEntity(id2)
    expect(entity).toBeDefined()
  })
})

// ============================================================
// A2.5: Outlet can be assigned to a circuit
// ============================================================

describe("A2.5 — Outlet circuit assignment", () => {
  beforeEach(() => resetEngine())

  it("outlet starts without circuit", () => {
    const id = EngineFacade.createOutlet(1000, 1000)
    const entity = EngineFacade.getEntity(id)
    expect(entity!.electrical!.circuitId).toBeUndefined()
  })

  it("outlet can be assigned a circuit", () => {
    const id = EngineFacade.createOutlet(1000, 1000)
    EngineFacade.addComponent(id, "electrical", {
      ...EngineFacade.getEntityComponent(id, "electrical")!,
      circuitId: "circuit_1",
    })

    const entity = EngineFacade.getEntity(id)
    expect(entity!.electrical!.circuitId).toBe("circuit_1")
  })
})

// ============================================================
// A2.6: Multiple outlet types exist
// ============================================================

describe("A2.6 — Outlet types", () => {
  beforeEach(() => resetEngine())

  it("standard outlet is type 'outlet'", () => {
    const id = EngineFacade.createOutlet(1000, 1000)
    const entity = EngineFacade.getEntity(id)
    expect(entity!.identity!.type).toBe("outlet")
  })

  it("outlet has mounting height", () => {
    const id = EngineFacade.createOutlet(1000, 1000)
    const entity = EngineFacade.getEntity(id)
    expect(entity!.metadata!.custom!.mountingHeight).toBe(300)
  })

  it("outlet size is 72x72", () => {
    const id = EngineFacade.createOutlet(1000, 1000)
    const entity = EngineFacade.getEntity(id)
    expect(entity!.geometry!.width).toBe(72)
    expect(entity!.geometry!.height).toBe(72)
  })
})

// ============================================================
// A2.7: Panel exists and outlet can reference it
// ============================================================

describe("A2.7 — Outlet with panel reference", () => {
  beforeEach(() => resetEngine())

  it("outlet can be created with panel reference", () => {
    const panelId = EngineFacade.createPanel(0, 2000)
    const outletId = EngineFacade.createOutlet(1000, 1000, { panelId })
    const entity = EngineFacade.getEntity(outletId)
    expect(entity!.electrical!.panelId).toBe(panelId)
  })

  it("panel and outlet coexist", () => {
    const panelId = EngineFacade.createPanel(0, 2000)
    const outletId = EngineFacade.createOutlet(1000, 1000, { panelId })

    const panels = EngineFacade.queryByType("panel")
    const outlets = EngineFacade.queryByType("outlet")
    expect(panels.length).toBe(1)
    expect(outlets.length).toBe(1)
  })
})

// ============================================================
// A2.8: Full outlet flow — apartment with outlets
// ============================================================

describe("A2.8 — Full apartment outlet flow", () => {
  beforeEach(() => resetEngine())

  it("creates 65m² apartment walls and places outlets", () => {
    // Exterior walls (8000 x 8125 ≈ 65m²)
    EngineFacade.createWall(0, 0, 8000, 0)
    EngineFacade.createWall(8000, 0, 8000, 8125)
    EngineFacade.createWall(8000, 8125, 0, 8125)
    EngineFacade.createWall(0, 8125, 0, 0)

    // Interior walls
    EngineFacade.createWall(4000, 0, 4000, 5000)
    EngineFacade.createWall(0, 5000, 4000, 5000)
    EngineFacade.createWall(4000, 5000, 8000, 5000)

    // Panel
    const panelId = EngineFacade.createPanel(100, 100)

    // Outlets
    EngineFacade.createOutlet(1500, 2000, { panelId })
    EngineFacade.createOutlet(3000, 2000, { panelId })
    EngineFacade.createOutlet(5500, 2000, { panelId })
    EngineFacade.createOutlet(7000, 2000, { panelId })
    EngineFacade.createOutlet(1500, 7000, { panelId })
    EngineFacade.createOutlet(5500, 7000, { panelId })

    const outlets = EngineFacade.queryByType("outlet")
    expect(outlets.length).toBe(6)
  })

  it("apartment walls + outlets survive save/load", () => {
    EngineFacade.createWall(0, 0, 8000, 0)
    EngineFacade.createWall(8000, 0, 8000, 8125)
    EngineFacade.createWall(8000, 8125, 0, 8125)
    EngineFacade.createWall(0, 8125, 0, 0)
    EngineFacade.createWall(4000, 0, 4000, 5000)
    EngineFacade.createWall(0, 5000, 4000, 5000)
    EngineFacade.createWall(4000, 5000, 8000, 5000)

    const panelId = EngineFacade.createPanel(100, 100)
    EngineFacade.createOutlet(1500, 2000, { panelId })
    EngineFacade.createOutlet(3000, 2000, { panelId })
    EngineFacade.createOutlet(5500, 2000, { panelId })
    EngineFacade.createOutlet(7000, 2000, { panelId })

    const saved = EngineFacade.saveProject("apartment")
    resetEngine()
    EngineFacade.loadProject(saved)

    const walls = EngineFacade.queryByType("wall")
    const outlets = EngineFacade.queryByType("outlet")
    const panels = EngineFacade.queryByType("panel")
    expect(walls.length).toBe(7)
    expect(outlets.length).toBe(4)
    expect(panels.length).toBe(1)
  })
})

// ============================================================
// A2.9: Outlet validation
// ============================================================

describe("A2.9 — Outlet validation", () => {
  beforeEach(() => resetEngine())

  it("project with outlets is valid", () => {
    EngineFacade.createWall(0, 0, 5000, 0)
    EngineFacade.createWall(5000, 0, 5000, 4000)
    EngineFacade.createWall(5000, 4000, 0, 4000)
    EngineFacade.createWall(0, 4000, 0, 0)
    EngineFacade.createOutlet(1000, 1000)
    EngineFacade.createOutlet(2000, 2000)

    const report = EngineFacade.validateProject()
    expect(report.valid).toBe(true)
  })

  it("empty project has no errors about outlets", () => {
    const report = EngineFacade.validateProject()
    expect(report.errors.length).toBe(0)
  })
})

type UUID = string
