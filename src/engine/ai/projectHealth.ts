// ============================================================
// ElectricPMR — Project Health & Engineering Score
// ============================================================
//
// Метрики проекта на языке бизнеса:
// - Safety
// - Maintainability
// - Expandability
// - Energy Efficiency
// - Documentation
//
// + общий Engineering Score с объяснением.
// ============================================================

import type { UUID } from "../types/common"
import { ComponentStore, type ElectricalData } from "../core/ecs"
import { TopologyEngine } from "./topologyEngine"
import { ConstraintEngine } from "./constraintEngine"
import { WorkflowEngine } from "./workflowEngine"

// ============================================================
// HEALTH TYPES
// ============================================================

export interface ProjectHealthReport {
  projectId: UUID
  timestamp: Date
  scores: HealthScores
  engineeringScore: number // 0-100
  factors: ScoreFactor[]
  summary: string
  improvements: Improvement[]
}

export interface HealthScores {
  safety: number // 0-100
  maintainability: number // 0-100
  expandability: number // 0-100
  energyEfficiency: number // 0-100
  documentation: number // 0-100
}

export interface ScoreFactor {
  name: string
  impact: "positive" | "negative"
  description: string
  weight: number
}

export interface Improvement {
  category: string
  description: string
  impact: number // баллов
  priority: "high" | "medium" | "low"
}

// ============================================================
// PROJECT HEALTH
// ============================================================

class ProjectHealthImpl {

  analyze(projectId: UUID): ProjectHealthReport {
    const scores = this.calculateScores(projectId)
    const factors = this.analyzeFactors(projectId)
    const improvements = this.suggestImprovements(scores, factors)

    const engineeringScore = this.calculateEngineeringScore(scores, factors)

    return {
      projectId,
      timestamp: new Date(),
      scores,
      engineeringScore,
      factors,
      summary: this.generateSummary(engineeringScore, scores),
      improvements,
    }
  }

  private calculateScores(projectId: UUID): HealthScores {
    return {
      safety: this.calculateSafetyScore(projectId),
      maintainability: this.calculateMaintainabilityScore(projectId),
      expandability: this.calculateExpandabilityScore(projectId),
      energyEfficiency: this.calculateEnergyEfficiencyScore(projectId),
      documentation: this.calculateDocumentationScore(projectId),
    }
  }

  private calculateSafetyScore(projectId: UUID): number {
    let score = 70 // Базовый балл

    // Наличие УЗО
    const hasRCD = this.hasComponentOfType("rcd")
    if (hasRCD) score += 10

    // Наличие заземления
    const hasGrounding = true // Предполагаем
    if (hasGrounding) score += 5

    // Соответствие нормативам
    const constraints = ConstraintEngine.getAll()
    const safetyConstraints = constraints.filter(c => c.category === "safety")
    if (safetyConstraints.length > 0) score += 5

    // Топология
    const topology = TopologyEngine.buildTopology(projectId)
    const topologyValidation = TopologyEngine.validate()
    if (topologyValidation.valid) score += 10

    return Math.min(100, score)
  }

  private calculateMaintainabilityScore(projectId: UUID): number {
    let score = 70

    // Количество групп (меньше = проще обслуживать)
    const breakerCount = this.countComponentsOfType("breaker")
    if (breakerCount <= 12) score += 10
    else if (breakerCount <= 20) score += 5
    else score -= 5

    // Маркировка
    const entities = ComponentStore.queryByComponent("identity")
    const labeledCount = entities.filter(e => e.data.name && !e.data.name.startsWith("Object")).length
    if (labeledCount > entities.length * 0.8) score += 10

    return Math.min(100, score)
  }

  private calculateExpandabilityScore(projectId: UUID): number {
    let score = 60

    // Резервные места в щите
    const panelModules = 36 // Типичный щит
    const usedModules = this.countComponentsOfType("breaker") + this.countComponentsOfType("rcd")
    const reserve = panelModules - usedModules

    if (reserve >= 6) score += 20
    else if (reserve >= 3) score += 10
    else score -= 10

    // Кабельные сечения с запасом
    score += 10

    return Math.min(100, score)
  }

  private calculateEnergyEfficiencyScore(projectId: UUID): number {
    let score = 65

    // Наличие LED освещения
    const hasLED = true // Предполагаем
    if (hasLED) score += 15

    // Наличие датчиков
    const hasSensors = this.hasComponentOfType("sensor_motion")
    if (hasSensors) score += 10

    return Math.min(100, score)
  }

  private calculateDocumentationScore(projectId: UUID): number {
    let score = 30

    // Проверяем этапы workflow
    const workflow = WorkflowEngine.getWorkflow(projectId)
    if (workflow) {
      const docStage = workflow.stages.find(s => s.id === "documentation")
      if (docStage?.status === "completed") score += 70
      else if (docStage?.status === "in_progress") score += 30
    }

    return Math.min(100, score)
  }

  private analyzeFactors(projectId: UUID): ScoreFactor[] {
    const factors: ScoreFactor[] = []

    // Позитивные факторы
    if (this.hasComponentOfType("rcd")) {
      factors.push({
        name: "Наличие УЗО",
        impact: "positive",
        description: "Установлены устройства защитного отключения",
        weight: 10,
      })
    }

    const breakerCount = this.countComponentsOfType("breaker")
    if (breakerCount > 0 && breakerCount <= 12) {
      factors.push({
        name: "Оптимальное количество автоматов",
        impact: "positive",
        description: `${breakerCount} автоматов — достаточно для обслуживания`,
        weight: 5,
      })
    }

    // Негативные факторы
    if (breakerCount > 20) {
      factors.push({
        name: "Много автоматов",
        impact: "negative",
        description: `${breakerCount} автоматов — рекомендуется группировка`,
        weight: -5,
      })
    }

    return factors
  }

  private calculateEngineeringScore(
    scores: HealthScores,
    factors: ScoreFactor[]
  ): number {
    // Взвешенное среднее
    const weights = { safety: 0.3, maintainability: 0.2, expandability: 0.2, energyEfficiency: 0.15, documentation: 0.15 }

    let score =
      scores.safety * weights.safety +
      scores.maintainability * weights.maintainability +
      scores.expandability * weights.expandability +
      scores.energyEfficiency * weights.energyEfficiency +
      scores.documentation * weights.documentation

    // Корректировка за факторы
    for (const factor of factors) {
      score += factor.weight
    }

    return Math.round(Math.min(100, Math.max(0, score)))
  }

  private generateSummary(score: number, scores: HealthScores): string {
    const lines: string[] = []

    if (score >= 90) {
      lines.push("Проект высокого качества.")
    } else if (score >= 75) {
      lines.push("Проект хорошего качества.")
    } else if (score >= 60) {
      lines.push("Проект приемлемого качества.")
    } else {
      lines.push("Проект требует доработки.")
    }

    // Лучший показатель
    const best = Object.entries(scores).sort((a, b) => b[1] - a[1])[0]
    lines.push(`Сильная сторона: ${best[0]} (${best[1]}/100)`)

    // Худший показатель
    const worst = Object.entries(scores).sort((a, b) => a[1] - b[1])[0]
    lines.push(`Слабая сторона: ${worst[0]} (${worst[1]}/100)`)

    return lines.join(" ")
  }

  private suggestImprovements(
    scores: HealthScores,
    factors: ScoreFactor[]
  ): Improvement[] {
    const improvements: Improvement[] = []

    if (scores.safety < 80) {
      improvements.push({
        category: "Безопасность",
        description: "Добавить УЗО 30мА на розеточные группы",
        impact: 10,
        priority: "high",
      })
    }

    if (scores.expandability < 70) {
      improvements.push({
        category: "Расширяемость",
        description: "Предусмотреть резервные места в щите",
        impact: 15,
        priority: "medium",
      })
    }

    if (scores.documentation < 50) {
      improvements.push({
        category: "Документация",
        description: "Сгенерировать спецификацию и схему",
        impact: 20,
        priority: "medium",
      })
    }

    return improvements
  }

  // --- Утилиты ---

  private hasComponentOfType(type: string): boolean {
    const entities = ComponentStore.queryByComponent("identity")
    return entities.some(e => e.data.type === type)
  }

  private countComponentsOfType(type: string): number {
    const entities = ComponentStore.queryByComponent("identity")
    return entities.filter(e => e.data.type === type).length
  }
}

// ============================================================
// СИНГЛТОН
// ============================================================

export const ProjectHealth = new ProjectHealthImpl()
