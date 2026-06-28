// ============================================================
// ElectricPMR — Engineering Decision Tree
// ============================================================
//
// Каждое инженерное решение хранит не только результат,
// но и его происхождение (цепочку принятия решения).
//
// Автомат C16:
//   ✓ нагрузка 2,8 кВт
//   ✓ кабель 2,5 мм²
//   ✓ длина линии 18 м
//   ✓ падение напряжения 1,7 %
//   ✓ соответствует ПУЭ
//   ✓ соответствует СП
//   ✓ пользователь предпочитает Schneider
// ============================================================

import type { UUID } from "../types/common"

// ============================================================
// DECISION TYPES
// ============================================================

export type DecisionCategory =
  | "cable_selection"     // Выбор сечения кабеля
  | "breaker_selection"   // Выбор автомата
  | "rcd_selection"       // Выбор УЗО
  | "circuit_design"      // Проектирование группы
  | "panel_layout"        // Компоновка щита
  | "load_calculation"    // Расчёт нагрузки
  | "route_selection"     // Выбор трассы
  | "brand_selection"     // Выбор бренда
  | "protection"          // Выбор защиты

export interface EngineeringDecision {
  id: UUID
  category: DecisionCategory
  timestamp: Date
  result: DecisionResult
  factors: DecisionFactor[]
  alternatives: DecisionAlternative[]
  normatives: NormativeReference[]
  confidence: number
  reasoning: string[]
}

export interface DecisionResult {
  type: string
  value: unknown
  description: string
  specs?: Record<string, unknown>
}

export interface DecisionFactor {
  name: string
  value: unknown
  weight: number // 0-1, влияние фактора на решение
  source: "calculation" | "measurement" | "user_input" | "default"
  description: string
}

export interface DecisionAlternative {
  id: string
  description: string
  pros: string[]
  cons: string[]
  estimatedCost?: number
  whyRejected: string
}

export interface NormativeReference {
  document: string // "ПУЭ 7", "СП 256", "ГОСТ 31543"
  section: string
  paragraph: string
  text: string
  compliance: "compliant" | "partial" | "non_compliant"
}

// ============================================================
// DECISION TREE
// ============================================================

class DecisionTreeImpl {
  private decisions: Map<UUID, EngineeringDecision> = new Map()
  private decisionsByCategory: Map<DecisionCategory, UUID[]> = new Map()

  // --- Создание решения ---

  createDecision(
    category: DecisionCategory,
    result: DecisionResult,
    factors: DecisionFactor[],
    alternatives: DecisionAlternative[] = [],
    normatives: NormativeReference[] = []
  ): EngineeringDecision {
    const id = this.generateId()

    const confidence = this.calculateConfidence(factors)
    const reasoning = this.generateReasoning(category, result, factors, normatives)

    const decision: EngineeringDecision = {
      id,
      category,
      timestamp: new Date(),
      result,
      factors,
      alternatives,
      normatives,
      confidence,
      reasoning,
    }

    this.decisions.set(id, decision)

    // Индексация по категории
    if (!this.decisionsByCategory.has(category)) {
      this.decisionsByCategory.set(category, [])
    }
    this.decisionsByCategory.get(category)!.push(id)

    return decision
  }

  // --- Быстрые методы для типичных решений ---

  selectCable(
    load: number,        // кВт
    length: number,      // м
    voltage: number      // В
  ): EngineeringDecision {
    const current = (load * 1000) / voltage
    let section: number
    let cableType: string

    if (current <= 16) {
      section = 1.5
      cableType = "ВВГнг-LS 3×1.5"
    } else if (current <= 25) {
      section = 2.5
      cableType = "ВВГнг-LS 3×2.5"
    } else if (current <= 32) {
      section = 4
      cableType = "ВВГнг-LS 3×4"
    } else if (current <= 46) {
      section = 6
      cableType = "ВВГнг-LS 3×6"
    } else {
      section = 10
      cableType = "ВВГнг-LS 3×10"
    }

    const voltageDrop = (2 * length * current * 0.0175) / (section * voltage) * 100

    const factors: DecisionFactor[] = [
      { name: "Нагрузка", value: `${load} кВт`, weight: 0.4, source: "calculation", description: "Расчётная мощность потребителя" },
      { name: "Ток", value: `${current.toFixed(1)} А`, weight: 0.3, source: "calculation", description: "Расчётный ток" },
      { name: "Длина линии", value: `${length} м`, weight: 0.2, source: "measurement", description: "Длина кабельной линии" },
      { name: "Падение напряжения", value: `${voltageDrop.toFixed(1)}%`, weight: 0.1, source: "calculation", description: "Расчётное падение напряжения" },
    ]

    const alternatives: DecisionAlternative[] = [
      {
        id: "smaller_section",
        description: `Уменьшить сечение до ${section === 2.5 ? 1.5 : 2.5} мм²`,
        pros: ["Экономия кабеля"],
        cons: ["Превышение допустимого тока", "Падение напряжения > 5%"],
        whyRejected: "Не соответствует допустимому току",
      },
    ]

    const normatives: NormativeReference[] = [
      {
        document: "ПУЭ",
        section: "7.1.31",
        paragraph: "Таблица 7.1.1",
        text: `Минимальное сечение ${section} мм² для тока ${current.toFixed(1)} А`,
        compliance: "compliant",
      },
      {
        document: "ПУЭ",
        section: "6.6.20",
        paragraph: "",
        text: `Падение напряжения ${voltageDrop.toFixed(1)}% (допустимо до 5%)`,
        compliance: voltageDrop <= 5 ? "compliant" : "non_compliant",
      },
    ]

    return this.createDecision(
      "cable_selection",
      {
        type: cableType,
        value: section,
        description: `Кабель ${cableType} (${section} мм²)`,
        specs: { section, current, voltageDrop },
      },
      factors,
      alternatives,
      normatives
    )
  }

  selectBreaker(
    cableSection: number,
    load: number,
    hasMotor: boolean = false
  ): EngineeringDecision {
    const maxCableCurrent: Record<number, number> = {
      1.5: 16,
      2.5: 25,
      4: 32,
      6: 46,
      10: 60,
    }

    const maxCurrent = maxCableCurrent[cableSection] ?? 25
    const loadCurrent = (load * 1000) / 220

    // Номинал автомата ≤ допустимый ток кабеля
    const availableRatings = [6, 10, 16, 20, 25, 32, 40, 50, 63]
    const breakerRating = availableRatings.find(
      r => r <= maxCurrent && r >= loadCurrent * 1.1 // +10% запас
    ) ?? maxCurrent

    const curve = hasMotor ? "D" : "C"

    const factors: DecisionFactor[] = [
      { name: "Сечение кабеля", value: `${cableSection} мм²`, weight: 0.35, source: "calculation", description: "Определяет максимальный ток" },
      { name: "Нагрузка", value: `${load} кВт`, weight: 0.35, source: "calculation", description: "Расчётная мощность" },
      { name: "Наличие двигателей", value: hasMotor ? "Да" : "Нет", weight: 0.15, source: "user_input", description: "Влияет на выбор кривой" },
      { name: "Допустимый ток кабеля", value: `${maxCurrent} А`, weight: 0.15, source: "calculation", description: "Предел для данного сечения" },
    ]

    const normatives: NormativeReference[] = [
      {
        document: "ПУЭ",
        section: "7.1.34",
        paragraph: "",
        text: `Номинал автомата ${breakerRating}А ≤ допустимый ток кабеля ${maxCurrent}А`,
        compliance: "compliant",
      },
    ]

    return this.createDecision(
      "breaker_selection",
      {
        type: `Автомат ${curve}${breakerRating}`,
        value: breakerRating,
        description: `Автомат ${curve}${breakerRating}А`,
        specs: { rating: breakerRating, curve, cableSection, load },
      },
      factors,
      [],
      normatives
    )
  }

  // --- Запросы ---

  getDecision(id: UUID): EngineeringDecision | undefined {
    return this.decisions.get(id)
  }

  getDecisionsByCategory(category: DecisionCategory): EngineeringDecision[] {
    const ids = this.decisionsByCategory.get(category) ?? []
    return ids.map(id => this.decisions.get(id)!).filter(Boolean)
  }

  getAllDecisions(): EngineeringDecision[] {
    return Array.from(this.decisions.values())
  }

  // --- Генерация отчёта ---

  generateDecisionReport(decisionId: UUID): string {
    const decision = this.decisions.get(decisionId)
    if (!decision) return "Решение не найдено"

    const lines: string[] = []

    lines.push(`## Решение: ${decision.category}`)
    lines.push(`**Результат:** ${decision.result.description}`)
    lines.push(`**Уверенность:** ${(decision.confidence * 100).toFixed(0)}%`)
    lines.push("")

    lines.push("### Факторы")
    for (const factor of decision.factors) {
      lines.push(`- **${factor.name}:** ${factor.value} (вес: ${(factor.weight * 100).toFixed(0)}%)`)
    }
    lines.push("")

    if (decision.alternatives.length > 0) {
      lines.push("### Альтернативы")
      for (const alt of decision.alternatives) {
        lines.push(`- **${alt.description}** — отклонено: ${alt.whyRejected}`)
      }
      lines.push("")
    }

    if (decision.normatives.length > 0) {
      lines.push("### Нормативы")
      for (const norm of decision.normatives) {
        const icon = norm.compliance === "compliant" ? "✅" : norm.compliance === "partial" ? "⚠️" : "❌"
        lines.push(`- ${icon} **${norm.document} ${norm.section}** — ${norm.text}`)
      }
      lines.push("")
    }

    lines.push("### Обоснование")
    for (const reason of decision.reasoning) {
      lines.push(`- ${reason}`)
    }

    return lines.join("\n")
  }

  // --- Приватные методы ---

  private calculateConfidence(factors: DecisionFactor[]): number {
    if (factors.length === 0) return 0.5

    const totalWeight = factors.reduce((sum, f) => sum + f.weight, 0)
    const calculatedFactors = factors.filter(f => f.source === "calculation")

    let confidence = 0.7
    if (calculatedFactors.length > factors.length * 0.5) confidence += 0.1
    if (totalWeight >= 0.8) confidence += 0.1

    return Math.min(1, confidence)
  }

  private generateReasoning(
    category: DecisionCategory,
    result: DecisionResult,
    factors: DecisionFactor[],
    normatives: NormativeReference[]
  ): string[] {
    const reasoning: string[] = []

    switch (category) {
      case "cable_selection":
        reasoning.push(`Выбрано сечение ${result.value} мм² на основе расчётного тока`)
        if (normatives.length > 0) {
          reasoning.push(`Соответствует ${normatives[0].document} ${normatives[0].section}`)
        }
        break
      case "breaker_selection":
        reasoning.push(`Выбран автомат ${result.type} на основе сечения кабеля и нагрузки`)
        reasoning.push(`Номинал не превышает допустимый ток кабеля`)
        break
      default:
        reasoning.push(`Решение принято на основе ${factors.length} факторов`)
    }

    return reasoning
  }

  private generateId(): UUID {
    return `decision_${Date.now()}_${Math.random().toString(36).slice(2, 9)}` as UUID
  }
}

// ============================================================
// СИНГЛТОН
// ============================================================

export const DecisionTree = new DecisionTreeImpl()
