// ============================================================
// ElectricPMR — Relationship System
// ============================================================
//
// Автономная подсистема отношений между объектами.
// Не просто ссылки — а полноценный граф отношений.
// ============================================================

import type { UUID } from "../types/common"
import type { UniversalObject, RelationshipsComponent } from "./universalObject"
import { ObjectRegistry } from "./objectRegistry"
import { ComponentStore } from "./ecs"

// ============================================================
// RELATIONSHIP TYPES
// ============================================================

export type RelationshipType =
  | "contains"        // комната содержит объект
  | "connectedTo"     // электрическое соединение
  | "poweredBy"       // питание от
  | "mountedOn"       // установлен на (стену, потолок)
  | "belongsToCircuit" // принадлежит группе
  | "belongsToPanel"  // принадлежит щиту
  | "belongsToRoom"   // принадлежит комнате
  | "installedIn"     // установлен в
  | "referencedBy"    // обратная ссылка
  | "controls"        // выключатель управляет светильником
  | "feedsFrom"       // кабель отходит от
  | "protectionFor"   // автомат защищает линию

export interface Relationship {
  id: UUID
  from: UUID
  to: UUID
  type: RelationshipType
  metadata?: Record<string, unknown>
  createdAt: Date
}

// ============================================================
// RELATIONSHIP GRAPH
// ============================================================

class RelationshipSystemImpl {
  private relationships: Map<UUID, Relationship> = new Map()
  private adjacencyForward: Map<UUID, Map<RelationshipType, Set<UUID>>> = new Map()
  private adjacencyReverse: Map<UUID, Map<RelationshipType, Set<UUID>>> = new Map()
  private listeners: Array<(event: RelationshipEvent) => void> = []

  // --- CRUD ---

  add(from: UUID, to: UUID, type: RelationshipType, metadata?: Record<string, unknown>): Relationship {
    // Проверяем существование объектов (ObjectRegistry или ComponentStore)
    if (!ObjectRegistry.has(from) && !ComponentStore.entityExists(from)) throw new Error(`Object ${from} not found`)
    if (!ObjectRegistry.has(to) && !ComponentStore.entityExists(to)) throw new Error(`Object ${to} not found`)

    // Проверяем дубликат
    if (this.exists(from, to, type)) {
      throw new Error(`Relationship ${type} from ${from} to ${to} already exists`)
    }

    const id = `rel_${Date.now()}_${Math.random().toString(36).slice(2, 9)}` as UUID
    const relationship: Relationship = {
      id,
      from,
      to,
      type,
      metadata,
      createdAt: new Date(),
    }

    this.relationships.set(id, relationship)
    this.addToAdjacency(this.adjacencyForward, from, type, to)
    this.addToAdjacency(this.adjacencyReverse, to, type, from)

    // Синхронизируем с компонентом relationships объекта
    this.syncToObject(from, to, type, "add")

    this.emit({ type: "added", relationship })
    return relationship
  }

  remove(id: UUID): void {
    const rel = this.relationships.get(id)
    if (!rel) throw new Error(`Relationship ${id} not found`)

    this.relationships.delete(id)
    this.removeFromAdjacency(this.adjacencyForward, rel.from, rel.type, rel.to)
    this.removeFromAdjacency(this.adjacencyReverse, rel.to, rel.type, rel.from)

    // Синхронизируем с компонентом relationships объекта
    this.syncToObject(rel.from, rel.to, rel.type, "remove")

    this.emit({ type: "removed", relationship: rel })
  }

  removeByObjects(from: UUID, to: UUID, type?: RelationshipType): void {
    const toRemove = Array.from(this.relationships.values()).filter(
      r => r.from === from && r.to === to && (!type || r.type === type)
    )
    for (const rel of toRemove) {
      this.remove(rel.id)
    }
  }

  get(id: UUID): Relationship | undefined {
    return this.relationships.get(id)
  }

  // --- Запросы ---

  // Все исходящие связи объекта
  getOutgoing(objectId: UUID, type?: RelationshipType): Relationship[] {
    const result: Relationship[] = []
    const types = type ? [type] : Array.from(this.adjacencyForward.get(objectId)?.keys() ?? [])

    for (const t of types) {
      const targets = this.adjacencyForward.get(objectId)?.get(t)
      if (targets) {
        for (const to of targets) {
          const rel = this.findRelationship(objectId, to, t)
          if (rel) result.push(rel)
        }
      }
    }

    return result
  }

  // Все входящие связи объекта
  getIncoming(objectId: UUID, type?: RelationshipType): Relationship[] {
    const result: Relationship[] = []
    const types = type ? [type] : Array.from(this.adjacencyReverse.get(objectId)?.keys() ?? [])

    for (const t of types) {
      const sources = this.adjacencyReverse.get(objectId)?.get(t)
      if (sources) {
        for (const from of sources) {
          const rel = this.findRelationship(from, objectId, t)
          if (rel) result.push(rel)
        }
      }
    }

    return result
  }

  // Все связи объекта (входящие + исходящие)
  getAll(objectId: UUID, type?: RelationshipType): Relationship[] {
    return [
      ...this.getOutgoing(objectId, type),
      ...this.getIncoming(objectId, type),
    ]
  }

  // Связи с конкретным типом
  getByType(type: RelationshipType): Relationship[] {
    return Array.from(this.relationships.values()).filter(r => r.type === type)
  }

  // Проверка существования связи
  exists(from: UUID, to: UUID, type: RelationshipType): boolean {
    const targets = this.adjacencyForward.get(from)?.get(type)
    return targets?.has(to) ?? false
  }

  // Прямые связи
  getDirectRelations(objectId: UUID): UUID[] {
    const targets = new Set<UUID>()

    // Исходящие
    const forward = this.adjacencyForward.get(objectId)
    if (forward) {
      for (const targetsOfType of forward.values()) {
        for (const t of targetsOfType) targets.add(t)
      }
    }

    // Входящие
    const reverse = this.adjacencyReverse.get(objectId)
    if (reverse) {
      for (const sourcesOfType of reverse.values()) {
        for (const s of sourcesOfType) targets.add(s)
      }
    }

    return Array.from(targets)
  }

  // --- Цепочки связей ---

  // Найти всю цепочку от объекта (DFS)
  getChain(objectId: UUID, maxDepth: number = 10): RelationshipChain {
    const visited = new Set<UUID>()
    const chain: RelationshipChain = { nodes: [], edges: [], depth: 0 }

    const dfs = (currentId: UUID, depth: number): void => {
      if (depth > maxDepth || visited.has(currentId)) return
      visited.add(currentId)

      chain.nodes.push(currentId)
      chain.depth = Math.max(chain.depth, depth)

      const outgoing = this.getOutgoing(currentId)
      for (const rel of outgoing) {
        chain.edges.push(rel)
        dfs(rel.to, depth + 1)
      }
    }

    dfs(objectId, 0)
    return chain
  }

  // Найти путь между двумя объектами (BFS)
  findPath(from: UUID, to: UUID, maxDepth: number = 10): Relationship[] | null {
    const visited = new Set<UUID>()
    const queue: Array<{ id: UUID; path: Relationship[] }> = [{ id: from, path: [] }]

    while (queue.length > 0) {
      const { id, path } = queue.shift()!

      if (id === to) return path
      if (path.length >= maxDepth) continue
      if (visited.has(id)) continue
      visited.add(id)

      const outgoing = this.getOutgoing(id)
      for (const rel of outgoing) {
        queue.push({ id: rel.to, path: [...path, rel] })
      }
    }

    return null
  }

  // --- Валидация ---

  validate(): ValidationResult {
    const issues: ValidationIssue[] = []

    // Проверяем существование объектов
    for (const rel of this.relationships.values()) {
      if (!ObjectRegistry.has(rel.from)) {
        issues.push({
          severity: "error",
          message: `Связь ${rel.id}: объект ${rel.from} не найден`,
          relationshipId: rel.id,
        })
      }
      if (!ObjectRegistry.has(rel.to)) {
        issues.push({
          severity: "error",
          message: `Связь ${rel.id}: объект ${rel.to} не найден`,
          relationshipId: rel.id,
        })
      }
    }

    // Проверяем двусторонние связи
    for (const rel of this.relationships.values()) {
      if (rel.type === "connectedTo") {
        if (!this.exists(rel.to, rel.from, "connectedTo")) {
          issues.push({
            severity: "warning",
            message: `Связь connectedTo не двусторонняя: ${rel.from} → ${rel.to}`,
            relationshipId: rel.id,
          })
        }
      }
    }

    return {
      valid: issues.filter(i => i.severity === "error").length === 0,
      issues,
    }
  }

  // --- Статистика ---

  getStats(): RelationshipStats {
    const rels = Array.from(this.relationships.values())
    const byType: Partial<Record<RelationshipType, number>> = {}

    for (const rel of rels) {
      byType[rel.type] = (byType[rel.type] ?? 0) + 1
    }

    return {
      total: rels.length,
      byType,
      objectsWithRelationships: new Set(
        rels.flatMap(r => [r.from, r.to])
      ).size,
    }
  }

  // --- События ---

  on(listener: (event: RelationshipEvent) => void): () => void {
    this.listeners.push(listener)
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener)
    }
  }

  // --- Импорт/экспорт ---

  exportAll(): Relationship[] {
    return Array.from(this.relationships.values())
  }

  importAll(relationships: Relationship[]): void {
    this.relationships.clear()
    this.adjacencyForward.clear()
    this.adjacencyReverse.clear()

    for (const rel of relationships) {
      this.relationships.set(rel.id, rel)
      this.addToAdjacency(this.adjacencyForward, rel.from, rel.type, rel.to)
      this.addToAdjacency(this.adjacencyReverse, rel.to, rel.type, rel.from)
    }
  }

  clear(): void {
    this.relationships.clear()
    this.adjacencyForward.clear()
    this.adjacencyReverse.clear()
  }

  // --- Приватные методы ---

  private addToAdjacency(
    adj: Map<UUID, Map<RelationshipType, Set<UUID>>>,
    source: UUID,
    type: RelationshipType,
    target: UUID
  ): void {
    if (!adj.has(source)) adj.set(source, new Map())
    const typeMap = adj.get(source)!
    if (!typeMap.has(type)) typeMap.set(type, new Set())
    typeMap.get(type)!.add(target)
  }

  private removeFromAdjacency(
    adj: Map<UUID, Map<RelationshipType, Set<UUID>>>,
    source: UUID,
    type: RelationshipType,
    target: UUID
  ): void {
    adj.get(source)?.get(type)?.delete(target)
  }

  private findRelationship(from: UUID, to: UUID, type: RelationshipType): Relationship | undefined {
    return Array.from(this.relationships.values()).find(
      r => r.from === from && r.to === to && r.type === type
    )
  }

  private syncToObject(from: UUID, to: UUID, type: RelationshipType, action: "add" | "remove"): void {
    // Синхронизация с компонентом relationships объекта
    const obj = ObjectRegistry.get(from)
    if (!obj?.relationships) return

    switch (type) {
      case "contains":
      case "belongsToRoom":
      case "installedIn":
        if (action === "add") {
          if (!obj.relationships.children.includes(to)) {
            obj.relationships.children.push(to)
          }
        } else {
          obj.relationships.children = obj.relationships.children.filter(id => id !== to)
        }
        break
      case "connectedTo":
      case "poweredBy":
      case "feedsFrom":
      case "protectionFor":
      case "controls":
        if (action === "add") {
          if (!obj.relationships.connectedTo.includes(to)) {
            obj.relationships.connectedTo.push(to)
          }
        } else {
          obj.relationships.connectedTo = obj.relationships.connectedTo.filter(id => id !== to)
        }
        break
      case "mountedOn":
        if (action === "add") {
          obj.relationships.mountedOn = to
        } else {
          obj.relationships.mountedOn = undefined
        }
        break
      case "belongsToCircuit":
      case "belongsToPanel":
        if (action === "add") {
          obj.relationships.belongsTo = to
        } else {
          obj.relationships.belongsTo = undefined
        }
        break
      case "referencedBy":
        if (action === "add") {
          if (!obj.relationships.referencedBy.includes(to)) {
            obj.relationships.referencedBy.push(to)
          }
        } else {
          obj.relationships.referencedBy = obj.relationships.referencedBy.filter(id => id !== to)
        }
        break
    }
  }

  private emit(event: RelationshipEvent): void {
    for (const listener of this.listeners) {
      listener(event)
    }
  }
}

// ============================================================
// ТИПЫ
// ============================================================

export interface RelationshipChain {
  nodes: UUID[]
  edges: Relationship[]
  depth: number
}

export interface ValidationResult {
  valid: boolean
  issues: ValidationIssue[]
}

export interface ValidationIssue {
  severity: "error" | "warning"
  message: string
  relationshipId: UUID
}

export interface RelationshipStats {
  total: number
  byType: Partial<Record<RelationshipType, number>>
  objectsWithRelationships: number
}

export interface RelationshipEvent {
  type: "added" | "removed"
  relationship: Relationship
}

// ============================================================
// СИНГЛТОН
// ============================================================

export const RelationshipSystem = new RelationshipSystemImpl()
