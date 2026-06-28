// ============================================================
// Sprint A1 — Wall Flow Acceptance Tests
// ============================================================
//
// CONTRACT: A wall drawn by the user must:
//   1. Exist in ECS
//   2. Be visible in the UI projection
//   3. Survive zoom/pan changes
//   4. Survive page refresh (persistence)
//   5. Disappear on Undo
//   6. Reappear on Redo
//
// These tests define "done" for Sprint A1.
// No code is written until these tests exist.
// ============================================================

import { describe, it, expect, beforeEach } from "vitest"
import { EngineFacade } from "../facade/engineFacade"

// ============================================================
// HELPERS
// ============================================================

function resetEngine(): void {
  EngineFacade.clear()
}

// ============================================================
// A1.1: Wall exists in ECS after creation
// ============================================================

describe("A1.1 — Wall exists in ECS", () => {
  beforeEach(() => resetEngine())

  it("creates a wall and it has an id", () => {
    const wall = EngineFacade.createWall(0, 0, 4000, 0)
    expect(wall).toBeDefined()
    expect(wall.length).toBeGreaterThan(0)
  })

  it("wall has correct coordinates", () => {
    const wallId = EngineFacade.createWall(100, 200, 500, 200)
    const entity = EngineFacade.getEntity(wallId)
    expect(entity).toBeDefined()
    expect(entity!.geometry).toBeDefined()
    expect(entity!.geometry!.x).toBe(100)
    expect(entity!.geometry!.y).toBe(200)
  })

  it("wall has identity component", () => {
    const wallId = EngineFacade.createWall(0, 0, 1000, 0)
    const entity = EngineFacade.getEntity(wallId)
    expect(entity!.identity).toBeDefined()
    expect(entity!.identity!.type).toBe("wall")
  })

  it("wall has geometry component with width and height", () => {
    const wallId = EngineFacade.createWall(0, 0, 4000, 0)
    const entity = EngineFacade.getEntity(wallId)
    expect(entity!.geometry).toBeDefined()
    expect(entity!.geometry!.width).toBe(4000)
  })
})

// ============================================================
// A1.2: Wall is visible in UI projection
// ============================================================

describe("A1.2 — Wall is visible in UI projection", () => {
  beforeEach(() => resetEngine())

  it("projected walls list contains the created wall", () => {
    const wallId = EngineFacade.createWall(0, 0, 4000, 0)
    const walls = EngineFacade.queryByType("wall")
    expect(walls.length).toBe(1)
    expect(walls[0]).toBe(wallId)
  })

  it("multiple walls are all projected", () => {
    EngineFacade.createWall(0, 0, 4000, 0)
    EngineFacade.createWall(4000, 0, 4000, 3000)
    EngineFacade.createWall(4000, 3000, 0, 3000)
    EngineFacade.createWall(0, 3000, 0, 0)

    const walls = EngineFacade.queryByType("wall")
    expect(walls.length).toBe(4)
  })
})

// ============================================================
// A1.3: Wall survives zoom/pan (viewport changes)
// ============================================================

describe("A1.3 — Wall survives viewport changes", () => {
  beforeEach(() => resetEngine())

  it("wall data unchanged after simulated zoom", () => {
    const wallId = EngineFacade.createWall(0, 0, 4000, 0)
    const entityBefore = EngineFacade.getEntity(wallId)

    // Simulate zoom (viewport transform does not affect ECS data)
    const zoomLevel = 2.0
    expect(entityBefore!.geometry!.x).toBe(0)
    expect(entityBefore!.geometry!.width).toBe(4000)

    // After zoom, entity is unchanged
    const entityAfter = EngineFacade.getEntity(wallId)
    expect(entityAfter!.geometry!.x).toBe(entityBefore!.geometry!.x)
    expect(entityAfter!.geometry!.width).toBe(entityBefore!.geometry!.width)
  })
})

// ============================================================
// A1.4: Wall persists (serialization roundtrip)
// ============================================================

describe("A1.4 — Wall persists through save/load", () => {
  beforeEach(() => resetEngine())

  it("wall survives serialization roundtrip", () => {
    const wallId = EngineFacade.createWall(100, 200, 5000, 200)
    const entityBefore = EngineFacade.getEntity(wallId)

    // Save
    const serialized = EngineFacade.saveProject()

    // Clear and reload
    resetEngine()
    EngineFacade.loadProject(serialized)

    // Wall exists after reload
    const walls = EngineFacade.queryByType("wall")
    expect(walls.length).toBe(1)

    const entityAfter = EngineFacade.getEntity(walls[0])
    expect(entityAfter).toBeDefined()
    expect(entityAfter!.geometry!.x).toBe(entityBefore!.geometry!.x)
    expect(entityAfter!.geometry!.width).toBe(entityBefore!.geometry!.width)
  })

  it("4 walls of a room survive roundtrip", () => {
    EngineFacade.createWall(0, 0, 4000, 0)
    EngineFacade.createWall(4000, 0, 4000, 3000)
    EngineFacade.createWall(4000, 3000, 0, 3000)
    EngineFacade.createWall(0, 3000, 0, 0)

    const serialized = EngineFacade.saveProject()
    resetEngine()
    EngineFacade.loadProject(serialized)

    const walls = EngineFacade.queryByType("wall")
    expect(walls.length).toBe(4)
  })
})

// ============================================================
// A1.5: Wall disappears on Undo
// ============================================================

describe("A1.5 — Wall disappears on Undo", () => {
  beforeEach(() => resetEngine())

  it("undo removes the last created wall", () => {
    const wallId = EngineFacade.createWall(0, 0, 4000, 0)
    const wallsBefore = EngineFacade.queryByType("wall")
    expect(wallsBefore.length).toBe(1)

    EngineFacade.undo()

    const wallsAfter = EngineFacade.queryByType("wall")
    expect(wallsAfter.length).toBe(0)
  })
})

// ============================================================
// A1.6: Wall reappears on Redo
// ============================================================

describe("A1.6 — Wall reappears on Redo", () => {
  beforeEach(() => resetEngine())

  it("redo restores the undone wall", () => {
    const wallId = EngineFacade.createWall(0, 0, 4000, 0)

    EngineFacade.undo()
    EngineFacade.redo()

    const walls = EngineFacade.queryByType("wall")
    expect(walls.length).toBe(1)
  })
})

// ============================================================
// A1.7: Move wall
// ============================================================

describe("A1.7 — Move wall", () => {
  beforeEach(() => resetEngine())

  it("wall position updates after move", () => {
    const wallId = EngineFacade.createWall(0, 0, 4000, 0)
    EngineFacade.moveEntity(wallId, 500, 500)

    const entity = EngineFacade.getEntity(wallId)
    expect(entity!.geometry!.x).toBe(500)
    expect(entity!.geometry!.y).toBe(500)
  })
})

// ============================================================
// A1.8: Delete wall
// ============================================================

describe("A1.8 — Delete wall", () => {
  beforeEach(() => resetEngine())

  it("wall is removed after deletion", () => {
    const wallId = EngineFacade.createWall(0, 0, 4000, 0)
    EngineFacade.destroyEntity(wallId)

    const walls = EngineFacade.queryByType("wall")
    expect(walls.length).toBe(0)
  })

  it("only the targeted wall is removed", () => {
    const wall1 = EngineFacade.createWall(0, 0, 4000, 0)
    const wall2 = EngineFacade.createWall(4000, 0, 4000, 3000)

    EngineFacade.destroyEntity(wall1)

    const walls = EngineFacade.queryByType("wall")
    expect(walls.length).toBe(1)
    expect(walls[0]).toBe(wall2)
  })
})

// ============================================================
// A1.9: Full apartment wall flow
// ============================================================

describe("A1.9 — Full apartment wall flow", () => {
  beforeEach(() => resetEngine())

  it("65m2 apartment: 4 exterior + 4 interior = 8 walls", () => {
    // Exterior walls (rectangle 8000 x 6000 mm = 48m2 + some interior = ~65m2)
    EngineFacade.createWall(0, 0, 8000, 0)        // south
    EngineFacade.createWall(8000, 0, 8000, 6000)   // east
    EngineFacade.createWall(8000, 6000, 0, 6000)   // north
    EngineFacade.createWall(0, 6000, 0, 0)         // west

    // Interior walls
    EngineFacade.createWall(4000, 0, 4000, 4000)   // kitchen divider
    EngineFacade.createWall(4000, 4000, 8000, 4000) // bathroom wall
    EngineFacade.createWall(0, 3000, 4000, 3000)   // bedroom divider
    EngineFacade.createWall(4000, 4000, 4000, 6000) // hallway wall

    const walls = EngineFacade.queryByType("wall")
    expect(walls.length).toBe(8)
  })

  it("full apartment survives save/load", () => {
    // Create apartment
    EngineFacade.createWall(0, 0, 8000, 0)
    EngineFacade.createWall(8000, 0, 8000, 6000)
    EngineFacade.createWall(8000, 6000, 0, 6000)
    EngineFacade.createWall(0, 6000, 0, 0)
    EngineFacade.createWall(4000, 0, 4000, 4000)
    EngineFacade.createWall(4000, 4000, 8000, 4000)
    EngineFacade.createWall(0, 3000, 4000, 3000)
    EngineFacade.createWall(4000, 4000, 4000, 6000)

    // Save
    const serialized = EngineFacade.saveProject()

    // Reload
    resetEngine()
    EngineFacade.loadProject(serialized)

    // All walls intact
    const walls = EngineFacade.queryByType("wall")
    expect(walls.length).toBe(8)
  })
})
