// ============================================================
// ElectricPMR — Engine Facade
// ============================================================
//
// Единая точка входа для UI.
// UI никогда не обращается к движкам напрямую.
// ============================================================

import type { UUID } from "../types/common"
import { ComponentStore, type ComponentMap, type ComponentName, type EntityBuilder } from "../core/ecs"
import { ObjectRegistry } from "../core/objectRegistry"
import { RelationshipSystem, type RelationshipType, type Relationship } from "../core/relationshipSystem"
import { DependencyGraph } from "../core/dependencyGraph"
import { PropertyDependencyGraph, type PropertyDependency } from "../core/propertyDependencyGraph"
import { TransactionEngine, type TransactionCommand, type TransactionResult } from "../core/transactionEngine"
import { ProjectSerializer, type ProjectData, type SerializedProject } from "../core/projectSerializer"
import { MigrationEngine } from "../core/migrationEngine"
import { CapabilitySystem, type CapabilityValidation } from "../core/capabilitySystem"
import { AuditLog, type AuditSource, type AuditStats } from "../core/auditLog"
import { SnapshotEngine, type ProjectSnapshot, type SnapshotStats } from "../core/snapshotEngine"
import { PerformanceLayer } from "../core/performanceLayer"
import { HealthApi, type HealthReport } from "../core/healthApi"
import { RuleEngine } from "../rules/ruleEngine"

// ============================================================
// ENGINE FACADE
// ============================================================

class EngineFacadeImpl {

  private _undoStack: string[] = []
  private _redoStack: string[] = []
  private _maxUndoSize = 100

  private _captureState(): string {
    const entities = ComponentStore.getAllEntities()
    const data: Record<string, unknown>[] = []
    for (const id of entities) {
      const obj: Record<string, unknown> = { id }
      for (const name of ComponentStore.getEntityComponents(id)) {
        obj[name] = ComponentStore.getComponent(id, name)
      }
      data.push(obj)
    }
    return JSON.stringify(data)
  }

  private _restoreState(snapshot: string): void {
    const data = JSON.parse(snapshot) as Record<string, unknown>[]
    ComponentStore.clear()
    for (const obj of data) {
      const id = obj.id as UUID
      if (id) {
        ComponentStore.createEntityWithId(id)
        const components: Record<string, unknown> = {}
        for (const [key, value] of Object.entries(obj)) {
          if (key !== "id" && value !== undefined) {
            components[key] = value
          }
        }
        ComponentStore.addComponents(id, components as Partial<ComponentMap>)
      }
    }
  }

  private _pushUndo(): void {
    this._undoStack.push(this._captureState())
    if (this._undoStack.length > this._maxUndoSize) {
      this._undoStack.shift()
    }
    this._redoStack = []
  }

  // --- Entity Operations ---

  createEntity(components?: Partial<ComponentMap>): UUID {
    const id = ComponentStore.createEntity()
    if (components) {
      ComponentStore.addComponents(id, components)
    }
    return id
  }

  destroyEntity(id: UUID): void {
    this._pushUndo()
    ComponentStore.destroyEntity(id)
  }

  getEntity(id: UUID): Record<string, unknown> | undefined {
    if (!ComponentStore.entityExists(id)) return undefined
    const components: Record<string, unknown> = { entityId: id }
    for (const name of ComponentStore.getEntityComponents(id)) {
      components[name] = ComponentStore.getComponent(id, name)
    }
    return components
  }

  getEntityComponent<C extends ComponentName>(id: UUID, component: C): ComponentMap[C] | undefined {
    return ComponentStore.getComponent(id, component)
  }

  hasComponent(id: UUID, component: ComponentName): boolean {
    return ComponentStore.hasComponent(id, component)
  }

  addComponent<C extends ComponentName>(id: UUID, component: C, data: ComponentMap[C]): void {
    ComponentStore.addComponent(id, component, data)
  }

  removeComponent(id: UUID, component: ComponentName): void {
    ComponentStore.removeComponent(id, component)
  }

  queryEntities<C extends ComponentName[]>(...components: C) {
    return ComponentStore.query(...components)
  }

  queryByType(type: string): UUID[] {
    return ComponentStore.filterByComponent("identity", (identity) => identity.type === type)
  }

  // --- Geometry Operations (через транзакции) ---

  createWall(
    x1: number, y1: number, x2: number, y2: number,
    options?: { thickness?: number; material?: string }
  ): UUID {
    this._pushUndo()
    const id = ComponentStore.createEntity()
    ComponentStore.addComponents(id, {
      identity: {
        name: "Стена",
        type: "wall",
        version: 1,
        createdAt: new Date(),
        modifiedAt: new Date(),
      },
      geometry: {
        x: x1,
        y: y1,
        rotation: 0,
        width: Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2),
        height: options?.thickness ?? 200,
        points: [{ x: x1, y: y1 }, { x: x2, y: y2 }],
      },
      visual: {
        shape: "rect",
        fill: "#E8E4DE",
        stroke: "#8B7355",
        strokeWidth: 2,
        opacity: 1,
        layer: "walls",
      },
      metadata: {
        tags: ["wall", "structure"],
        custom: { material: options?.material ?? "brick" },
      },
    })

    AuditLog.commandExecuted(`create_wall_${id}`, "create", "user", {
      affectedObjects: [id],
    })

    return id
  }

  moveEntity(id: UUID, x: number, y: number): void {
    this._pushUndo()
    const geometry = ComponentStore.getComponent(id, "geometry")
    if (!geometry) throw new Error(`Entity ${id} has no geometry`)

    ComponentStore.addComponent(id, "geometry", {
      ...geometry,
      x,
      y,
    })
  }

  // --- Electrical Operations ---

  createOutlet(
    x: number, y: number,
    options?: { name?: string; circuitId?: UUID; panelId?: UUID }
  ): UUID {
    this._pushUndo()
    const id = ComponentStore.createEntity()
    ComponentStore.addComponents(id, {
      identity: {
        name: options?.name ?? "Розетка",
        type: "outlet",
        version: 1,
        createdAt: new Date(),
        modifiedAt: new Date(),
      },
      geometry: {
        x,
        y,
        rotation: 0,
        width: 72,
        height: 72,
      },
      electrical: {
        power: 0,
        voltage: 220,
        current: 16,
        circuitId: options?.circuitId,
        panelId: options?.panelId,
      },
      visual: {
        shape: "circle",
        fill: "#FFFFFF",
        stroke: "#2563EB",
        strokeWidth: 2,
        opacity: 1,
        layer: "electrical",
        icon: "outlet",
      },
      metadata: {
        tags: ["electrical", "outlet"],
        custom: { mountingHeight: 300 },
      },
      relationships: {
        children: [],
        connectedTo: [],
        referencedBy: [],
        containedIn: undefined,
      },
      capabilities: {
        canRotate: true,
        canResize: false,
        canMove: true,
        canDelete: true,
        canConnectCable: true,
        canContainObjects: false,
        canCarryLoad: false,
        canMountOnWall: true,
        canMountOnCeiling: false,
        canSplitCircuit: false,
        canGenerateDocument: true,
        canBeGrouped: true,
        canBeCopied: true,
        hasTerminals: true,
        supportsPhase: false,
        supportsRCD: false,
        requiresRoom: true,
      },
    })

    AuditLog.commandExecuted(`create_outlet_${id}`, "create", "user", {
      affectedObjects: [id],
    })

    return id
  }

  createLight(
    x: number, y: number,
    options?: { name?: string; type?: string; circuitId?: UUID }
  ): UUID {
    this._pushUndo()
    const id = ComponentStore.createEntity()
    ComponentStore.addComponents(id, {
      identity: {
        name: options?.name ?? "Светильник",
        type: options?.type ?? "light_ceiling",
        version: 1,
        createdAt: new Date(),
        modifiedAt: new Date(),
      },
      geometry: {
        x,
        y,
        rotation: 0,
        width: 120,
        height: 120,
      },
      electrical: {
        power: 60,
        voltage: 220,
        current: 0.27,
        circuitId: options?.circuitId,
      },
      visual: {
        shape: "circle",
        fill: "#FEF3C7",
        stroke: "#D97706",
        strokeWidth: 2,
        opacity: 1,
        layer: "electrical",
        icon: "light",
      },
      metadata: {
        tags: ["electrical", "light"],
        custom: {},
      },
      capabilities: {
        canRotate: false,
        canResize: false,
        canMove: true,
        canDelete: true,
        canConnectCable: true,
        canContainObjects: false,
        canCarryLoad: false,
        canMountOnWall: false,
        canMountOnCeiling: true,
        canSplitCircuit: false,
        canGenerateDocument: true,
        canBeGrouped: true,
        canBeCopied: true,
        hasTerminals: true,
        supportsPhase: false,
        supportsRCD: false,
        requiresRoom: true,
      },
    })

    AuditLog.commandExecuted(`create_light_${id}`, "create", "user", {
      affectedObjects: [id],
    })

    return id
  }

  createSwitch(
    x: number, y: number,
    options?: { name?: string; type?: string }
  ): UUID {
    this._pushUndo()
    const id = ComponentStore.createEntity()
    ComponentStore.addComponents(id, {
      identity: {
        name: options?.name ?? "Выключатель",
        type: options?.type ?? "switch",
        version: 1,
        createdAt: new Date(),
        modifiedAt: new Date(),
      },
      geometry: {
        x,
        y,
        rotation: 0,
        width: 72,
        height: 72,
      },
      electrical: {},
      visual: {
        shape: "circle",
        fill: "#FFFFFF",
        stroke: "#F59E0B",
        strokeWidth: 2,
        opacity: 1,
        layer: "electrical",
        icon: "switch",
      },
      metadata: {
        tags: ["electrical", "switch"],
        custom: { mountingHeight: 900 },
      },
      capabilities: {
        canRotate: true,
        canResize: false,
        canMove: true,
        canDelete: true,
        canConnectCable: true,
        canContainObjects: false,
        canCarryLoad: false,
        canMountOnWall: true,
        canMountOnCeiling: false,
        canSplitCircuit: false,
        canGenerateDocument: true,
        canBeGrouped: true,
        canBeCopied: true,
        hasTerminals: true,
        supportsPhase: false,
        supportsRCD: false,
        requiresRoom: true,
      },
    })

    AuditLog.commandExecuted(`create_switch_${id}`, "create", "user", {
      affectedObjects: [id],
    })

    return id
  }

  createPanel(
    x: number, y: number,
    options?: { name?: string }
  ): UUID {
    this._pushUndo()
    const id = ComponentStore.createEntity()
    ComponentStore.addComponents(id, {
      identity: {
        name: options?.name ?? "Щит",
        type: "panel",
        version: 1,
        createdAt: new Date(),
        modifiedAt: new Date(),
      },
      geometry: {
        x,
        y,
        rotation: 0,
        width: 400,
        height: 600,
      },
      electrical: {
        voltage: 220,
      },
      visual: {
        shape: "rect",
        fill: "#F3F4F6",
        stroke: "#374151",
        strokeWidth: 2,
        opacity: 1,
        layer: "electrical",
        icon: "panel",
      },
      metadata: {
        tags: ["electrical", "panel"],
        custom: { maxModules: 36 },
      },
      relationships: {
        children: [],
        connectedTo: [],
        referencedBy: [],
      },
      capabilities: {
        canRotate: false,
        canResize: false,
        canMove: true,
        canDelete: true,
        canConnectCable: true,
        canContainObjects: true,
        canCarryLoad: false,
        canMountOnWall: true,
        canMountOnCeiling: false,
        canSplitCircuit: true,
        canGenerateDocument: true,
        canBeGrouped: false,
        canBeCopied: true,
        hasTerminals: true,
        supportsPhase: true,
        supportsRCD: true,
        requiresRoom: false,
      },
    })

    AuditLog.commandExecuted(`create_panel_${id}`, "create", "user", {
      affectedObjects: [id],
    })

    return id
  }

  createBreaker(
    panelId: UUID,
    options?: { rating?: number; type?: string }
  ): UUID {
    this._pushUndo()
    const id = ComponentStore.createEntity()
    ComponentStore.addComponents(id, {
      identity: {
        name: "Автомат",
        type: "breaker",
        version: 1,
        createdAt: new Date(),
        modifiedAt: new Date(),
      },
      geometry: {
        x: 0,
        y: 0,
        rotation: 0,
        width: 18,
        height: 80,
      },
      electrical: {
        current: options?.rating ?? 16,
        breakerType: options?.type ?? "C",
        breakerRating: options?.rating ?? 16,
        panelId,
      },
      visual: {
        shape: "rect",
        fill: "#FFFFFF",
        stroke: "#1F2937",
        strokeWidth: 1,
        opacity: 1,
        layer: "electrical",
        icon: "breaker",
      },
      metadata: {
        tags: ["electrical", "breaker"],
        custom: {},
      },
      capabilities: {
        canRotate: false,
        canResize: false,
        canMove: true,
        canDelete: true,
        canConnectCable: false,
        canContainObjects: false,
        canCarryLoad: true,
        canMountOnWall: false,
        canMountOnCeiling: false,
        canSplitCircuit: true,
        canGenerateDocument: true,
        canBeGrouped: false,
        canBeCopied: true,
        hasTerminals: true,
        supportsPhase: true,
        supportsRCD: false,
        requiresRoom: false,
      },
    })

    AuditLog.commandExecuted(`create_breaker_${id}`, "create", "user", {
      affectedObjects: [id],
    })

    return id
  }

  // --- Relationship Operations ---

  addRelationship(from: UUID, to: UUID, type: RelationshipType): Relationship {
    return RelationshipSystem.add(from, to, type)
  }

  removeRelationship(id: UUID): void {
    RelationshipSystem.remove(id)
  }

  getRelationships(objectId: UUID): Relationship[] {
    return RelationshipSystem.getAll(objectId)
  }

  // --- Undo/Redo ---

  undo(): boolean {
    const snapshot = this._undoStack.pop()
    if (!snapshot) return false

    this._redoStack.push(this._captureState())
    this._restoreState(snapshot)
    return true
  }

  redo(): boolean {
    const snapshot = this._redoStack.pop()
    if (!snapshot) return false

    this._undoStack.push(this._captureState())
    this._restoreState(snapshot)
    return true
  }

  // --- Validation ---

  validateProject(): ValidationReport {
    const start = performance.now()

    const entities = ComponentStore.getAllEntities()
    const errors: string[] = []
    const warnings: string[] = []

    for (const id of entities) {
      const identity = ComponentStore.getComponent(id, "identity")
      if (!identity) continue

      // Базовые проверки
      const geometry = ComponentStore.getComponent(id, "geometry")
      if (!geometry) {
        warnings.push(`Entity ${id} (${identity.name}) has no geometry`)
      }

      const electrical = ComponentStore.getComponent(id, "electrical")
      if (electrical?.breakerRating) {
        const validRatings = [6, 10, 16, 20, 25, 32, 40, 50, 63]
        if (!validRatings.includes(electrical.breakerRating)) {
          errors.push(`Invalid breaker rating: ${electrical.breakerRating}A`)
        }
      }

      // PUE/SP rule validation
      const metadata = ComponentStore.getComponent(id, "metadata")
      const ruleIssues = RuleEngine.validateObject(identity.type, {
        type: identity.type,
        mountingHeight: metadata?.custom?.mountingHeight,
        roomType: metadata?.custom?.roomType,
        hasGrounding: metadata?.custom?.hasGrounding,
        ...metadata?.custom,
      })
      for (const issue of ruleIssues) {
        if (issue.severity === "error") errors.push(issue.message)
        else warnings.push(issue.message)
      }
    }

    const duration = performance.now() - start

    AuditLog.validationPerformed(entities.length, errors.length, warnings.length, duration)

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      duration,
      objectCount: entities.length,
    }
  }

  // --- Save/Load (ECS-based) ---

  saveProject(name?: string, description?: string): SerializedProject {
    const entities = ComponentStore.getAllEntities()
    const ecsObjects: Record<string, unknown>[] = []

    for (const id of entities) {
      const obj: Record<string, unknown> = { id }
      for (const componentName of ComponentStore.getEntityComponents(id)) {
        obj[componentName] = ComponentStore.getComponent(id, componentName)
      }
      ecsObjects.push(obj)
    }

    const relationships = RelationshipSystem.exportAll()

    const projectData: ProjectData = {
      name: name ?? "Untitled Project",
      description,
      createdAt: new Date(),
      tags: [],
      objects: ecsObjects,
      relationships,
    }

    const serialized = ProjectSerializer.serialize(projectData)
    AuditLog.projectSaved(name ?? "Untitled Project", ecsObjects.length)
    return serialized
  }

  loadProject(data: SerializedProject): void {
    if (MigrationEngine.needsMigration(data)) {
      const result = MigrationEngine.migrate(data)
      if (!result.success) {
        throw new Error("Migration failed: " + result.error)
      }
      data = result.data
    }

    const project = ProjectSerializer.deserialize(data)

    ComponentStore.clear()
    RelationshipSystem.clear()

    for (const obj of project.objects) {
      const id = (obj as Record<string, unknown>).id as UUID
      if (id) {
        ComponentStore.createEntityWithId(id)
        const components: Record<string, unknown> = {}
        for (const [key, value] of Object.entries(obj)) {
          if (key !== "id" && value !== undefined) {
            components[key] = value
          }
        }
        ComponentStore.addComponents(id, components as Partial<ComponentMap>)
      }
    }

    for (const rel of project.relationships) {
      try {
        RelationshipSystem.add(rel.from, rel.to, rel.type, rel.metadata)
      } catch (err) {
        console.warn("Failed to restore relationship:", err)
      }
    }

    AuditLog.projectLoaded(project.name, project.objects.length, 0)
  }

  exportJSON(): string {
    const objects = ObjectRegistry.exportAll()
    const relationships = RelationshipSystem.exportAll()

    return ProjectSerializer.toJSON({
      name: "Export",
      createdAt: new Date(),
      tags: [],
      objects,
      relationships,
    })
  }

  importJSON(json: string): void {
    const data = ProjectSerializer.fromJSON(json)
    this.loadProject(data)
  }

  // --- Dependency Graph ---

  buildDependencyGraph(): void {
    DependencyGraph.buildFromRelationships()
  }

  markDirty(objectId: UUID): void {
    DependencyGraph.markDirty(objectId)
  }

  getRecalculationPlan(): UUID[] {
    return DependencyGraph.getRecalculationPlan()
  }

  // --- Capabilities ---

  checkCapability(objectId: UUID, capability: string): boolean {
    return ComponentStore.hasComponent(objectId, "capabilities")
  }

  // --- Health ---

  getHealthReport(): HealthReport {
    return HealthApi.getFullHealthReport()
  }

  // --- Snapshots ---

  takeSnapshot(description?: string): ProjectSnapshot {
    return SnapshotEngine.takeSnapshot(description)
  }

  restoreSnapshot(id: UUID): boolean {
    return SnapshotEngine.restoreSnapshot(id)
  }

  // --- Audit ---

  getAuditLog(filter?: { type?: string; limit?: number }): AuditEntry[] {
    return AuditLog.getEntries(filter)
  }

  getAuditStats(): AuditStats {
    return AuditLog.getStats()
  }

  // --- Performance ---

  startTimer(name: string): () => number {
    return PerformanceLayer.startTimer(name)
  }

  getMetrics() {
    return PerformanceLayer.getMetrics()
  }

  // --- Stats ---

  getStats() {
    return {
      entities: ComponentStore.getAllEntities().length,
      components: ComponentStore.getStats(),
      relationships: RelationshipSystem.getStats(),
      objects: ObjectRegistry.count(),
    }
  }

  // --- Cleanup ---

  clear(): void {
    ComponentStore.clear()
    ObjectRegistry.clear()
    RelationshipSystem.clear()
    DependencyGraph.clear()
    AuditLog.clear()
    SnapshotEngine.clear()
    this._undoStack = []
    this._redoStack = []
  }
}

// ============================================================
// ТИПЫ
// ============================================================

export interface ValidationReport {
  valid: boolean
  errors: string[]
  warnings: string[]
  duration: number
  objectCount: number
}

export type AuditEntry = {
  id: string
  timestamp: Date
  type: string
  [key: string]: unknown
}

// ============================================================
// СИНГЛТОН
// ============================================================

export const EngineFacade = new EngineFacadeImpl()
