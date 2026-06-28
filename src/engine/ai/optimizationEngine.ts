// ============================================================
// ElectricPMR — Optimization Engine
// ============================================================
//
// AI не должен просто "выполнять".
// Он должен искать лучшее решение.
// ============================================================

import type { UUID } from "../types/common"
import { ComponentStore, type ElectricalData } from "../core/ecs"

// ============================================================
// OPTIMIZATION TYPES
// ============================================================

export type OptimizationCriteria =
  | "min_cost"           // Минимальная стоимость
  | "min_cable_length"   // Минимальная длина кабеля
  | "min_breakers"       // Минимальное количество автоматов
  | "max_reliability"    // Максимальная надёжность
  | "max_safety"         // Максимальная безопасность
  | "best_phase_balance" // Лучший баланс фаз
  | "min_voltage_drop"   // Минимальное падение напряжения
  | "max_expandability"  // Максимальная расширяемость

export interface OptimizationGoal {
  criteria: OptimizationCriteria
  weight: number // 0-1, приоритет критерия
}

export interface OptimizationResult {
  id: UUID
  goal: OptimizationGoal
  original: SolutionMetrics
  optimized: SolutionMetrics
  changes: OptimizationChange[]
  savings: SolutionMetrics
  confidence: number
  reasoning: string[]
}

export interface SolutionMetrics {
  totalCost: number
  totalCableLength: number
  breakerCount: number
  circuitCount: number
  reliabilityScore: number // 0-100
  safetyScore: number // 0-100
  phaseBalance: { L1: number; L2: number; L3: number }
  voltageDrop: number // %
  expandabilityScore: number // 0-100
}

export interface OptimizationChange {
  type: "cable" | "breaker" | "circuit" | "layout" | "brand"
  description: string
  before: unknown
  after: unknown
  impact: Partial<SolutionMetrics>
}

// ============================================================
// OPTIMIZATION ENGINE
// ============================================================

class OptimizationEngineImpl {

  // --- Основной метод оптимизации ---

  optimize(
    projectId: UUID,
    goals: OptimizationGoal[]
  ): OptimizationResult {
    // Собираем текущие метрики
    const original = this.collectMetrics(projectId)

    // Применяем оптимизации по каждому критерию
    const changes: OptimizationChange[] = []
    const reasoning: string[] = []

    // Сортируем по весу (приоритету)
    const sortedGoals = [...goals].sort((a, b) => b.weight - a.weight)

    for (const goal of sortedGoals) {
      const result = this.optimizeForCriteria(projectId, goal.criteria, original)
      changes.push(...result.changes)
      reasoning.push(...result.reasoning)
    }

    // Собираем итоговые метрики
    const optimized = this.applyChangesAndMeasure(projectId, changes)

    return {
      id: this.generateId(),
      goal: sortedGoals[0],
      original,
      optimized,
      changes,
      savings: this.calculateSavings(original, optimized),
      confidence: this.calculateConfidence(changes),
      reasoning,
    }
  }

  // --- Оптимизация по критериям ---

  private optimizeForCriteria(
    projectId: UUID,
    criteria: OptimizationCriteria,
    current: SolutionMetrics
  ): { changes: OptimizationChange[]; reasoning: string[] } {
    const changes: OptimizationChange[] = []
    const reasoning: string[] = []

    switch (criteria) {
      case "min_cost":
        return this.optimizeForCost(projectId, current)
      case "min_cable_length":
        return this.optimizeForCableLength(projectId, current)
      case "min_breakers":
        return this.optimizeForBreakerCount(projectId, current)
      case "max_safety":
        return this.optimizeForSafety(projectId, current)
      case "best_phase_balance":
        return this.optimizeForPhaseBalance(projectId, current)
      case "min_voltage_drop":
        return this.optimizeForVoltageDrop(projectId, current)
      default:
        return { changes: [], reasoning: [] }
    }
  }

  private optimizeForCost(
    projectId: UUID,
    current: SolutionMetrics
  ): { changes: OptimizationChange[]; reasoning: string[] } {
    const changes: OptimizationChange[] = []
    const reasoning: string[] = []

    // Пример: замена кабеля на более дешёвый где возможно
    if (current.totalCost > 50000) {
      changes.push({
        type: "cable",
        description: "Замена кабеля 4мм² на 2.5мм² для линий с нагрузкой < 3.5кВт",
        before: "4мм²",
        after: "2.5мм²",
        impact: { totalCost: -15000, totalCableLength: 0 },
      })
      reasoning.push("Линии с нагрузкой менее 3.5кВт могут работать на кабеле 2.5мм²")
    }

    return { changes, reasoning }
  }

  private optimizeForCableLength(
    projectId: UUID,
    current: SolutionMetrics
  ): { changes: OptimizationChange[]; reasoning: string[] } {
    const changes: OptimizationChange[] = []
    const reasoning: string[] = []

    // Пример: оптимизация трассы
    if (current.totalCableLength > 100) {
      changes.push({
        type: "layout",
        description: "Оптимизация трассы кабелей через центральный короб",
        before: "Радиальная схема",
        after: "Смешанная схема",
        impact: { totalCableLength: -20 },
      })
      reasoning.push("Центральный распределительный узел сокращает суммарную длину кабеля")
    }

    return { changes, reasoning }
  }

  private optimizeForBreakerCount(
    projectId: UUID,
    current: SolutionMetrics
  ): { changes: OptimizationChange[]; reasoning: string[] } {
    const changes: OptimizationChange[] = []
    const reasoning: string[] = []

    // Пример: объединение мелких групп
    if (current.circuitCount > 12) {
      changes.push({
        type: "circuit",
        description: "Объединение групп освещения разных комнат в одну линию",
        before: "3 группы освещения",
        after: "1 группа освещения",
        impact: { circuitCount: -2, breakerCount: -2 },
      })
      reasoning.push("Группы освещения с малой нагрузкой можно объединить")
    }

    return { changes, reasoning }
  }

  private optimizeForSafety(
    projectId: UUID,
    current: SolutionMetrics
  ): { changes: OptimizationChange[]; reasoning: string[] } {
    const changes: OptimizationChange[] = []
    const reasoning: string[] = []

    if (current.safetyScore < 80) {
      changes.push({
        type: "breaker",
        description: "Добавление УЗО 30мА на ввод",
        before: "Без УЗО на вводе",
        after: "УЗО 25А/30мА на вводе",
        impact: { safetyScore: 15 },
      })
      reasoning.push("УЗО на вводе повышает общую безопасность системы")
    }

    return { changes, reasoning }
  }

  private optimizeForPhaseBalance(
    projectId: UUID,
    current: SolutionMetrics
  ): { changes: OptimizationChange[]; reasoning: string[] } {
    const changes: OptimizationChange[] = []
    const reasoning: string[] = []

    const maxImbalance = Math.max(
      Math.abs(current.phaseBalance.L1 - current.phaseBalance.L2),
      Math.abs(current.phaseBalance.L2 - current.phaseBalance.L3),
      Math.abs(current.phaseBalance.L1 - current.phaseBalance.L3)
    )

    if (maxImbalance > 1000) {
      changes.push({
        type: "circuit",
        description: "Перераспределение групп по фазам для балансировки",
        before: `${current.phaseBalance.L1}/${current.phaseBalance.L2}/${current.phaseBalance.L3}`,
        after: "Более равномерное распределение",
        impact: { phaseBalance: { L1: 3000, L2: 3000, L3: 3000 } },
      })
      reasoning.push("Неравномерная нагрузка на фазы увеличивает потери")
    }

    return { changes, reasoning }
  }

  private optimizeForVoltageDrop(
    projectId: UUID,
    current: SolutionMetrics
  ): { changes: OptimizationChange[]; reasoning: string[] } {
    const changes: OptimizationChange[] = []
    const reasoning: string[] = []

    if (current.voltageDrop > 3) {
      changes.push({
        type: "cable",
        description: "Увеличение сечения кабеля для длинных линий",
        before: "2.5мм²",
        after: "4мм²",
        impact: { voltageDrop: -1.5 },
      })
      reasoning.push("Длинные линии требуют увеличенного сечения для снижения падения напряжения")
    }

    return { changes, reasoning }
  }

  // --- Метрики ---

  private collectMetrics(projectId: UUID): SolutionMetrics {
    const entities = ComponentStore.queryByComponent("electrical")
    let totalPower = 0
    let circuitCount = 0

    for (const entity of entities) {
      if (entity.data.power) {
        totalPower += entity.data.power
      }
      if (entity.data.circuitId) {
        circuitCount++
      }
    }

    return {
      totalCost: this.estimateCost(entities),
      totalCableLength: this.estimateCableLength(entities),
      breakerCount: ComponentStore.filterByComponent("identity", (i) => i.type === "breaker").length,
      circuitCount,
      reliabilityScore: 70,
      safetyScore: 60,
      phaseBalance: { L1: totalPower / 3, L2: totalPower / 3, L3: totalPower / 3 },
      voltageDrop: 2.5,
      expandabilityScore: 50,
    }
  }

  private estimateCost(entities: { data: ElectricalData }[]): number {
    // Упрощённая оценка
    return entities.length * 2000 // ~2000 руб за точку
  }

  private estimateCableLength(entities: { data: ElectricalData }[]): number {
    return entities.length * 5 // ~5м кабеля на точку
  }

  private applyChangesAndMeasure(
    projectId: UUID,
    changes: OptimizationChange[]
  ): SolutionMetrics {
    // Упрощённо — в реальном продукте здесь будет применение изменений
    const original = this.collectMetrics(projectId)
    const optimized = { ...original }

    for (const change of changes) {
      if (change.impact.totalCost) optimized.totalCost += change.impact.totalCost
      if (change.impact.totalCableLength) optimized.totalCableLength += change.impact.totalCableLength
      if (change.impact.breakerCount) optimized.breakerCount += change.impact.breakerCount
      if (change.impact.circuitCount) optimized.circuitCount += change.impact.circuitCount
      if (change.impact.safetyScore) optimized.safetyScore += change.impact.safetyScore
      if (change.impact.voltageDrop) optimized.voltageDrop += change.impact.voltageDrop
    }

    return optimized
  }

  private calculateSavings(original: SolutionMetrics, optimized: SolutionMetrics): SolutionMetrics {
    return {
      totalCost: original.totalCost - optimized.totalCost,
      totalCableLength: original.totalCableLength - optimized.totalCableLength,
      breakerCount: original.breakerCount - optimized.breakerCount,
      circuitCount: original.circuitCount - optimized.circuitCount,
      reliabilityScore: optimized.reliabilityScore - original.reliabilityScore,
      safetyScore: optimized.safetyScore - original.safetyScore,
      phaseBalance: {
        L1: original.phaseBalance.L1 - optimized.phaseBalance.L1,
        L2: original.phaseBalance.L2 - optimized.phaseBalance.L2,
        L3: original.phaseBalance.L3 - optimized.phaseBalance.L3,
      },
      voltageDrop: original.voltageDrop - optimized.voltageDrop,
      expandabilityScore: optimized.expandabilityScore - original.expandabilityScore,
    }
  }

  private calculateConfidence(changes: OptimizationChange[]): number {
    // Уверенность зависит от количества и типа изменений
    let confidence = 0.8
    if (changes.length > 5) confidence -= 0.1
    if (changes.some(c => c.type === "layout")) confidence -= 0.1
    return Math.max(0.5, Math.min(1, confidence))
  }

  private generateId(): UUID {
    return `opt_${Date.now()}_${Math.random().toString(36).slice(2, 9)}` as UUID
  }
}

// ============================================================
// СИНГЛТОН
// ============================================================

export const OptimizationEngine = new OptimizationEngineImpl()
