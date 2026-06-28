// ============================================================
// ElectricPMR — Project Variants Engine
// ============================================================
//
// Один проект — несколько вариантов решения.
// Все варианты используют одну геометрию, но отличаются:
// - кабелями;
// - автоматами;
// - брендами;
// - схемой щита;
// - группировкой;
// - стоимостью;
// - запасом мощности.
// ============================================================

import type { UUID } from "../types/common"
import { ComponentStore, type ComponentMap } from "../core/ecs"
import { AlternativeEngine, type AlternativeSolution, type SolutionMetrics } from "./alternativeEngine"

// ============================================================
// VARIANT TYPES
// ============================================================

export type VariantTier = "economy" | "standard" | "premium" | "custom"

export interface ProjectVariant {
  id: UUID
  projectId: UUID
  name: string
  tier: VariantTier
  description: string
  metrics: VariantMetrics
  solutions: AlternativeSolution[]
  decisions: UUID[]
  isRecommended: boolean
  isApplied: boolean
  createdAt: Date
}

export interface VariantMetrics {
  totalCost: number
  costPerMeter: number
  cableLength: number
  breakerCount: number
  panelModules: number
  reliabilityScore: number
  safetyScore: number
  expandabilityScore: number
  maintenanceScore: number
  installationTime: number // часы
  powerReserve: number // %
}

export interface VariantComparison {
  variants: ProjectVariant[]
  aspects: string[]
  matrix: ComparisonMatrix
  recommendation: string
  summary: string
}

export interface ComparisonMatrix {
  [variantId: string]: {
    [aspect: string]: {
      value: string
      score: number // 0-100
      rank: number // 1, 2, 3...
    }
  }
}

// ============================================================
// VARIANT ENGINE
// ============================================================

class VariantEngineImpl {
  private variants: Map<UUID, ProjectVariant> = new Map()
  private projectVariants: Map<UUID, UUID[]> = new Map()

  // --- Создание вариантов ---

  generateVariants(projectId: UUID): ProjectVariant[] {
    const variants: ProjectVariant[] = []

    // Вариант 1: Эконом
    variants.push(this.createVariant(
      projectId,
      "Экономичный",
      "economy",
      "Минимальная стоимость при соответствии нормативам",
      this.getEconomySolutions()
    ))

    // Вариант 2: Стандарт
    variants.push(this.createVariant(
      projectId,
      "Стандартный",
      "standard",
      "Оптимальный баланс стоимости и качества",
      this.getStandardSolutions()
    ))

    // Вариант 3: Премиум
    variants.push(this.createVariant(
      projectId,
      "Премиум",
      "premium",
      "Максимальное качество и расширяемость",
      this.getPremiumSolutions()
    ))

    // Рекомендуем стандартный
    variants[1].isRecommended = true

    // Сохраняем
    this.projectVariants.set(projectId, variants.map(v => v.id))
    for (const variant of variants) {
      this.variants.set(variant.id, variant)
    }

    return variants
  }

  private createVariant(
    projectId: UUID,
    name: string,
    tier: VariantTier,
    description: string,
    solutions: AlternativeSolution[]
  ): ProjectVariant {
    const metrics = this.calculateMetrics(solutions)

    return {
      id: this.generateId(),
      projectId,
      name,
      tier,
      description,
      metrics,
      solutions,
      decisions: [],
      isRecommended: false,
      isApplied: false,
      createdAt: new Date(),
    }
  }

  private getEconomySolutions(): AlternativeSolution[] {
    return [
      {
        id: this.generateId(),
        name: "Кабель 2.5мм²",
        description: "Минимальное сечение для розеток",
        approach: "Экономия на кабеле",
        metrics: {
          totalCost: 45000,
          cableLength: 80,
          breakerCount: 10,
          panelModules: 18,
          reliabilityScore: 75,
          safetyScore: 70,
          expandabilityScore: 60,
          maintenanceScore: 80,
          installationComplexity: "simple",
          installationTime: 12,
        },
        pros: ["Низкая стоимость"],
        cons: ["Малый запас"],
        tradeoffs: [],
        confidence: 0.85,
        decisionIds: [],
      },
    ]
  }

  private getStandardSolutions(): AlternativeSolution[] {
    return [
      {
        id: this.generateId(),
        name: "Кабель 2.5/4мм²",
        description: "Стандартные сечения с запасом",
        approach: "2.5мм² розетки, 4мм² силовые",
        metrics: {
          totalCost: 75000,
          cableLength: 100,
          breakerCount: 12,
          panelModules: 24,
          reliabilityScore: 85,
          safetyScore: 80,
          expandabilityScore: 75,
          maintenanceScore: 85,
          installationComplexity: "moderate",
          installationTime: 16,
        },
        pros: ["Сбалансированное решение"],
        cons: [],
        tradeoffs: [],
        confidence: 0.92,
        decisionIds: [],
      },
    ]
  }

  private getPremiumSolutions(): AlternativeSolution[] {
    return [
      {
        id: this.generateId(),
        name: "Кабель 4/6мм²",
        description: "Увеличенные сечения для максимального запаса",
        approach: "4мм² розетки, 6мм² силовые",
        metrics: {
          totalCost: 130000,
          cableLength: 120,
          breakerCount: 14,
          panelModules: 30,
          reliabilityScore: 95,
          safetyScore: 95,
          expandabilityScore: 90,
          maintenanceScore: 90,
          installationComplexity: "complex",
          installationTime: 24,
        },
        pros: ["Максимальный запас", "Идеально для умного дома"],
        cons: ["Высокая стоимость"],
        tradeoffs: [],
        confidence: 0.88,
        decisionIds: [],
      },
    ]
  }

  private calculateMetrics(solutions: AlternativeSolution[]): VariantMetrics {
    const main = solutions[0]
    return {
      totalCost: main.metrics.totalCost,
      costPerMeter: main.metrics.totalCost / main.metrics.cableLength,
      cableLength: main.metrics.cableLength,
      breakerCount: main.metrics.breakerCount,
      panelModules: main.metrics.panelModules,
      reliabilityScore: main.metrics.reliabilityScore,
      safetyScore: main.metrics.safetyScore,
      expandabilityScore: main.metrics.expandabilityScore,
      maintenanceScore: main.metrics.maintenanceScore,
      installationTime: main.metrics.installationTime,
      powerReserve: 30,
    }
  }

  // --- Сравнение ---

  compareVariants(projectId: UUID): VariantComparison | null {
    const variantIds = this.projectVariants.get(projectId)
    if (!variantIds) return null

    const variants = variantIds
      .map(id => this.variants.get(id))
      .filter((v): v is ProjectVariant => v !== undefined)

    if (variants.length === 0) return null

    const aspects = [
      "Стоимость",
      "Безопасность",
      "Расширяемость",
      "Надёжность",
      "Простота обслуживания",
      "Время монтажа",
    ]

    const matrix: ComparisonMatrix = {}

    for (const variant of variants) {
      matrix[variant.id] = {
        "Стоимость": {
          value: `${variant.metrics.totalCost} руб.`,
          score: Math.max(0, 100 - variant.metrics.totalCost / 1500),
          rank: 0,
        },
        "Безопасность": {
          value: `${variant.metrics.safetyScore}/100`,
          score: variant.metrics.safetyScore,
          rank: 0,
        },
        "Расширяемость": {
          value: `${variant.metrics.expandabilityScore}/100`,
          score: variant.metrics.expandabilityScore,
          rank: 0,
        },
        "Надёжность": {
          value: `${variant.metrics.reliabilityScore}/100`,
          score: variant.metrics.reliabilityScore,
          rank: 0,
        },
        "Простота обслуживания": {
          value: `${variant.metrics.maintenanceScore}/100`,
          score: variant.metrics.maintenanceScore,
          rank: 0,
        },
        "Время монтажа": {
          value: `${variant.metrics.installationTime} ч.`,
          score: Math.max(0, 100 - variant.metrics.installationTime * 2),
          rank: 0,
        },
      }
    }

    // Вычисляем ранги
    for (const aspect of aspects) {
      const sorted = variants
        .map(v => ({ id: v.id, score: matrix[v.id][aspect].score }))
        .sort((a, b) => b.score - a.score)

      sorted.forEach((item, index) => {
        matrix[item.id][aspect].rank = index + 1
      })
    }

    // Рекомендация
    const avgScores = variants.map(v => {
      const scores = aspects.map(a => matrix[v.id][a].score)
      const avg = scores.reduce((a, b) => a + b, 0) / scores.length
      return { name: v.name, avg, tier: v.tier }
    })
    avgScores.sort((a, b) => b.avg - a.avg)

    const recommended = avgScores[0]

    return {
      variants,
      aspects,
      matrix,
      recommendation: `Рекомендуется: ${recommended.name} (${recommended.tier})`,
      summary: this.generateSummary(variants, matrix, recommended.name),
    }
  }

  private generateSummary(
    variants: ProjectVariant[],
    matrix: ComparisonMatrix,
    recommendedName: string
  ): string {
    const lines: string[] = []

    lines.push("## Сравнение вариантов проекта\n")

    for (const variant of variants) {
      const isRec = variant.name === recommendedName
      lines.push(`### ${variant.name} ${isRec ? "(рекомендуется)" : ""}`)
      lines.push(`${variant.description}\n`)
      lines.push(`- Стоимость: ${variant.metrics.totalCost} руб.`)
      lines.push(`- Безопасность: ${variant.metrics.safetyScore}/100`)
      lines.push(`- Расширяемость: ${variant.metrics.expandabilityScore}/100`)
      lines.push(`- Время монтажа: ${variant.metrics.installationTime} ч.\n`)
    }

    return lines.join("\n")
  }

  // --- Применение варианта ---

  applyVariant(variantId: UUID): boolean {
    const variant = this.variants.get(variantId)
    if (!variant) return false

    // Снимаем флаг применения с других
    for (const v of this.variants.values()) {
      if (v.projectId === variant.projectId) {
        v.isApplied = false
      }
    }

    variant.isApplied = true
    return true
  }

  // --- Запросы ---

  getVariant(id: UUID): ProjectVariant | undefined {
    return this.variants.get(id)
  }

  getProjectVariants(projectId: UUID): ProjectVariant[] {
    const ids = this.projectVariants.get(projectId) ?? []
    return ids.map(id => this.variants.get(id)!).filter(Boolean)
  }

  getRecommended(projectId: UUID): ProjectVariant | undefined {
    return this.getProjectVariants(projectId).find(v => v.isRecommended)
  }

  getApplied(projectId: UUID): ProjectVariant | undefined {
    return this.getProjectVariants(projectId).find(v => v.isApplied)
  }

  // --- Утилиты ---

  private generateId(): UUID {
    return `variant_${Date.now()}_${Math.random().toString(36).slice(2, 9)}` as UUID
  }
}

// ============================================================
// СИНГЛТОН
// ============================================================

export const VariantEngine = new VariantEngineImpl()
