// ============================================================
// ElectricPMR — Constraint Engine
// ============================================================
//
// Ограничения проекта живут отдельно от Intent.
// Пользователь задаёт ограничения — система их учитывает
// при принятии всех инженерных решений.
// ============================================================

import type { UUID } from "../types/common"

// ============================================================
// CONSTRAINT TYPES
// ============================================================

export type ConstraintCategory =
  | "budget"
  | "brand"
  | "installation"
  | "safety"
  | "performance"
  | "aesthetic"
  | "future"
  | "regulation"

export type ConstraintPriority = "must" | "should" | "nice_to_have"

export interface Constraint {
  id: UUID
  category: ConstraintCategory
  type: string
  value: unknown
  priority: ConstraintPriority
  description: string
  source: "user" | "project" | "regulation" | "inferred"
  createdAt: Date
}

// ============================================================
// SPECIFIC CONSTRAINT TYPES
// ============================================================

export interface BudgetConstraint extends Constraint {
  category: "budget"
  type: "max_total" | "per_room" | "per_circuit"
  value: number // в рублях или евро
  currency: string
}

export interface BrandConstraint extends Constraint {
  category: "brand"
  type: "prefer" | "exclude" | "exclusive"
  value: string[] // ["ABB", "Schneider"]
}

export interface InstallationConstraint extends Constraint {
  category: "installation"
  type: "method" | "wall_type" | "floor_type"
  value: "hidden" | "open" | "mixed" | "no_drilling_loadbearing" | "no_drilling_any"
}

export interface SafetyConstraint extends Constraint {
  category: "safety"
  type: "rcd_required" | "arc_fault" | "surge_protection" | "backup_power"
  value: boolean | string
}

export interface PerformanceConstraint extends Constraint {
  category: "performance"
  type: "max_voltage_drop" | "min_cable_section" | "max_circuit_load" | "phase_balance"
  value: number
}

export interface FutureConstraint extends Constraint {
  category: "future"
  type: "ev_charging" | "solar_panels" | "battery_storage" | "smart_home" | "expansion_reserve"
  value: boolean | number // boolean или % резерва
}

// ============================================================
// CONSTRAINT ENGINE
// ============================================================

class ConstraintEngineImpl {
  private constraints: Map<UUID, Constraint> = new Map()
  private listeners: Array<(event: ConstraintEvent) => void> = []

  // --- CRUD ---

  add(constraint: Omit<Constraint, "id" | "createdAt">): Constraint {
    const id = `constraint_${Date.now()}_${Math.random().toString(36).slice(2, 9)}` as UUID

    const fullConstraint: Constraint = {
      ...constraint,
      id,
      createdAt: new Date(),
    }

    this.constraints.set(id, fullConstraint)
    this.emit({ type: "added", constraint: fullConstraint })
    return fullConstraint
  }

  remove(id: UUID): void {
    const constraint = this.constraints.get(id)
    if (!constraint) return

    this.constraints.delete(id)
    this.emit({ type: "removed", constraint })
  }

  get(id: UUID): Constraint | undefined {
    return this.constraints.get(id)
  }

  getAll(): Constraint[] {
    return Array.from(this.constraints.values())
  }

  // --- Query ---

  getByCategory(category: ConstraintCategory): Constraint[] {
    return this.getAll().filter(c => c.category === category)
  }

  getByPriority(priority: ConstraintPriority): Constraint[] {
    return this.getAll().filter(c => c.priority === priority)
  }

  getMustConstraints(): Constraint[] {
    return this.getByPriority("must")
  }

  getBrandConstraints(): BrandConstraint[] {
    return this.getByCategory("brand") as BrandConstraint[]
  }

  getBudgetConstraints(): BudgetConstraint[] {
    return this.getByCategory("budget") as BudgetConstraint[]
  }

  // --- Validation ---

  validateAgainstConstraints(decision: EngineeringDecision): ConstraintValidation {
    const violations: ConstraintViolation[] = []
    const warnings: string[] = []

    for (const constraint of this.constraints.values()) {
      const result = this.checkConstraint(constraint, decision)
      if (result.violated) {
        if (constraint.priority === "must") {
          violations.push({
            constraint,
            message: result.message,
            severity: "error",
          })
        } else if (constraint.priority === "should") {
          warnings.push(`${constraint.description}: ${result.message}`)
        }
      }
    }

    return {
      valid: violations.length === 0,
      violations,
      warnings,
    }
  }

  private checkConstraint(
    constraint: Constraint,
    decision: EngineeringDecision
  ): { violated: boolean; message: string } {
    switch (constraint.category) {
      case "budget":
        return this.checkBudgetConstraint(constraint as BudgetConstraint, decision)
      case "brand":
        return this.checkBrandConstraint(constraint as BrandConstraint, decision)
      case "installation":
        return this.checkInstallationConstraint(constraint as InstallationConstraint, decision)
      case "performance":
        return this.checkPerformanceConstraint(constraint as PerformanceConstraint, decision)
      case "future":
        return this.checkFutureConstraint(constraint as FutureConstraint, decision)
      default:
        return { violated: false, message: "" }
    }
  }

  private checkBudgetConstraint(
    constraint: BudgetConstraint,
    decision: EngineeringDecision
  ): { violated: boolean; message: string } {
    if (decision.estimatedCost && decision.estimatedCost > constraint.value) {
      return {
        violated: true,
        message: `Превышен бюджет: ${decision.estimatedCost} ${constraint.currency} > ${constraint.value} ${constraint.currency}`,
      }
    }
    return { violated: false, message: "" }
  }

  private checkBrandConstraint(
    constraint: BrandConstraint,
    decision: EngineeringDecision
  ): { violated: boolean; message: string } {
    if (constraint.type === "exclusive" && decision.brand) {
      if (!constraint.value.includes(decision.brand)) {
        return {
          violated: true,
          message: `Использован бренд ${decision.brand}, разрешён только ${constraint.value.join(", ")}`,
        }
      }
    }

    if (constraint.type === "exclude" && decision.brand) {
      if (constraint.value.includes(decision.brand)) {
        return {
          violated: true,
          message: `Бренд ${decision.brand} запрещён ограничениями`,
        }
      }
    }

    return { violated: false, message: "" }
  }

  private checkInstallationConstraint(
    constraint: InstallationConstraint,
    decision: EngineeringDecision
  ): { violated: boolean; message: string } {
    if (constraint.value === "no_drilling_loadbearing" && decision.drillsLoadBearingWall) {
      return {
        violated: true,
        message: "Запрещено сверлить несущие стены",
      }
    }

    if (constraint.value === "no_drilling_any" && decision.drillsAnyWall) {
      return {
        violated: true,
        message: "Запрещено сверлить стены",
      }
    }

    if (constraint.value === "open" && decision.installationMethod === "hidden") {
      return {
        violated: true,
        message: "Выбрана скрытая проводка при ограничении «только открытая»",
      }
    }

    return { violated: false, message: "" }
  }

  private checkPerformanceConstraint(
    constraint: PerformanceConstraint,
    decision: EngineeringDecision
  ): { violated: boolean; message: string } {
    if (constraint.type === "max_voltage_drop" && decision.voltageDrop) {
      if (decision.voltageDrop > constraint.value) {
        return {
          violated: true,
          message: `Падение напряжения ${decision.voltageDrop}% превышает допустимое ${constraint.value}%`,
        }
      }
    }

    return { violated: false, message: "" }
  }

  private checkFutureConstraint(
    constraint: FutureConstraint,
    decision: EngineeringDecision
  ): { violated: boolean; message: string } {
    if (constraint.type === "ev_charging" && constraint.value === true) {
      if (!decision.hasEvChargingReserve) {
        return {
          violated: true,
          message: "Отсутствует резерв для зарядки электромобиля",
        }
      }
    }

    return { violated: false, message: "" }
  }

  // --- Export for other engines ---

  getConstraintSummary(): ConstraintSummary {
    const all = this.getAll()

    return {
      total: all.length,
      byCategory: {
        budget: this.getByCategory("budget").length,
        brand: this.getByCategory("brand").length,
        installation: this.getByCategory("installation").length,
        safety: this.getByCategory("safety").length,
        performance: this.getByCategory("performance").length,
        future: this.getByCategory("future").length,
      },
      byPriority: {
        must: this.getByPriority("must").length,
        should: this.getByPriority("should").length,
        nice_to_have: this.getByPriority("nice_to_have").length,
      },
      brandPreferences: this.getBrandConstraints().flatMap(c => c.value),
    }
  }

  // --- Events ---

  on(listener: (event: ConstraintEvent) => void): () => void {
    this.listeners.push(listener)
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener)
    }
  }

  private emit(event: ConstraintEvent): void {
    for (const listener of this.listeners) {
      listener(event)
    }
  }

  clear(): void {
    this.constraints.clear()
  }
}

// ============================================================
// DECISION & VALIDATION TYPES
// ============================================================

export interface EngineeringDecision {
  type: string
  description: string
  brand?: string
  estimatedCost?: number
  currency?: string
  installationMethod?: "hidden" | "open" | "mixed"
  drillsLoadBearingWall?: boolean
  drillsAnyWall?: boolean
  voltageDrop?: number
  hasEvChargingReserve?: boolean
  metadata?: Record<string, unknown>
}

export interface ConstraintValidation {
  valid: boolean
  violations: ConstraintViolation[]
  warnings: string[]
}

export interface ConstraintViolation {
  constraint: Constraint
  message: string
  severity: "error" | "warning"
}

export interface ConstraintSummary {
  total: number
  byCategory: Record<string, number>
  byPriority: Record<string, number>
  brandPreferences: string[]
}

export interface ConstraintEvent {
  type: "added" | "removed"
  constraint: Constraint
}

// ============================================================
// СИНГЛТОН
// ============================================================

export const ConstraintEngine = new ConstraintEngineImpl()
