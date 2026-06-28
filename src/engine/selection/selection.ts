// ============================================================
// ElectricPMR — Selection Engine
// ============================================================
//
// Одиночное, множественное выделение, группировка, слои.
// ============================================================

import type { UUID } from "../types/common"
import { EventBus } from "../events/eventBus"

// ============================================================
// СЛОИ
// ============================================================

export interface Layer {
  id: UUID
  name: string
  visible: boolean
  locked: boolean
  opacity: number               // 0-1
  order: number
  objectIds: UUID[]
}

// ============================================================
// ВЫДЕЛЕНИЕ
// ============================================================

export interface SelectionState {
  selectedIds: Set<UUID>
  primaryId: UUID | null         // основной выделенный объект
  mode: "single" | "multi" | "group"
}

// ============================================================
// ГРУППЫ
// ============================================================

export interface SelectionGroup {
  id: UUID
  name: string
  objectIds: UUID[]
  createdAt: Date
}

// ============================================================
// SELECTION ENGINE
// ============================================================

class SelectionEngineImpl {
  private selection: SelectionState = {
    selectedIds: new Set(),
    primaryId: null,
    mode: "single",
  }

  private layers: Map<UUID, Layer> = new Map()
  private groups: Map<UUID, SelectionGroup> = new Map()
  private listeners: Set<() => void> = new Set()

  // --- Выделение ---

  select(id: UUID, additive: boolean = false): void {
    if (!additive) {
      this.selection.selectedIds.clear()
    }
    this.selection.selectedIds.add(id)
    this.selection.primaryId = id
    this.selection.mode = this.selection.selectedIds.size > 1 ? "multi" : "single"
    this.notify()
    this.emitSelection()
  }

  deselect(id: UUID): void {
    this.selection.selectedIds.delete(id)
    if (this.selection.primaryId === id) {
      this.selection.primaryId = this.selection.selectedIds.values().next().value ?? null
    }
    this.selection.mode = this.selection.selectedIds.size > 1 ? "multi" : "single"
    this.notify()
    this.emitSelection()
  }

  deselectAll(): void {
    this.selection.selectedIds.clear()
    this.selection.primaryId = null
    this.selection.mode = "single"
    this.notify()
    this.emitSelection()
  }

  selectAll(ids: UUID[]): void {
    this.selection.selectedIds = new Set(ids)
    this.selection.primaryId = ids[0] ?? null
    this.selection.mode = ids.length > 1 ? "multi" : "single"
    this.notify()
    this.emitSelection()
  }

  toggleSelect(id: UUID): void {
    if (this.selection.selectedIds.has(id)) {
      this.deselect(id)
    } else {
      this.select(id, true)
    }
  }

  selectByRect(rect: { x: number; y: number; width: number; height: number }, objectPositions: Map<UUID, { x: number; y: number }>): UUID[] {
    const selected: UUID[] = []
    objectPositions.forEach((pos, id) => {
      if (
        pos.x >= rect.x &&
        pos.x <= rect.x + rect.width &&
        pos.y >= rect.y &&
        pos.y <= rect.y + rect.height
      ) {
        selected.push(id)
      }
    })

    this.selection.selectedIds = new Set(selected)
    this.selection.primaryId = selected[0] ?? null
    this.selection.mode = selected.length > 1 ? "multi" : "single"
    this.notify()
    this.emitSelection()
    return selected
  }

  // --- Группировка ---

  groupSelected(name?: string): SelectionGroup | null {
    const ids = Array.from(this.selection.selectedIds)
    if (ids.length < 2) return null

    const group: SelectionGroup = {
      id: `group_${Date.now()}`,
      name: name || `Группа ${this.groups.size + 1}`,
      objectIds: ids,
      createdAt: new Date(),
    }

    this.groups.set(group.id, group)
    return group
  }

  ungroupSelected(): void {
    const ids = Array.from(this.selection.selectedIds)
    for (const [groupId, group] of this.groups) {
      if (ids.some(id => group.objectIds.includes(id))) {
        this.groups.delete(groupId)
      }
    }
  }

  getGroup(groupId: UUID): SelectionGroup | undefined {
    return this.groups.get(groupId)
  }

  getAllGroups(): SelectionGroup[] {
    return Array.from(this.groups.values())
  }

  // --- Слои ---

  createLayer(name: string, order?: number): Layer {
    const layer: Layer = {
      id: `layer_${Date.now()}`,
      name,
      visible: true,
      locked: false,
      opacity: 1,
      order: order ?? this.layers.size,
      objectIds: [],
    }
    this.layers.set(layer.id, layer)
    return layer
  }

  toggleLayerVisibility(layerId: UUID): void {
    const layer = this.layers.get(layerId)
    if (layer) {
      layer.visible = !layer.visible
      this.notify()
    }
  }

  toggleLayerLock(layerId: UUID): void {
    const layer = this.layers.get(layerId)
    if (layer) {
      layer.locked = !layer.locked
      this.notify()
    }
  }

  isObjectVisible(id: UUID): boolean {
    for (const layer of this.layers.values()) {
      if (layer.objectIds.includes(id)) {
        return layer.visible
      }
    }
    return true // нет слоя = видимый
  }

  isObjectLocked(id: UUID): boolean {
    for (const layer of this.layers.values()) {
      if (layer.objectIds.includes(id)) {
        return layer.locked
      }
    }
    return false
  }

  getLayerForObject(id: UUID): Layer | undefined {
    for (const layer of this.layers.values()) {
      if (layer.objectIds.includes(id)) {
        return layer
      }
    }
    return undefined
  }

  // --- Состояние ---

  getSelection(): SelectionState {
    return { ...this.selection }
  }

  getSelectedIds(): UUID[] {
    return Array.from(this.selection.selectedIds)
  }

  getPrimary(): UUID | null {
    return this.selection.primaryId
  }

  isSelected(id: UUID): boolean {
    return this.selection.selectedIds.has(id)
  }

  getSelectedCount(): number {
    return this.selection.selectedIds.size
  }

  // --- Подписка ---

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener)
    return () => { this.listeners.delete(listener) }
  }

  private notify(): void {
    this.listeners.forEach(l => l())
  }

  private emitSelection(): void {
    // Можно добавить событие в EventBus если нужно
  }
}

export const SelectionEngine = new SelectionEngineImpl()
