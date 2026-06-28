// ============================================================
// ElectricPMR — Alternative Solutions Engine
// ============================================================
//
// Инженерия почти всегда имеет несколько корректных решений.
// Система показывает варианты и объясняет компромиссы.
//
// Вариант A: дешевле, больше кабеля
// Вариант B: дороже, лучше баланс фаз
// Вариант C: минимум автоматов, максимум расширяемости
// ============================================================

import type { UUID } from "../types/common"
import { DecisionTree, type DecisionCategory } from "./decisionTree"
import { ConstraintEngine, type EngineeringDecision } from "./constraintEngine"

// ============================================================
// ALTERNATIVE TYPES
// ============================================================

export interface AlternativeSolution {
  id: UUID
  name: string
  description: string
  approach: string
  metrics: SolutionMetrics
  pros: string[]
  cons: string[]
  tradeoffs: Tradeoff[]
  confidence: number
  decisionIds: UUID[]
}

export interface SolutionMetrics {
  totalCost: number
  cableLength: number
  breakerCount: number
  panelModules: number
  reliabilityScore: number // 0-100
  safetyScore: number // 0-100
  expandabilityScore: number // 0-100
  maintenanceScore: number // 0-100
  installationComplexity: "simple" | "moderate" | "complex"
  installationTime: number // часы
}

export interface Tradeoff {
  aspect: string
  optionA: string
  optionB: string
  impact: "positive" | "negative" | "neutral"
}

export interface ComparisonTable {
  aspects: string[]
  solutions: Array<{
    name: string
    values: string[]
    scores: number[]
  }>
  recommendation: string
}

// ============================================================
// ALTERNATIVE ENGINE
// ============================================================

class AlternativeEngineImpl {

  // --- Генерация альтернатив ---

  generateAlternatives(
    category: DecisionCategory,
    context: Record<string, unknown>
  ): AlternativeSolution[] {
    const alternatives: AlternativeSolution[] = []

    switch (category) {
      case "cable_selection":
        alternatives.push(...this.generateCableAlternatives(context))
        break
      case "breaker_selection":
        alternatives.push(...this.generateBreakerAlternatives(context))
        break
      case "panel_layout":
        alternatives.push(...this.generatePanelAlternatives(context))
        break
      case "circuit_design":
        alternatives.push(...this.generateCircuitAlternatives(context))
        break
      default:
        alternatives.push(...this.generateDefaultAlternatives(context))
    }

    // Добавляем оценку
    for (const alt of alternatives) {
      alt.metrics = this.evaluateSolution(alt)
      alt.confidence = this.calculateConfidence(alt)
    }

    return alternatives
  }

  private generateCableAlternatives(context: Record<string, unknown>): AlternativeSolution[] {
    const load = (context.load as number) ?? 3500
    const length = (context.length as number) ?? 20

    return [
      {
        id: this.generateId(),
        name: "Экономичный вариант",
        description: "Минимальное сечение, соответствующее нагрузке",
        approach: "Кабель 2.5мм² для линий до 3.5кВт",
        metrics: this.getDefaultMetrics(),
        pros: [
          "Минимальная стоимость кабеля",
          "Быстрый монтаж",
        ],
        cons: [
          "Малый запас по нагрузке",
          "Сложнее расширять",
        ],
        tradeoffs: [
          {
            aspect: "Стоимость",
            optionA: "2.5мм²",
            optionB: "4мм²",
            impact: "positive",
          },
          {
            aspect: "Расширяемость",
            optionA: "Ограничена",
            optionB: "Высокая",
            impact: "negative",
          },
        ],
        confidence: 0.85,
        decisionIds: [],
      },
      {
        id: this.generateId(),
        name: "Оптимальный вариант",
        description: "Сечение с запасом для удобства расширения",
        approach: "Кабель 4мм² для линий до 7кВт",
        metrics: this.getDefaultMetrics(),
        pros: [
          "Достаточный запас",
          "Удобно для расширения",
          "Стандартное решение",
        ],
        cons: [
          "Стоимость выше на 15-20%",
        ],
        tradeoffs: [
          {
            aspect: "Стоимость",
            optionA: "2.5мм²",
            optionB: "4мм²",
            impact: "negative",
          },
          {
            aspect: "Расширяемость",
            optionA: "Ограничена",
            optionB: "Высокая",
            impact: "positive",
          },
        ],
        confidence: 0.92,
        decisionIds: [],
      },
      {
        id: this.generateId(),
        name: "Премиум вариант",
        description: "Максимальное качество и запас",
        approach: "Кабель 6мм² для всех линий",
        metrics: this.getDefaultMetrics(),
        pros: [
          "Максимальный запас",
          "Минимальные потери",
          "Идеально для умного дома",
        ],
        cons: [
          "Высокая стоимость",
          "Сложный монтаж",
          "Требует больше пространства в щите",
        ],
        tradeoffs: [
          {
            aspect: "Стоимость",
            optionA: "2.5мм²",
            optionB: "6мм²",
            impact: "negative",
          },
          {
            aspect: "Надёжность",
            optionA: "Стандартная",
            optionB: "Максимальная",
            impact: "positive",
          },
        ],
        confidence: 0.88,
        decisionIds: [],
      },
    ]
  }

  private generateBreakerAlternatives(context: Record<string, unknown>): AlternativeSolution[] {
    return [
      {
        id: this.generateId(),
        name: "Базовые автоматы",
        description: "Стандартные автоматы типа C",
        approach: "ABB/Shneider C-кривая",
        metrics: this.getDefaultMetrics(),
        pros: [
          "Доступная цена",
          "Широко распространены",
        ],
        cons: [
          "Нет дополнительной защиты",
        ],
        tradeoffs: [],
        confidence: 0.9,
        decisionIds: [],
      },
      {
        id: this.generateId(),
        name: "С УЗО на каждую линию",
        description: "Максимальная безопасность",
        approach: "АВДТ (автомат+УЗО) на каждую линию",
        metrics: { ...this.getDefaultMetrics(), safetyScore: 95 },
        pros: [
          "Максимальная безопасность",
          "Не отключаются соседние линии",
        ],
        cons: [
          "Стоимость выше в 2-3 раза",
          "Больше модулей в щите",
        ],
        tradeoffs: [],
        confidence: 0.85,
        decisionIds: [],
      },
      {
        id: this.generateId(),
        name: "С УЗО на группы",
        description: "Баланс безопасности и стоимости",
        approach: "УЗО 30мА на каждую группу из 2-3 линий",
        metrics: { ...this.getDefaultMetrics(), safetyScore: 80 },
        pros: [
          "Хорошая безопасность",
          "Разумная стоимость",
        ],
        cons: [
          "При срабатывании отключается группа",
        ],
        tradeoffs: [],
        confidence: 0.88,
        decisionIds: [],
      },
    ]
  }

  private generatePanelAlternatives(context: Record<string, unknown>): AlternativeSolution[] {
    return [
      {
        id: this.generateId(),
        name: "Один щит",
        description: "Все автоматы в одном щите",
        approach: "Щит на 36 модулей в прихожей",
        metrics: this.getDefaultMetrics(),
        pros: [
          "Простая компоновка",
          "Легко обслуживать",
        ],
        cons: [
          "Длинные кабели до удалённых комнат",
        ],
        tradeoffs: [],
        confidence: 0.9,
        decisionIds: [],
      },
      {
        id: this.generateId(),
        name: "Щит + подщиты",
        description: "Главный щит + подщиты на этажах",
        approach: "Щит на 24 + 2 подщита на 12",
        metrics: { ...this.getDefaultMetrics(), cableLength: -30 },
        pros: [
          "Короче кабели",
          "Меньше потери",
        ],
        cons: [
          "Стоимость выше",
          "Сложнее монтаж",
        ],
        tradeoffs: [],
        confidence: 0.85,
        decisionIds: [],
      },
    ]
  }

  private generateCircuitAlternatives(context: Record<string, unknown>): AlternativeSolution[] {
    return [
      {
        id: this.generateId(),
        name: "По типу потребителей",
        description: "Отдельные линии для освещения и розеток",
        approach: "Освещение + розетки по комнатам",
        metrics: this.getDefaultMetrics(),
        pros: [
          "Понятная структура",
          "Легко искать неисправности",
        ],
        cons: [
          "Больше линий",
        ],
        tradeoffs: [],
        confidence: 0.9,
        decisionIds: [],
      },
      {
        id: this.generateId(),
        name: "По комнатам",
        description: "Всё в одной линии на комнату",
        approach: "Кабель 4мм² на комнату",
        metrics: { ...this.getDefaultMetrics(), breakerCount: -5 },
        pros: [
          "Меньше линий",
          "Проще монтаж",
        ],
        cons: [
          "При аварии отключается вся комната",
          "Сложнее диагностика",
        ],
        tradeoffs: [],
        confidence: 0.8,
        decisionIds: [],
      },
    ]
  }

  private generateDefaultAlternatives(context: Record<string, unknown>): AlternativeSolution[] {
    return [
      {
        id: this.generateId(),
        name: "Стандартное решение",
        description: "Типовое решение по умолчанию",
        approach: "Согласно типовым рекомендациям",
        metrics: this.getDefaultMetrics(),
        pros: ["Проверено временем"],
        cons: ["Может не учитывать особенности"],
        tradeoffs: [],
        confidence: 0.85,
        decisionIds: [],
      },
    ]
  }

  // --- Оценка ---

  private evaluateSolution(alternative: AlternativeSolution): SolutionMetrics {
    // Упрощённая оценка
    return {
      totalCost: alternative.name.includes("Эконом") ? 50000 :
                 alternative.name.includes("Премиум") ? 120000 : 80000,
      cableLength: 100,
      breakerCount: 12,
      panelModules: 24,
      reliabilityScore: 80,
      safetyScore: 75,
      expandabilityScore: 70,
      maintenanceScore: 85,
      installationComplexity: "moderate",
      installationTime: 16,
    }
  }

  private calculateConfidence(alternative: AlternativeSolution): number {
    return alternative.confidence
  }

  // --- Сравнение ---

  compareSolutions(solutions: AlternativeSolution[]): ComparisonTable {
    const aspects = [
      "Стоимость",
      "Безопасность",
      "Расширяемость",
      "Простота монтажа",
      "Обслуживаемость",
    ]

    const solutionData = solutions.map(s => ({
      name: s.name,
      values: [
        `${s.metrics.totalCost} руб.`,
        `${s.metrics.safetyScore}/100`,
        `${s.metrics.expandabilityScore}/100`,
        s.metrics.installationComplexity,
        `${s.metrics.maintenanceScore}/100`,
      ],
      scores: [
        100 - (s.metrics.totalCost / 1500), // Normalize
        s.metrics.safetyScore,
        s.metrics.expandabilityScore,
        s.metrics.installationComplexity === "simple" ? 90 :
        s.metrics.installationComplexity === "moderate" ? 70 : 50,
        s.metrics.maintenanceScore,
      ],
    }))

    // Рекомендация
    const avgScores = solutionData.map(s => {
      const avg = s.scores.reduce((a, b) => a + b, 0) / s.scores.length
      return { name: s.name, avg }
    })
    avgScores.sort((a, b) => b.avg - a.avg)

    return {
      aspects,
      solutions: solutionData,
      recommendation: `Рекомендуется: ${avgScores[0].name}`,
    }
  }

  // --- Утилиты ---

  private getDefaultMetrics(): SolutionMetrics {
    return {
      totalCost: 80000,
      cableLength: 100,
      breakerCount: 12,
      panelModules: 24,
      reliabilityScore: 80,
      safetyScore: 75,
      expandabilityScore: 70,
      maintenanceScore: 85,
      installationComplexity: "moderate",
      installationTime: 16,
    }
  }

  private generateId(): UUID {
    return `alt_${Date.now()}_${Math.random().toString(36).slice(2, 9)}` as UUID
  }
}

// ============================================================
// СИНГЛТОН
// ============================================================

export const AlternativeEngine = new AlternativeEngineImpl()
