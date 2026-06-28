// ============================================================
// ElectricPMR — Integration Tests
// ============================================================
//
// End-to-end тесты полных сценариев:
// Create Wall → Create Room → Add Outlet → Assign Cable →
// Calculate → Validate → Export
// ============================================================

import { EngineFacade } from "../facade/engineFacade"
import { ComponentStore } from "../core/ecs"
import { RelationshipSystem } from "../core/relationshipSystem"
import { DependencyGraph } from "../core/dependencyGraph"

// ============================================================
// TEST HELPERS
// ============================================================

function resetEngine(): void {
  EngineFacade.clear()
}

function createTestRoom(): { wallIds: UUID[]; roomId: UUID } {
  // Создаём 4 стены комнаты 4m x 3m
  const wall1 = EngineFacade.createWall(0, 0, 4000, 0)
  const wall2 = EngineFacade.createWall(4000, 0, 4000, 3000)
  const wall3 = EngineFacade.createWall(4000, 3000, 0, 3000)
  const wall4 = EngineFacade.createWall(0, 3000, 0, 0)

  // Создаём комнату
  const roomId = EngineFacade.createEntity({
    identity: {
      name: "Гостиная",
      type: "room",
      version: 1,
      createdAt: new Date(),
      modifiedAt: new Date(),
    },
    geometry: {
      x: 2000,
      y: 1500,
      rotation: 0,
      width: 4000,
      height: 3000,
      points: [
        { x: 0, y: 0 },
        { x: 4000, y: 0 },
        { x: 4000, y: 3000 },
        { x: 0, y: 3000 },
      ],
    },
    visual: {
      shape: "polygon",
      fill: "#F8FAFC",
      stroke: "#CBD5E1",
      strokeWidth: 1,
      opacity: 0.5,
      layer: "floor",
    },
    metadata: {
      tags: ["room"],
      custom: { roomType: "living", area: 12 },
    },
    relationships: {
      children: [wall1, wall2, wall3, wall4],
      connectedTo: [],
      referencedBy: [],
    },
    capabilities: {
      canRotate: false,
      canResize: true,
      canMove: false,
      canDelete: true,
      canConnectCable: false,
      canContainObjects: true,
      canCarryLoad: false,
      canMountOnWall: false,
      canMountOnCeiling: false,
      canSplitCircuit: false,
      canGenerateDocument: true,
      canBeGrouped: false,
      canBeCopied: false,
      hasTerminals: false,
      supportsPhase: false,
      supportsRCD: false,
      requiresRoom: false,
    },
  })

  return { wallIds: [wall1, wall2, wall3, wall4], roomId }
}

// ============================================================
// TEST SUITE
// ============================================================

describe("Integration: Full Electrical Design Flow", () => {

  beforeEach(() => {
    resetEngine()
  })

  test("Create wall → Create room → Add outlets → Validate", () => {
    // 1. Создаём стены
    const wall1 = EngineFacade.createWall(0, 0, 4000, 0)
    const wall2 = EngineFacade.createWall(4000, 0, 4000, 3000)
    const wall3 = EngineFacade.createWall(4000, 3000, 0, 3000)
    const wall4 = EngineFacade.createWall(0, 3000, 0, 0)

    expect(wall1).toBeDefined()
    expect(wall2).toBeDefined()
    expect(wall3).toBeDefined()
    expect(wall4).toBeDefined()

    // 2. Создаём комнату
    const roomId = EngineFacade.createEntity({
      identity: {
        name: "Гостиная",
        type: "room",
        version: 1,
        createdAt: new Date(),
        modifiedAt: new Date(),
      },
      geometry: {
        x: 2000,
        y: 1500,
        rotation: 0,
        width: 4000,
        height: 3000,
      },
      metadata: {
        tags: ["room"],
        custom: { roomType: "living", area: 12 },
      },
    })

    expect(roomId).toBeDefined()

    // 3. Добавляем розетки
    const outlet1 = EngineFacade.createOutlet(500, 300, {
      name: "Розетка 1",
    })
    const outlet2 = EngineFacade.createOutlet(3500, 300, {
      name: "Розетка 2",
    })

    expect(outlet1).toBeDefined()
    expect(outlet2).toBeDefined()

    // 4. Проверяем валидацию
    const report = EngineFacade.validateProject()
    expect(report.valid).toBe(true)
    expect(report.errors).toHaveLength(0)
  })

  test("Create panel → Add breakers → Add outlets → Connect", () => {
    // 1. Создаём щит
    const panelId = EngineFacade.createPanel(200, 100, {
      name: "Щит квартиры",
    })

    expect(panelId).toBeDefined()

    // 2. Добавляем автоматы
    const breaker1 = EngineFacade.createBreaker(panelId, { rating: 16 })
    const breaker2 = EngineFacade.createBreaker(panelId, { rating: 10 })

    expect(breaker1).toBeDefined()
    expect(breaker2).toBeDefined()

    // 3. Добавляем розетки
    const outlet1 = EngineFacade.createOutlet(500, 300, {
      name: "Розетка кухня",
      panelId,
    })
    const outlet2 = EngineFacade.createOutlet(1500, 300, {
      name: "Розетка спальня",
      panelId,
    })

    // 4. Устанавливаем связи
    EngineFacade.addRelationship(outlet1, breaker1, "poweredBy")
    EngineFacade.addRelationship(outlet2, breaker2, "poweredBy")
    EngineFacade.addRelationship(breaker1, panelId, "belongsToPanel")
    EngineFacade.addRelationship(breaker2, panelId, "belongsToPanel")

    // 5. Проверяем связи
    const rels1 = EngineFacade.getRelationships(outlet1)
    expect(rels1.length).toBeGreaterThan(0)

    const rels2 = EngineFacade.getRelationships(panelId)
    expect(rels2.length).toBeGreaterThan(0)
  })

  test("Save and load project", () => {
    // 1. Создаём проект
    const panelId = EngineFacade.createPanel(200, 100)
    const outlet1 = EngineFacade.createOutlet(500, 300)
    const outlet2 = EngineFacade.createOutlet(1500, 300)

    // 2. Сохраняем
    const saved = EngineFacade.saveProject("Test Project", "Integration test")
    expect(saved).toBeDefined()
    expect(saved.version).toBe(3)
    expect(saved.metadata.name).toBe("Test Project")

    // 3. Очищаем
    EngineFacade.clear()
    expect(EngineFacade.getStats().entities).toBe(0)

    // 4. Загружаем
    EngineFacade.loadProject(saved)
    expect(EngineFacade.getStats().entities).toBeGreaterThan(0)
  })

  test("Dependency graph works correctly", () => {
    // 1. Создаём объекты
    const panelId = EngineFacade.createPanel(200, 100)
    const breaker1 = EngineFacade.createBreaker(panelId, { rating: 16 })
    const outlet1 = EngineFacade.createOutlet(500, 300, { panelId })

    // 2. Устанавливаем связи
    EngineFacade.addRelationship(outlet1, breaker1, "poweredBy")
    EngineFacade.addRelationship(breaker1, panelId, "belongsToPanel")

    // 3. Строим граф
    EngineFacade.buildDependencyGraph()

    // 4. Проверяем зависимости
    const deps = DependencyGraph.getDependencies(outlet1)
    expect(deps).toContain(breaker1)
  })

  test("Audit log records actions", () => {
    // 1. Выполняем действия
    EngineFacade.createWall(0, 0, 4000, 0)
    EngineFacade.createOutlet(500, 300)

    // 2. Проверяем аудит
    const stats = EngineFacade.getAuditStats()
    expect(stats.totalEntries).toBeGreaterThan(0)
  })
})

// ============================================================
// TYPES (for test compilation)
// ============================================================

type UUID = string
