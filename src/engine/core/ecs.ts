// ============================================================
// ElectricPMR — Entity-Component-System (ECS) Core
// ============================================================
//
// Объект — это только ID. Все данные живут отдельно.
// Это позволяет масштабировать систему до тысяч объектов
// с эффективной фильтрацией, индексацией и сериализацией.
// ============================================================

import type { UUID } from "../types/common"

// ============================================================
// COMPONENT TYPE MAP
// ============================================================

// Карта "имя компонента → тип данных"
// Расширяйте эту карту при добавлении новых компонентов

export interface ComponentMap {
  identity: IdentityData
  geometry: GeometryData
  electrical: ElectricalData
  visual: VisualData
  metadata: MetadataData
  relationships: RelationshipsData
  capabilities: CapabilityData
  validation: ValidationData
  lifecycle: LifecycleData
}

export type ComponentName = keyof ComponentMap

// ============================================================
// COMPONENT DATA TYPES
// ============================================================

export interface IdentityData {
  name: string
  type: string
  version: number
  createdAt: Date
  modifiedAt: Date
}

export interface GeometryData {
  x: number
  y: number
  rotation: number
  width: number
  height: number
  depth?: number
  points?: Array<{ x: number; y: number }>
  zLevel?: number
}

export interface ElectricalData {
  power?: number
  voltage?: number
  current?: number
  phase?: 1 | 2 | 3
  circuitId?: UUID
  panelId?: UUID
  breakerType?: string
  breakerRating?: number
  rcdType?: "none" | "AC" | "A" | "B"
  rcdRating?: number
  load?: number
}

export interface VisualData {
  shape: "rect" | "circle" | "polygon" | "line" | "path"
  fill: string
  stroke: string
  strokeWidth: number
  opacity: number
  layer: string
  icon?: string
  label?: string
  labelOffset?: { x: number; y: number }
}

export interface MetadataData {
  tags: string[]
  custom: Record<string, unknown>
  manufacturer?: string
  model?: string
  articleNumber?: string
  price?: number
  currency?: string
}

export interface RelationshipsData {
  parent?: UUID
  children: UUID[]
  containedIn?: UUID
  connectedTo: UUID[]
  mountedOn?: UUID
  belongsTo?: UUID
  referencedBy: UUID[]
}

export interface CapabilityData {
  canRotate: boolean
  canResize: boolean
  canMove: boolean
  canDelete: boolean
  canConnectCable: boolean
  canContainObjects: boolean
  canCarryLoad: boolean
  canMountOnWall: boolean
  canMountOnCeiling: boolean
  canSplitCircuit: boolean
  canGenerateDocument: boolean
  canBeGrouped: boolean
  canBeCopied: boolean
  hasTerminals: boolean
  supportsPhase: boolean
  supportsRCD: boolean
  requiresRoom: boolean
}

export interface ValidationData {
  rules: ValidationRuleData[]
  lastValidated?: Date
  lastResult?: ValidationResultData
}

export interface ValidationRuleData {
  id: string
  name: string
  description: string
  severity: "error" | "warning" | "info"
}

export interface ValidationResultData {
  valid: boolean
  errors: string[]
  warnings: string[]
  infos: string[]
}

export interface LifecycleData {
  status: string
  phase: string
  assignedTo?: string
  dueDate?: Date
  completedAt?: Date
  approvedBy?: string
  approvedAt?: Date
}

// ============================================================
// COMPONENT STORE
// ============================================================

export class ComponentStoreImpl {
  private stores = new Map<ComponentName, Map<UUID, unknown>>()
  private entityComponents = new Map<UUID, Set<ComponentName>>()
  private listeners: Array<(event: ComponentStoreEvent) => void> = []

  constructor() {
    // Инициализируем хранилища для каждого типа компонента
    for (const name of COMPONENT_NAMES) {
      this.stores.set(name, new Map())
    }
  }

  // --- Entity Management ---

  createEntity(): UUID {
    const id = `entity_${Date.now()}_${Math.random().toString(36).slice(2, 9)}` as UUID
    this.entityComponents.set(id, new Set())
    return id
  }

  createEntityWithId(id: UUID): void {
    this.entityComponents.set(id, new Set())
  }

  destroyEntity(id: UUID): void {
    const components = this.entityComponents.get(id)
    if (!components) return

    // Удаляем все компоненты
    for (const name of components) {
      this.stores.get(name)?.delete(id)
    }

    this.entityComponents.delete(id)
    this.emit({ type: "entity_destroyed", entityId: id })
  }

  entityExists(id: UUID): boolean {
    return this.entityComponents.has(id)
  }

  getEntityComponents(id: UUID): ComponentName[] {
    return Array.from(this.entityComponents.get(id) ?? [])
  }

  getAllEntities(): UUID[] {
    return Array.from(this.entityComponents.keys())
  }

  // --- Component CRUD ---

  addComponent<C extends ComponentName>(
    entityId: UUID,
    componentName: C,
    data: ComponentMap[C]
  ): void {
    if (!this.entityComponents.has(entityId)) {
      throw new Error(`Entity ${entityId} does not exist`)
    }

    const store = this.stores.get(componentName)
    if (!store) throw new Error(`Unknown component: ${componentName}`)

    store.set(entityId, data)
    this.entityComponents.get(entityId)!.add(componentName)

    this.emit({ type: "component_added", entityId, componentName })
  }

  getComponent<C extends ComponentName>(
    entityId: UUID,
    componentName: C
  ): ComponentMap[C] | undefined {
    return this.stores.get(componentName)?.get(entityId) as ComponentMap[C] | undefined
  }

  getComponentOrThrow<C extends ComponentName>(
    entityId: UUID,
    componentName: C
  ): ComponentMap[C] {
    const data = this.getComponent(entityId, componentName)
    if (!data) {
      throw new Error(`Entity ${entityId} has no ${componentName} component`)
    }
    return data
  }

  hasComponent(entityId: UUID, componentName: ComponentName): boolean {
    return this.stores.get(componentName)?.has(entityId) ?? false
  }

  removeComponent(entityId: UUID, componentName: ComponentName): void {
    this.stores.get(componentName)?.delete(entityId)
    this.entityComponents.get(entityId)?.delete(componentName)
    this.emit({ type: "component_removed", entityId, componentName })
  }

  // --- Batch Operations ---

  addComponents(
    entityId: UUID,
    components: Partial<ComponentMap>
  ): void {
    for (const [name, data] of Object.entries(components)) {
      if (data !== undefined) {
        this.addComponent(entityId, name as ComponentName, data)
      }
    }
  }

  getEntity<C extends ComponentName[]>(
    entityId: UUID,
    ...componentNames: C
  ): EntityWithComponents<C> | undefined {
    const result: Record<string, unknown> = {}

    for (const name of componentNames) {
      const data = this.getComponent(entityId, name)
      if (data === undefined) return undefined
      result[name] = data
    }

    return result as EntityWithComponents<C>
  }

  // --- Queries ---

  // Найти все сущности, имеющие ВСЕ указанные компоненты
  query<C extends ComponentName[]>(
    ...componentNames: C
  ): EntityWithComponents<C>[] {
    const results: EntityWithComponents<C>[] = []

    for (const [entityId, components] of this.entityComponents) {
      if (componentNames.every(name => components.has(name))) {
        const entity: Record<string, unknown> = {}
        for (const name of componentNames) {
          entity[name] = this.stores.get(name)!.get(entityId)
        }
        results.push(entity as EntityWithComponents<C>)
      }
    }

    return results
  }

  // Найти сущности с одним компонентом
  queryByComponent<C extends ComponentName>(
    componentName: C
  ): EntityWithData<C>[] {
    const store = this.stores.get(componentName)
    if (!store) return []

    const results: EntityWithData<C>[] = []
    for (const [entityId, data] of store) {
      results.push({ entityId, data: data as ComponentMap[C] })
    }

    return results
  }

  // Фильтрация по значению компонента
  filterByComponent<C extends ComponentName>(
    componentName: C,
    predicate: (data: ComponentMap[C]) => boolean
  ): UUID[] {
    const store = this.stores.get(componentName)
    if (!store) return []

    const results: UUID[] = []
    for (const [entityId, data] of store) {
      if (predicate(data as ComponentMap[C])) {
        results.push(entityId)
      }
    }

    return results
  }

  // --- Statistics ---

  getStats(): ComponentStoreStats {
    const entityCount = this.entityComponents.size
    const componentCounts: Partial<Record<ComponentName, number>> = {}

    for (const [name, store] of this.stores) {
      componentCounts[name] = store.size
    }

    return {
      entityCount,
      componentCounts,
      totalComponents: Array.from(this.stores.values()).reduce(
        (sum, store) => sum + store.size, 0
      ),
    }
  }

  // --- Snapshot (для транзакций) ---

  snapshot(): ComponentStoreSnapshot {
    const entities: Record<UUID, Partial<ComponentMap>> = {}

    for (const [entityId, components] of this.entityComponents) {
      entities[entityId] = {}
      for (const name of components) {
        const store = this.stores.get(name)
        if (store?.has(entityId)) {
          (entities[entityId] as Record<string, unknown>)[name] = JSON.parse(
            JSON.stringify(store.get(entityId))
          )
        }
      }
    }

    return { entities, timestamp: new Date() }
  }

  restore(snapshot: ComponentStoreSnapshot): void {
    this.clear()

    for (const [entityId, components] of Object.entries(snapshot.entities)) {
      this.entityComponents.set(entityId as UUID, new Set())
      for (const [name, data] of Object.entries(components)) {
        if (data !== undefined) {
          this.addComponent(entityId as UUID, name as ComponentName, data)
        }
      }
    }
  }

  clear(): void {
    for (const store of this.stores.values()) {
      store.clear()
    }
    this.entityComponents.clear()
  }

  // --- Events ---

  on(listener: (event: ComponentStoreEvent) => void): () => void {
    this.listeners.push(listener)
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener)
    }
  }

  private emit(event: ComponentStoreEvent): void {
    for (const listener of this.listeners) {
      listener(event)
    }
  }
}

// ============================================================
// ТИПЫ
// ============================================================

export type EntityWithComponents<C extends ComponentName[]> = {
  [K in C[number]]: ComponentMap[K]
} & { entityId: UUID }

export type EntityWithData<C extends ComponentName> = {
  entityId: UUID
  data: ComponentMap[C]
}

export interface ComponentStoreEvent {
  type: "component_added" | "component_removed" | "entity_destroyed"
  entityId: UUID
  componentName?: ComponentName
}

export interface ComponentStoreStats {
  entityCount: number
  componentCounts: Partial<Record<ComponentName, number>>
  totalComponents: number
}

export interface ComponentStoreSnapshot {
  entities: Record<UUID, Partial<ComponentMap>>
  timestamp: Date
}

// ============================================================
// CONSTANTS
// ============================================================

const COMPONENT_NAMES: ComponentName[] = [
  "identity",
  "geometry",
  "electrical",
  "visual",
  "metadata",
  "relationships",
  "capabilities",
  "validation",
  "lifecycle",
]

// ============================================================
// ENTITY BUILDER (Fluent API)
// ============================================================

export class EntityBuilder {
  private components: Partial<ComponentMap> = {}

  static create(store: ComponentStoreImpl): EntityBuilder {
    return new EntityBuilder(store)
  }

  private constructor(private store: ComponentStoreImpl) {}

  withIdentity(data: IdentityData): this {
    this.components.identity = data
    return this
  }

  withGeometry(data: GeometryData): this {
    this.components.geometry = data
    return this
  }

  withElectrical(data: ElectricalData): this {
    this.components.electrical = data
    return this
  }

  withVisual(data: VisualData): this {
    this.components.visual = data
    return this
  }

  withMetadata(data: MetadataData): this {
    this.components.metadata = data
    return this
  }

  withRelationships(data: RelationshipsData): this {
    this.components.relationships = data
    return this
  }

  withCapabilities(data: CapabilityData): this {
    this.components.capabilities = data
    return this
  }

  withValidation(data: ValidationData): this {
    this.components.validation = data
    return this
  }

  withLifecycle(data: LifecycleData): this {
    this.components.lifecycle = data
    return this
  }

  build(): UUID {
    const entityId = this.store.createEntity()
    this.store.addComponents(entityId, this.components)
    return entityId
  }
}

// ============================================================
// СИНГЛТОН
// ============================================================

export const ComponentStore = new ComponentStoreImpl()
