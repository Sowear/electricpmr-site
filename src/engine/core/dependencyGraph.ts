// ============================================================
// ElectricPMR — Dependency Graph
// ============================================================
//
// Автоматическое отслеживание зависимостей между объектами.
// При изменении объекта пересчитываются только зависимые узлы.
// ============================================================

import type { UUID } from "../types/common"
import type { UniversalObject, ObjectType } from "./universalObject"
import { ObjectRegistry } from "./objectRegistry"
import { RelationshipSystem, type RelationshipType } from "./relationshipSystem"

// ============================================================
// DEPENDENCY GRAPH
// ============================================================

class DependencyGraphImpl {
  private directDeps: Map<UUID, Set<UUID>> = new Map()      // object → depends on
  private reverseDeps: Map<UUID, Set<UUID>> = new Map()     // object → depended on by
  private dirtyObjects: Set<UUID> = new Set()
  private recalcQueue: UUID[] = []
  private recalcInProgress = false
  private listeners: Array<(event: DependencyEvent) => void> = []

  // --- Построение графа ---

  buildFromRelationships(): void {
    this.directDeps.clear()
    this.reverseDeps.clear()

    // Электрические зависимости
    const poweredBy = RelationshipSystem.getByType("poweredBy")
    for (const rel of poweredBy) {
      this.addEdge(rel.from, rel.to) // from зависит от to
    }

    const feedsFrom = RelationshipSystem.getByType("feedsFrom")
    for (const rel of feedsFrom) {
      this.addEdge(rel.from, rel.to)
    }

    const protectionFor = RelationshipSystem.getByType("protectionFor")
    for (const rel of protectionFor) {
      this.addEdge(rel.from, rel.to)
    }

    const belongsToCircuit = RelationshipSystem.getByType("belongsToCircuit")
    for (const rel of belongsToCircuit) {
      this.addEdge(rel.from, rel.to)
    }

    const belongsToPanel = RelationshipSystem.getByType("belongsToPanel")
    for (const rel of belongsToPanel) {
      this.addEdge(rel.from, rel.to)
    }

    // Архитектурные зависимости
    const contains = RelationshipSystem.getByType("contains")
    for (const rel of contains) {
      this.addEdge(rel.from, rel.to)
    }

    const mountedOn = RelationshipSystem.getByType("mountedOn")
    for (const rel of mountedOn) {
      this.addEdge(rel.from, rel.to)
    }

    const controls = RelationshipSystem.getByType("controls")
    for (const rel of controls) {
      this.addEdge(rel.from, rel.to)
    }

    // Автоматические зависимости на основе типов
    this.addImplicitDependencies()
  }

  // --- Ручное добавление зависимостей ---

  addDependency(from: UUID, to: UUID): void {
    this.addEdge(from, to)
  }

  removeDependency(from: UUID, to: UUID): void {
    this.removeEdge(from, to)
  }

  // --- Запросы зависимостей ---

  // Прямые зависимости объекта (от чего он зависит)
  getDependencies(objectId: UUID): UUID[] {
    return Array.from(this.directDeps.get(objectId) ?? [])
  }

  // Обратные зависимости (что зависит от объекта)
  getDependents(objectId: UUID): UUID[] {
    return Array.from(this.reverseDeps.get(objectId) ?? [])
  }

  // Все зависимости (прямые + косвенные)
  getAllDependencies(objectId: UUID, maxDepth: number = 10): UUID[] {
    const result = new Set<UUID>()
    const queue: Array<{ id: UUID; depth: number }> = [{ id: objectId, depth: 0 }]

    while (queue.length > 0) {
      const { id, depth } = queue.shift()!
      if (depth >= maxDepth) continue

      const deps = this.getDependencies(id)
      for (const dep of deps) {
        if (!result.has(dep)) {
          result.add(dep)
          queue.push({ id: dep, depth: depth + 1 })
        }
      }
    }

    return Array.from(result)
  }

  // Все обратные зависимости (косвенно + прямо)
  getAllDependents(objectId: UUID, maxDepth: number = 10): UUID[] {
    const result = new Set<UUID>()
    const queue: Array<{ id: UUID; depth: number }> = [{ id: objectId, depth: 0 }]

    while (queue.length > 0) {
      const { id, depth } = queue.shift()!
      if (depth >= maxDepth) continue

      const dependents = this.getDependents(id)
      for (const dep of dependents) {
        if (!result.has(dep)) {
          result.add(dep)
          queue.push({ id: dep, depth: depth + 1 })
        }
      }
    }

    return Array.from(result)
  }

  // --- Обнаружение циклов ---

  detectCycles(): Cycle[] {
    const cycles: Cycle[] = []
    const visited = new Set<UUID>()
    const inStack = new Set<UUID>()
    const path: UUID[] = []

    const dfs = (node: UUID): void => {
      if (inStack.has(node)) {
        // Нашли цикл
        const cycleStart = path.indexOf(node)
        cycles.push({
          nodes: path.slice(cycleStart).concat(node),
        })
        return
      }
      if (visited.has(node)) return

      visited.add(node)
      inStack.add(node)
      path.push(node)

      for (const dep of this.getDependencies(node)) {
        dfs(dep)
      }

      path.pop()
      inStack.delete(node)
    }

    for (const node of this.directDeps.keys()) {
      dfs(node)
    }

    return cycles
  }

  // --- Топологическая сортировка ---

  topologicalSort(): UUID[] {
    const visited = new Set<UUID>()
    const sorted: UUID[] = []

    const visit = (node: UUID): void => {
      if (visited.has(node)) return
      visited.add(node)

      for (const dep of this.getDependencies(node)) {
        visit(dep)
      }

      sorted.push(node)
    }

    for (const node of this.directDeps.keys()) {
      visit(node)
    }

    return sorted
  }

  // --- Инкрементальный пересчёт ---

  markDirty(objectId: UUID): void {
    this.dirtyObjects.add(objectId)

    // Помечаем все обратные зависимости как грязные
    const dependents = this.getAllDependents(objectId)
    for (const dep of dependents) {
      this.dirtyObjects.add(dep)
    }

    // Добавляем в очередь пересчёта
    this.recalcQueue.push(objectId)

    this.emit({ type: "marked_dirty", objectId, affectedCount: dependents.length })
  }

  getDirtyObjects(): UUID[] {
    return Array.from(this.dirtyObjects)
  }

  clearDirty(): void {
    this.dirtyObjects.clear()
    this.recalcQueue = []
  }

  clear(): void {
    this.directDeps.clear()
    this.reverseDeps.clear()
    this.dirtyObjects.clear()
    this.recalcQueue = []
  }

  // Получить минимальный набор объектов для пересчёта
  getRecalculationPlan(): UUID[] {
    // Топологическая сортировка только грязных объектов
    const dirtySet = this.dirtyObjects
    const sorted: UUID[] = []
    const visited = new Set<UUID>()

    const visit = (node: UUID): void => {
      if (visited.has(node) || !dirtySet.has(node)) return
      visited.add(node)

      for (const dep of this.getDependencies(node)) {
        if (dirtySet.has(dep)) {
          visit(dep)
        }
      }

      sorted.push(node)
    }

    for (const node of dirtySet) {
      visit(node)
    }

    return sorted
  }

  // --- Анализ графа ---

  getDepth(objectId: UUID): number {
    const deps = this.getDependencies(objectId)
    if (deps.length === 0) return 0

    return 1 + Math.max(...deps.map(d => this.getDepth(d)))
  }

  getWidth(): number {
    const depths = Array.from(this.directDeps.keys()).map(id => this.getDepth(id))
    if (depths.length === 0) return 0
    return Math.max(...depths) + 1
  }

  getIsolatedObjects(): UUID[] {
    const allIds = new Set(ObjectRegistry.getAll().map(o => o.identity.id))
    const connected = new Set<UUID>()

    for (const [node, deps] of this.directDeps) {
      connected.add(node)
      for (const dep of deps) connected.add(dep)
    }

    return Array.from(allIds).filter(id => !connected.has(id))
  }

  // --- Визуализация графа ---

  toDOT(): string {
    const lines: string[] = ["digraph dependencies {"]

    for (const [node, deps] of this.directDeps) {
      const obj = ObjectRegistry.get(node)
      const label = obj?.identity.name ?? node
      const type = obj?.identity.type ?? "unknown"

      for (const dep of deps) {
        const depObj = ObjectRegistry.get(dep)
        const depLabel = depObj?.identity.name ?? dep

        lines.push(`  "${label}" -> "${depLabel}";`)
      }
    }

    lines.push("}")
    return lines.join("\n")
  }

  // --- Приватные методы ---

  private addEdge(from: UUID, to: UUID): void {
    if (!this.directDeps.has(from)) this.directDeps.set(from, new Set())
    if (!this.reverseDeps.has(to)) this.reverseDeps.set(to, new Set())

    this.directDeps.get(from)!.add(to)
    this.reverseDeps.get(to)!.add(from)
  }

  private removeEdge(from: UUID, to: UUID): void {
    this.directDeps.get(from)?.delete(to)
    this.reverseDeps.get(to)?.delete(from)
  }

  private addImplicitDependencies(): void {
    // Розетка зависит от комнаты
    const outlets = ObjectRegistry.getByType("outlet")
    for (const outlet of outlets) {
      if (outlet.relationships?.containedIn) {
        this.addEdge(outlet.identity.id, outlet.relationships.containedIn)
      }
    }

    // Автомат зависит от щита
    const breakers = ObjectRegistry.getByType("breaker")
    for (const breaker of breakers) {
      if (breaker.relationships?.belongsTo) {
        this.addEdge(breaker.identity.id, breaker.relationships.belongsTo)
      }
    }

    // Светильник зависит от комнаты
    const lights = ObjectRegistry.getByType("light_ceiling")
    for (const light of lights) {
      if (light.relationships?.containedIn) {
        this.addEdge(light.identity.id, light.relationships.containedIn)
      }
    }
  }

  private emit(event: DependencyEvent): void {
    for (const listener of this.listeners) {
      listener(event)
    }
  }
}

// ============================================================
// ТИПЫ
// ============================================================

export interface Cycle {
  nodes: UUID[]
}

export interface DependencyEvent {
  type: "marked_dirty"
  objectId: UUID
  affectedCount: number
}

// ============================================================
// СИНГЛТОН
// ============================================================

export const DependencyGraph = new DependencyGraphImpl()
