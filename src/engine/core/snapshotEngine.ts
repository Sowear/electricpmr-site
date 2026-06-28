// ============================================================
// ElectricPMR — Snapshot Engine
// ============================================================
//
// Периодические снапшоты состояния проекта.
// Уменьшает стоимость восстановления длинной истории команд.
// ============================================================

import type { UUID } from "../types/common"
import { ComponentStore, type ComponentStoreSnapshot } from "./ecs"
import { RelationshipSystem, type Relationship } from "./relationshipSystem"

// ============================================================
// SNAPSHOT ENGINE
// ============================================================

class SnapshotEngineImpl {
  private snapshots: ProjectSnapshot[] = []
  private commandsSinceLastSnapshot = 0
  private commandsPerSnapshot = 100
  private maxSnapshots = 50
  private listeners: Array<(event: SnapshotEvent) => void> = []

  // --- Настройка ---

  configure(options: SnapshotConfig): void {
    if (options.commandsPerSnapshot !== undefined) {
      this.commandsPerSnapshot = options.commandsPerSnapshot
    }
    if (options.maxSnapshots !== undefined) {
      this.maxSnapshots = options.maxSnapshots
    }
  }

  // --- Создание снапшотов ---

  takeSnapshot(description?: string): ProjectSnapshot {
    const snapshot: ProjectSnapshot = {
      id: `snap_${Date.now()}_${Math.random().toString(36).slice(2, 9)}` as UUID,
      timestamp: new Date(),
      description,
      componentStore: ComponentStore.snapshot(),
      relationships: RelationshipSystem.exportAll(),
      commandCount: this.commandsSinceLastSnapshot,
      objectCount: ComponentStore.getAllEntities().length,
    }

    this.snapshots.push(snapshot)

    // Ограничиваем количество снапшотов
    if (this.snapshots.length > this.maxSnapshots) {
      this.snapshots = this.snapshots.slice(-this.maxSnapshots)
    }

    this.commandsSinceLastSnapshot = 0
    this.emit({ type: "snapshot_created", snapshot })
    return snapshot
  }

  // Вызвать после каждой команды
  onCommandExecuted(): void {
    this.commandsSinceLastSnapshot++

    if (this.commandsSinceLastSnapshot >= this.commandsPerSnapshot) {
      this.takeSnapshot(`Auto-snapshot after ${this.commandsPerSnapshot} commands`)
    }
  }

  // --- Восстановление ---

  restoreSnapshot(snapshotId: UUID): boolean {
    const snapshot = this.snapshots.find(s => s.id === snapshotId)
    if (!snapshot) return false

    ComponentStore.restore(snapshot.componentStore)

    // Восстанавливаем связи
    RelationshipSystem.clear()
    for (const rel of snapshot.relationships) {
      try {
        RelationshipSystem.add(rel.from, rel.to, rel.type, rel.metadata)
      } catch (err) {
        console.warn(`Failed to restore relationship ${rel.id}:`, err)
      }
    }

    this.emit({ type: "snapshot_restored", snapshot })
    return true
  }

  restoreLatest(): boolean {
    const latest = this.snapshots[this.snapshots.length - 1]
    if (!latest) return false
    return this.restoreSnapshot(latest.id)
  }

  // --- Запросы ---

  getSnapshot(id: UUID): ProjectSnapshot | undefined {
    return this.snapshots.find(s => s.id === id)
  }

  getAllSnapshots(): ProjectSnapshot[] {
    return [...this.snapshots]
  }

  getLatestSnapshot(): ProjectSnapshot | undefined {
    return this.snapshots[this.snapshots.length - 1]
  }

  getSnapshotsSince(since: Date): ProjectSnapshot[] {
    return this.snapshots.filter(s => s.timestamp >= since)
  }

  // Найти ближайший снапшот до указанного времени
  getNearestSnapshotBefore(time: Date): ProjectSnapshot | undefined {
    let nearest: ProjectSnapshot | undefined
    for (const snapshot of this.snapshots) {
      if (snapshot.timestamp <= time) {
        nearest = snapshot
      }
    }
    return nearest
  }

  // --- Статистика ---

  getStats(): SnapshotStats {
    return {
      totalSnapshots: this.snapshots.length,
      commandsSinceLastSnapshot: this.commandsSinceLastSnapshot,
      commandsPerSnapshot: this.commandsPerSnapshot,
      oldestSnapshot: this.snapshots[0]?.timestamp,
      newestSnapshot: this.snapshots[this.snapshots.length - 1]?.timestamp,
      totalCommandsCovered: this.snapshots.reduce(
        (sum, s) => sum + s.commandCount, 0
      ),
    }
  }

  // --- Очистка ---

  clear(): void {
    this.snapshots = []
    this.commandsSinceLastSnapshot = 0
  }

  // --- События ---

  on(listener: (event: SnapshotEvent) => void): () => void {
    this.listeners.push(listener)
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener)
    }
  }

  private emit(event: SnapshotEvent): void {
    for (const listener of this.listeners) {
      listener(event)
    }
  }
}

// ============================================================
// ТИПЫ
// ============================================================

export interface ProjectSnapshot {
  id: UUID
  timestamp: Date
  description?: string
  componentStore: ComponentStoreSnapshot
  relationships: Relationship[]
  commandCount: number
  objectCount: number
}

export interface SnapshotConfig {
  commandsPerSnapshot?: number
  maxSnapshots?: number
}

export interface SnapshotEvent {
  type: "snapshot_created" | "snapshot_restored"
  snapshot: ProjectSnapshot
}

export interface SnapshotStats {
  totalSnapshots: number
  commandsSinceLastSnapshot: number
  commandsPerSnapshot: number
  oldestSnapshot?: Date
  newestSnapshot?: Date
  totalCommandsCovered: number
}

// ============================================================
// СИНГЛТОН
// ============================================================

export const SnapshotEngine = new SnapshotEngineImpl()
