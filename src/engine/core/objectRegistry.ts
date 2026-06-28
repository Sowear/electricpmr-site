// ============================================================
// ElectricPMR — Object Registry
// ============================================================
//
// Центральное хранилище всех объектов проекта.
// Все обращения к объектам — только через Registry.
// ============================================================

import type { UUID } from "../types/common"
import type {
  UniversalObject,
  ObjectType,
  CapabilityComponent,
  RelationshipsComponent,
} from "./universalObject"

// ============================================================
// REGISTRY
// ============================================================

class ObjectRegistryImpl {
  private objects: Map<UUID, UniversalObject> = new Map()
  private byType: Map<ObjectType, Set<UUID>> = new Map()
  private byTag: Map<string, Set<UUID>> = new Map()
  private listeners: Array<(event: RegistryEvent) => void> = []

  // --- CRUD ---

  add(obj: UniversalObject): void {
    if (this.objects.has(obj.identity.id)) {
      throw new Error(`Object ${obj.identity.id} already exists`)
    }

    this.objects.set(obj.identity.id, obj)
    this.indexByType(obj)
    this.indexByTags(obj)
    this.emit({ type: "added", objectId: obj.identity.id, objectType: obj.identity.type })
  }

  get(id: UUID): UniversalObject | undefined {
    return this.objects.get(id)
  }

  getOrThrow(id: UUID): UniversalObject {
    const obj = this.objects.get(id)
    if (!obj) throw new Error(`Object ${id} not found`)
    return obj
  }

  update(id: UUID, patch: Partial<UniversalObject>): void {
    const obj = this.objects.get(id)
    if (!obj) throw new Error(`Object ${id} not found`)

    // Снимаем старые индексы
    this.unindexByType(obj)
    this.unindexByTags(obj)

    // Применяем патч
    const updated = this.mergeObject(obj, patch)
    updated.identity.modifiedAt = new Date()
    updated.identity.version++

    this.objects.set(id, updated)

    // Обновляем индексы
    this.indexByType(updated)
    this.indexByTags(updated)

    this.emit({ type: "updated", objectId: id, objectType: updated.identity.type })
  }

  remove(id: UUID): void {
    const obj = this.objects.get(id)
    if (!obj) throw new Error(`Object ${id} not found`)

    // Удаляем связи
    if (obj.relationships) {
      for (const childId of obj.relationships.children) {
        this.remove(childId)
      }
      for (const refId of obj.relationships.referencedBy) {
        const ref = this.objects.get(refId)
        if (ref?.relationships) {
          ref.relationships.connectedTo = ref.relationships.connectedTo.filter(cid => cid !== id)
          ref.relationships.children = ref.relationships.children.filter(cid => cid !== id)
        }
      }
    }

    this.unindexByType(obj)
    this.unindexByTags(obj)
    this.objects.delete(id)

    this.emit({ type: "removed", objectId: id, objectType: obj.identity.type })
  }

  has(id: UUID): boolean {
    return this.objects.has(id)
  }

  count(): number {
    return this.objects.size
  }

  // --- Запросы ---

  getByType(type: ObjectType): UniversalObject[] {
    const ids = this.byType.get(type)
    if (!ids) return []
    return Array.from(ids).map(id => this.objects.get(id)!).filter(Boolean)
  }

  getByTag(tag: string): UniversalObject[] {
    const ids = this.byTag.get(tag)
    if (!ids) return []
    return Array.from(ids).map(id => this.objects.get(id)!).filter(Boolean)
  }

  getByCapability(capability: keyof CapabilityComponent): UniversalObject[] {
    return Array.from(this.objects.values()).filter(
      obj => obj.capabilities?.[capability]
    )
  }

  getByParent(parentId: UUID): UniversalObject[] {
    return Array.from(this.objects.values()).filter(
      obj => obj.relationships?.parent === parentId
    )
  }

  getByRoom(roomId: UUID): UniversalObject[] {
    return Array.from(this.objects.values()).filter(
      obj => obj.relationships?.containedIn === roomId
    )
  }

  getByCircuit(circuitId: UUID): UniversalObject[] {
    return Array.from(this.objects.values()).filter(
      obj => obj.electrical?.circuitId === circuitId
    )
  }

  getByPanel(panelId: UUID): UniversalObject[] {
    return Array.from(this.objects.values()).filter(
      obj => obj.electrical?.panelId === panelId
    )
  }

  getAll(): UniversalObject[] {
    return Array.from(this.objects.values())
  }

  // --- Поиск ---

  search(query: string): UniversalObject[] {
    const q = query.toLowerCase()
    return Array.from(this.objects.values()).filter(obj => {
      if (obj.identity.name.toLowerCase().includes(q)) return true
      if (obj.identity.type.toLowerCase().includes(q)) return true
      if (obj.metadata?.tags.some(t => t.toLowerCase().includes(q))) return true
      if (obj.metadata?.manufacturer?.toLowerCase().includes(q)) return true
      if (obj.metadata?.model?.toLowerCase().includes(q)) return true
      return false
    })
  }

  // --- Статистика ---

  getStats(): RegistryStats {
    const objects = Array.from(this.objects.values())
    const typeCounts: Partial<Record<ObjectType, number>> = {}

    for (const obj of objects) {
      typeCounts[obj.identity.type] = (typeCounts[obj.identity.type] ?? 0) + 1
    }

    return {
      total: objects.length,
      byType: typeCounts as Record<ObjectType, number>,
      electrical: objects.filter(o => !!o.electrical).length,
      withValidation: objects.filter(o => !!o.validation).length,
    }
  }

  // --- События ---

  on(listener: (event: RegistryEvent) => void): () => void {
    this.listeners.push(listener)
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener)
    }
  }

  // --- Приватные методы ---

  private indexByType(obj: UniversalObject): void {
    if (!this.byType.has(obj.identity.type)) {
      this.byType.set(obj.identity.type, new Set())
    }
    this.byType.get(obj.identity.type)!.add(obj.identity.id)
  }

  private unindexByType(obj: UniversalObject): void {
    this.byType.get(obj.identity.type)?.delete(obj.identity.id)
  }

  private indexByTags(obj: UniversalObject): void {
    if (!obj.metadata?.tags) return
    for (const tag of obj.metadata.tags) {
      if (!this.byTag.has(tag)) {
        this.byTag.set(tag, new Set())
      }
      this.byTag.get(tag)!.add(obj.identity.id)
    }
  }

  private unindexByTags(obj: UniversalObject): void {
    if (!obj.metadata?.tags) return
    for (const tag of obj.metadata.tags) {
      this.byTag.get(tag)?.delete(obj.identity.id)
    }
  }

  private mergeObject(existing: UniversalObject, patch: Partial<UniversalObject>): UniversalObject {
    const result = { ...existing }

    if (patch.identity) {
      result.identity = { ...result.identity, ...patch.identity }
    }
    if (patch.geometry) {
      result.geometry = { ...result.geometry, ...patch.geometry }
    }
    if (patch.electrical) {
      result.electrical = { ...result.electrical, ...patch.electrical }
    }
    if (patch.visual) {
      result.visual = { ...result.visual, ...patch.visual }
    }
    if (patch.metadata) {
      result.metadata = { ...result.metadata, ...patch.metadata }
    }
    if (patch.relationships) {
      result.relationships = { ...result.relationships, ...patch.relationships }
    }
    if (patch.capabilities) {
      result.capabilities = { ...result.capabilities, ...patch.capabilities }
    }
    if (patch.validation) {
      result.validation = { ...result.validation, ...patch.validation }
    }
    if (patch.lifecycle) {
      result.lifecycle = { ...result.lifecycle, ...patch.lifecycle }
    }

    return result
  }

  private emit(event: RegistryEvent): void {
    for (const listener of this.listeners) {
      listener(event)
    }
  }

  // --- Импорт/экспорт (для сериализации) ---

  exportAll(): UniversalObject[] {
    return Array.from(this.objects.values())
  }

  importAll(objects: UniversalObject[]): void {
    this.objects.clear()
    this.byType.clear()
    this.byTag.clear()

    for (const obj of objects) {
      this.add(obj)
    }
  }

  clear(): void {
    this.objects.clear()
    this.byType.clear()
    this.byTag.clear()
  }
}

// ============================================================
// ТИПЫ
// ============================================================

export interface RegistryEvent {
  type: "added" | "updated" | "removed"
  objectId: UUID
  objectType: ObjectType
}

export interface RegistryStats {
  total: number
  byType: Record<string, number>
  electrical: number
  withValidation: number
}

// ============================================================
// СИНГЛТОН
// ============================================================

export const ObjectRegistry = new ObjectRegistryImpl()
