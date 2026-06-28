// ============================================================
// ElectricPMR — Rule Engine (нормативы: ПУЭ, СП, ГОСТ)
// ============================================================
//
// Философия:
//   Нормативы — не код. Они меняются. Добавляются.
//   Различаются по регионам. Поэтому — плагины.
// ============================================================

import type { ValidationResult, ValidationIssue, UUID } from "../types/common"

// ============================================================
// МОДЕЛИ
// ============================================================

export interface RuleCondition {
  objectType: string
  field: string
  operator: "eq" | "gt" | "lt" | "gte" | "lte" | "in" | "between"
  value: unknown
  severity: "error" | "warning" | "info"
  message: string
}

export interface Rule {
  id: string
  sourceId: string
  section: string
  title: string
  text: string
  category: RuleCategory
  conditions: RuleCondition[]
  severity: "error" | "warning" | "info"
}

export type RuleCategory =
  | "installation"
  | "protection"
  | "cable"
  | "panel"
  | "grounding"
  | "fire_safety"
  | "accessibility"

export interface NormativeSource {
  id: string
  name: string
  country: string
  language: string
  version: string
  effectiveDate: Date
  rules: Rule[]
  isActive: boolean
}

// ============================================================
// ПУЭ 7-е издание — базовые правила
// ============================================================

const PUE_RULES: Rule[] = [
  {
    id: "PUE_7_1_36",
    sourceId: "pue_7",
    section: "7.1.36",
    title: "Высота установки розеток в жилых помещениях",
    text: "В жилых и общественных помещениях розетки рекомендуется устанавливать на высоте 300 мм от пола, а выключатели — 800-900 мм.",
    category: "installation",
    conditions: [
      {
        objectType: "outlet",
        field: "mountingHeight",
        operator: "lt",
        value: 300,
        severity: "warning",
        message: "Высота розетки {value}мм. Рекомендуется ≥300мм (ПУЭ 7.1.36)",
      },
    ],
    severity: "warning",
  },
  {
    id: "PUE_7_1_47",
    sourceId: "pue_7",
    section: "7.1.47",
    title: "Розетки в ванных комнатах",
    text: "В ванных комнатах допускается установка не более одной розетки с током 16А, подключённой через УЗО 30мА.",
    category: "installation",
    conditions: [
      {
        objectType: "outlet",
        field: "roomType",
        operator: "eq",
        value: "bathroom",
        severity: "warning",
        message: "В ванной допускается не более 1 розетки 16А через УЗО 30мА (ПУЭ 7.1.47)",
      },
    ],
    severity: "warning",
  },
  {
    id: "PUE_7_1_38",
    sourceId: "pue_7",
    section: "7.1.38",
    title: "Выключатели в ванных комнатах",
    text: "Выключатели в ванных комнатах рекомендуется устанавливать за пределами помещения.",
    category: "installation",
    conditions: [
      {
        objectType: "switch",
        field: "roomType",
        operator: "eq",
        value: "bathroom",
        severity: "warning",
        message: "Выключатель в ванной — рекомендуется установить за пределами помещения (ПУЭ 7.1.38)",
      },
    ],
    severity: "info",
  },
  {
    id: "PUE_7_1_31",
    sourceId: "pue_7",
    section: "7.1.31",
    title: "Сечения проводников",
    text: "Минимальные сечения проводников должны быть не менее: для освещения — 1.5мм², для розеток — 2.5мм², для силовых потребителей — по расчёту.",
    category: "cable",
    conditions: [
      {
        objectType: "cable",
        field: "crossSection",
        operator: "lt",
        value: 1.5,
        severity: "error",
        message: "Сечение кабеля {value}мм² меньше минимального 1.5мм² (ПУЭ 7.1.31)",
      },
    ],
    severity: "error",
  },
  {
    id: "PUE_7_1_34",
    sourceId: "pue_7",
    section: "7.1.34",
    title: "Селективность автоматов",
    text: "Автоматические выключатели должны обеспечивать селективность: верхний автомат должен отключаться позже нижнего.",
    category: "protection",
    conditions: [
      {
        objectType: "circuit",
        field: "mainBreakerRating",
        operator: "lt",
        value: 0,
        severity: "warning",
        message: "Проверьте селективность: вводной автомат должен быть ≥ суммы групповых (ПУЭ 7.1.34)",
      },
    ],
    severity: "error",
  },
  {
    id: "PUE_7_1_71",
    sourceId: "pue_7",
    section: "7.1.71",
    title: "Защита от поражения током",
    text: "Для защиты людей от поражения электрическим током должны применяться УЗО с током отключения 30мА для групп розеток.",
    category: "protection",
    conditions: [
      {
        objectType: "circuit",
        field: "type",
        operator: "eq",
        value: "outlets_general",
        severity: "warning",
        message: "Для группы розеток рекомендуется УЗО 30мА (ПУЭ 7.1.71)",
      },
    ],
    severity: "warning",
  },
  {
    id: "PUE_7_1_76",
    sourceId: "pue_7",
    section: "7.1.76",
    title: "Заземление",
    text: "Все электрические установки должны иметь защитное заземление. PEN-проводник не должен быть разъединяемым.",
    category: "grounding",
    conditions: [
      {
        objectType: "outlet",
        field: "hasGrounding",
        operator: "eq",
        value: false,
        severity: "warning",
        message: "Розетка без заземления. Все установки должны иметь защитное заземление (ПУЭ 7.1.76)",
      },
    ],
    severity: "error",
  },
  {
    id: "PUE_6_6_20",
    sourceId: "pue_7",
    section: "6.6.20",
    title: "Падение напряжения",
    text: "Падение напряжения от трансформатора до наиболее удалённой точки сети не должно превышать 5% от номинального напряжения.",
    category: "cable",
    conditions: [
      {
        objectType: "cable",
        field: "voltageDropPercentage",
        operator: "gt",
        value: 5,
        severity: "error",
        message: "Падение напряжения {value}% превышает допустимое 5% (ПУЭ 6.6.20)",
      },
    ],
    severity: "error",
  },
]

// ============================================================
// СП 256.1325800.2016 — базовые правила
// ============================================================

const SP_RULES: Rule[] = [
  {
    id: "SP_15_2",
    sourceId: "sp_256",
    section: "15.2",
    title: "Кабели в конструкциях",
    text: "Прокладка кабелей в пустотах строительных конструкций допускается при условии их негорючести.",
    category: "fire_safety",
    conditions: [
      {
        objectType: "cable",
        field: "fireRating",
        operator: "eq",
        value: "普通",
        severity: "warning",
        message: "Кабель в строительных конструкциях должен быть негорючим. Рекомендуется марка нг-LS (СП 15.2)",
      },
    ],
    severity: "warning",
  },
  {
    id: "SP_15_3",
    sourceId: "sp_256",
    section: "15.3",
    title: "Групповые линии",
    text: "Для групповых линий рекомендуется применять кабели с медными жилами марки ВВГнг-LS.",
    category: "cable",
    conditions: [
      {
        objectType: "cable",
        field: "fireRating",
        operator: "eq",
        value: "ng",
        severity: "info",
        message: "Рекомендуется кабель ВВГнг-LS для соблюдения СП 15.3",
      },
    ],
    severity: "info",
  },
  {
    id: "SP_15_5",
    sourceId: "sp_256",
    section: "15.5",
    title: "Сечение проводников",
    text: "Минимальное сечение медного проводника для групповых линий — 1.5мм² для освещения, 2.5мм² для розеток.",
    category: "cable",
    conditions: [
      {
        objectType: "cable",
        field: "crossSection",
        operator: "lt",
        value: 1.5,
        severity: "error",
        message: "Сечение кабеля {value}мм² меньше минимального 1.5мм² (СП 15.5)",
      },
    ],
    severity: "error",
  },
  {
    id: "SP_16_1",
    sourceId: "sp_256",
    section: "16.1",
    title: "Установка щитов",
    text: "Щиты должны устанавливаться в сухих, проветриваемых помещениях на высоте 1.4-1.7м от пола.",
    category: "panel",
    conditions: [
      {
        objectType: "panel",
        field: "mountingHeight",
        operator: "lt",
        value: 1400,
        severity: "warning",
        message: "Высота установки щита {value}мм. Рекомендуется 1400-1700мм (СП 16.1)",
      },
      {
        objectType: "panel",
        field: "mountingHeight",
        operator: "gt",
        value: 1700,
        severity: "warning",
        message: "Высота установки щита {value}мм. Рекомендуется 1400-1700мм (СП 16.1)",
      },
    ],
    severity: "warning",
  },
]

// ============================================================
// RULE ENGINE
// ============================================================

class RuleEngineImpl {
  private sources: NormativeSource[] = [
    {
      id: "pue_7",
      name: "ПУЭ 7-е издание",
      country: "RU",
      language: "ru",
      version: "7",
      effectiveDate: new Date("2003-01-01"),
      rules: PUE_RULES,
      isActive: true,
    },
    {
      id: "sp_256",
      name: "СП 256.1325800.2016",
      country: "RU",
      language: "ru",
      version: "2016",
      effectiveDate: new Date("2016-06-15"),
      rules: SP_RULES,
      isActive: true,
    },
  ]

  // --- Управление источниками ---

  registerSource(source: NormativeSource): void {
    const existing = this.sources.findIndex(s => s.id === source.id)
    if (existing >= 0) {
      this.sources[existing] = source
    } else {
      this.sources.push(source)
    }
  }

  getActiveSources(): NormativeSource[] {
    return this.sources.filter(s => s.isActive)
  }

  setActiveSource(id: string, active: boolean): void {
    const source = this.sources.find(s => s.id === id)
    if (source) source.isActive = active
  }

  // --- Получение правил ---

  getRules(sourceId?: string): Rule[] {
    if (sourceId) {
      const source = this.sources.find(s => s.id === sourceId)
      return source?.rules ?? []
    }
    return this.sources
      .filter(s => s.isActive)
      .flatMap(s => s.rules)
  }

  getRulesByCategory(category: RuleCategory): Rule[] {
    return this.getRules().filter(r => r.category === category)
  }

  getRulesForObject(objectType: string): Rule[] {
    return this.getRules().filter(r =>
      r.conditions.some(c => c.objectType === objectType)
    )
  }

  // --- Проверка ---

  validateObject(
    objectType: string,
    data: Record<string, unknown>
  ): ValidationIssue[] {
    const issues: ValidationIssue[] = []
    const applicableRules = this.getRulesForObject(objectType)

    for (const rule of applicableRules) {
      for (const condition of rule.conditions) {
        if (condition.objectType !== objectType) continue

        const value = data[condition.field]
        if (value === undefined) continue

        const passed = this.evaluateCondition(value, condition.operator, condition.value)

        if (!passed) {
          const message = condition.message.replace(
            /\{value\}/g,
            String(value)
          )
          issues.push({
            id: `${rule.id}_${condition.field}`,
            ruleId: rule.id,
            source: rule.sourceId,
            severity: condition.severity,
            message,
            path: condition.field,
          })
        }
      }
    }

    return issues
  }

  // --- Объяснение правила ---

  explainRule(ruleId: string): { rule: Rule; source: NormativeSource } | null {
    for (const source of this.sources) {
      const rule = source.rules.find(r => r.id === ruleId)
      if (rule) return { rule, source }
    }
    return null
  }

  // --- Приватные ---

  private evaluateCondition(
    actual: unknown,
    operator: string,
    expected: unknown
  ): boolean {
    const a = Number(actual)
    const e = Number(expected)

    switch (operator) {
      case "eq": return a === e
      case "gt": return a > e
      case "lt": return a < e
      case "gte": return a >= e
      case "lte": return a <= e
      case "in": return Array.isArray(expected) && expected.includes(actual)
    case "between": {
      if (Array.isArray(expected) && expected.length === 2) {
        return a >= Number(expected[0]) && a <= Number(expected[1])
      }
      return false
    }
      default: return true
    }
  }
}

export const RuleEngine = new RuleEngineImpl()
