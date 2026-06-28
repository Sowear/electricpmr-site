// ============================================================
// ElectricPMR — Migration Engine
// ============================================================
//
// Автоматическая миграция старых проектов.
// Никогда не ломать обратную совместимость.
// ============================================================

import type { UUID } from "../types/common"
import type { SerializedProject } from "./projectSerializer"

// ============================================================
// MIGRATION ENGINE
// ============================================================

class MigrationEngineImpl {
  private migrations: Migration[] = []

  constructor() {
    this.registerBuiltinMigrations()
  }

  // --- Регистрация миграций ---

  register(migration: Migration): void {
    // Проверяем уникальность
    if (this.migrations.some(m => m.fromVersion === migration.fromVersion)) {
      throw new Error(`Migration from version ${migration.fromVersion} already exists`)
    }

    this.migrations.push(migration)
    this.migrations.sort((a, b) => a.fromVersion - b.fromVersion)
  }

  // --- Миграция ---

  migrate(data: SerializedProject, targetVersion?: number): MigrationResult {
    const target = targetVersion ?? this.getLatestVersion()
    let current = { ...data }
    const appliedMigrations: string[] = []

    while (current.version < target) {
      const migration = this.migrations.find(m => m.fromVersion === current.version)
      if (!migration) {
        return {
          success: false,
          data: current,
          error: `No migration found from version ${current.version}`,
          appliedMigrations,
        }
      }

      try {
        current = migration.migrate(current)
        current.version = migration.fromVersion + 1
        appliedMigrations.push(migration.description)
      } catch (err) {
        return {
          success: false,
          data: current,
          error: `Migration failed: ${err instanceof Error ? err.message : String(err)}`,
          appliedMigrations,
        }
      }
    }

    return {
      success: true,
      data: current,
      appliedMigrations,
    }
  }

  // --- Проверка необходимости миграции ---

  needsMigration(data: SerializedProject): boolean {
    return data.version < this.getLatestVersion()
  }

  // --- Получение плана миграции ---

  getMigrationPlan(data: SerializedProject): MigrationPlan {
    const plan: MigrationStep[] = []
    let currentVersion = data.version

    while (currentVersion < this.getLatestVersion()) {
      const migration = this.migrations.find(m => m.fromVersion === currentVersion)
      if (!migration) break

      plan.push({
        fromVersion: currentVersion,
        toVersion: migration.fromVersion + 1,
        description: migration.description,
        breaking: migration.breaking,
      })

      currentVersion = migration.fromVersion + 1
    }

    return {
      currentVersion: data.version,
      targetVersion: this.getLatestVersion(),
      steps: plan,
      totalSteps: plan.length,
    }
  }

  // --- Версии ---

  getLatestVersion(): number {
    if (this.migrations.length === 0) return 1
    return Math.max(...this.migrations.map(m => m.fromVersion)) + 1
  }

  getRegisteredMigrations(): MigrationInfo[] {
    return this.migrations.map(m => ({
      fromVersion: m.fromVersion,
      toVersion: m.fromVersion + 1,
      description: m.description,
      breaking: m.breaking,
    }))
  }

  // --- Встроенные миграции ---

  private registerBuiltinMigrations(): void {
    // Миграция 0 → 1: Базовая структура
    this.register({
      fromVersion: 0,
      description: "Initial project structure",
      breaking: false,
      migrate: (data) => ({
        ...data,
        version: 1,
        schemaVersion: "1.0.0",
        migrationVersion: 0,
        metadata: {
          ...data.metadata,
          name: data.metadata?.name ?? "Untitled Project",
          tags: data.metadata?.tags ?? [],
        },
        objects: data.objects ?? [],
        relationships: data.relationships ?? [],
      }),
    })

    // Миграция 1 → 2: Добавление capabilities в объекты
    this.register({
      fromVersion: 1,
      description: "Add capabilities component to objects",
      breaking: false,
      migrate: (data) => ({
        ...data,
        version: 2,
        objects: (data.objects ?? []).map((obj: Record<string, unknown>) => ({
          ...obj,
          capabilities: obj.capabilities ?? getDefaultCapabilities(obj.type as string),
        })),
      }),
    })

    // Миграция 2 → 3: Добавление lifecycle в объекты
    this.register({
      fromVersion: 2,
      description: "Add lifecycle component to objects",
      breaking: false,
      migrate: (data) => ({
        ...data,
        version: 3,
        objects: (data.objects ?? []).map((obj: Record<string, unknown>) => ({
          ...obj,
          lifecycle: obj.lifecycle ?? {
            status: "draft",
            phase: "design",
          },
        })),
      }),
    })
  }
}

// ============================================================
// ТИПЫ
// ============================================================

export interface Migration {
  fromVersion: number
  description: string
  breaking: boolean
  migrate: (data: SerializedProject) => SerializedProject
}

export interface MigrationResult {
  success: boolean
  data: SerializedProject
  error?: string
  appliedMigrations: string[]
}

export interface MigrationPlan {
  currentVersion: number
  targetVersion: number
  steps: MigrationStep[]
  totalSteps: number
}

export interface MigrationStep {
  fromVersion: number
  toVersion: number
  description: string
  breaking: boolean
}

export interface MigrationInfo {
  fromVersion: number
  toVersion: number
  description: string
  breaking: boolean
}

// ============================================================
// УТИЛИТЫ
// ============================================================

function getDefaultCapabilities(type: string): Record<string, boolean> {
  const base = {
    canRotate: true,
    canResize: true,
    canMove: true,
    canDelete: true,
    canConnectCable: false,
    canContainObjects: false,
    canCarryLoad: false,
    canMountOnWall: false,
    canMountOnCeiling: false,
    canSplitCircuit: false,
    canGenerateDocument: false,
    canBeGrouped: false,
    canBeCopied: true,
    hasTerminals: false,
    supportsPhase: false,
    supportsRCD: false,
    requiresRoom: false,
  }

  if (type?.includes("outlet") || type?.includes("switch") || type?.includes("light")) {
    return { ...base, canConnectCable: true, canMove: true, canBeGrouped: true, hasTerminals: true, canGenerateDocument: true }
  }

  if (type === "panel") {
    return { ...base, canContainObjects: true, canConnectCable: true, canMove: true, hasTerminals: true, supportsPhase: true, supportsRCD: true, canGenerateDocument: true }
  }

  if (type === "breaker" || type === "rcd") {
    return { ...base, canMove: true, canSplitCircuit: true, hasTerminals: true, supportsPhase: true, canGenerateDocument: true }
  }

  if (type === "wall") {
    return { ...base, canCarryLoad: true, canBeGrouped: true }
  }

  if (type === "room") {
    return { ...base, canContainObjects: true, canResize: true, canGenerateDocument: true }
  }

  return base
}

// ============================================================
// СИНГЛТОН
// ============================================================

export const MigrationEngine = new MigrationEngineImpl()
