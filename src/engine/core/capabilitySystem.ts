// ============================================================
// ElectricPMR — Capability System
// ============================================================
//
// Вместо проверки object.type проверяем способности объекта.
// Все подсистемы работают через capabilities.
// ============================================================

import type { UUID } from "../types/common"
import type { UniversalObject, CapabilityComponent } from "./universalObject"
import { ObjectRegistry } from "./objectRegistry"

// ============================================================
// CAPABILITY QUERIES
// ============================================================

class CapabilitySystemImpl {

  // --- Проверка способности ---

  canDo(objectId: UUID, capability: keyof CapabilityComponent): boolean {
    const obj = ObjectRegistry.get(objectId)
    if (!obj) return false
    return obj.capabilities?.[capability] ?? false
  }

  // --- Массовые запросы ---

  getAllWithCapability(capability: keyof CapabilityComponent): UniversalObject[] {
    return ObjectRegistry.getByCapability(capability)
  }

  // --- Фильтрация по нескольким способностям ---

  filterByCapabilities(
    objects: UniversalObject[],
    required: (keyof CapabilityComponent)[]
  ): UniversalObject[] {
    return objects.filter(obj =>
      required.every(cap => obj.capabilities?.[cap])
    )
  }

  // --- Поиск по способностям ---

  findObjectsThatCan(
    capability: keyof CapabilityComponent,
    filter?: Partial<Record<keyof CapabilityComponent, boolean>>
  ): UniversalObject[] {
    let results = ObjectRegistry.getByCapability(capability)

    if (filter) {
      for (const [cap, value] of Object.entries(filter)) {
        const key = cap as keyof CapabilityComponent
        if (value) {
          results = results.filter(obj => obj.capabilities?.[key])
        } else {
          results = results.filter(obj => !obj.capabilities?.[key])
        }
      }
    }

    return results
  }

  // --- Группировка по способностям ---

  groupByCapability(
    objects: UniversalObject[],
    capabilities: (keyof CapabilityComponent)[]
  ): Map<keyof CapabilityComponent, UniversalObject[]> {
    const groups = new Map<keyof CapabilityComponent, UniversalObject[]>()

    for (const cap of capabilities) {
      groups.set(cap, objects.filter(obj => obj.capabilities?.[cap]))
    }

    return groups
  }

  // --- Валидация способностей ---

  validateCapabilities(obj: UniversalObject): CapabilityValidation {
    const issues: CapabilityIssue[] = []

    // Розетка без электрического компонента
    if (obj.identity.type.includes("outlet") && !obj.electrical) {
      issues.push({
        severity: "error",
        message: "Розетка без электрического компонента",
        capability: "canConnectCable",
      })
    }

    // Щит без возможности содержать объекты
    if (obj.identity.type === "panel" && !obj.capabilities?.canContainObjects) {
      issues.push({
        severity: "error",
        message: "Щит должен уметь содержать объекты",
        capability: "canContainObjects",
      })
    }

    // Светильник на потолке без возможности монтирования
    if (
      obj.identity.type.includes("light") &&
      obj.identity.type.includes("ceiling") &&
      !obj.capabilities?.canMountOnCeiling
    ) {
      issues.push({
        severity: "error",
        message: "Потолочный светильник не может монтироваться на потолке",
        capability: "canMountOnCeiling",
      })
    }

    // Объект с электрикой без фазы
    if (
      obj.electrical?.power &&
      obj.electrical.power > 0 &&
      obj.capabilities?.supportsPhase &&
      !obj.electrical.phase
    ) {
      issues.push({
        severity: "warning",
        message: "Электрический объект без назначенной фазы",
        capability: "supportsPhase",
      })
    }

    return {
      valid: issues.filter(i => i.severity === "error").length === 0,
      issues,
    }
  }

  // --- Отчёт по способностям ---

  getCapabilityReport(objects: UniversalObject[]): CapabilityReport {
    const total = objects.length
    const byCapability: Partial<Record<keyof CapabilityComponent, number>> = {}

    const allCapabilities: (keyof CapabilityComponent)[] = [
      "canRotate", "canResize", "canMove", "canDelete",
      "canConnectCable", "canContainObjects", "canCarryLoad",
      "canMountOnWall", "canMountOnCeiling", "canSplitCircuit",
      "canGenerateDocument", "canBeGrouped", "canBeCopied",
      "hasTerminals", "supportsPhase", "supportsRCD", "requiresRoom",
    ]

    for (const cap of allCapabilities) {
      byCapability[cap] = objects.filter(obj => obj.capabilities?.[cap]).length
    }

    return {
      total,
      byCapability,
      electricalObjects: objects.filter(o => !!o.electrical).length,
      objectsWithValidation: objects.filter(o => !!o.validation).length,
    }
  }
}

// ============================================================
// ТИПЫ
// ============================================================

export interface CapabilityValidation {
  valid: boolean
  issues: CapabilityIssue[]
}

export interface CapabilityIssue {
  severity: "error" | "warning"
  message: string
  capability: keyof CapabilityComponent
}

export interface CapabilityReport {
  total: number
  byCapability: Partial<Record<keyof CapabilityComponent, number>>
  electricalObjects: number
  objectsWithValidation: number
}

// ============================================================
// СИНГЛТОН
// ============================================================

export const CapabilitySystem = new CapabilitySystemImpl()
