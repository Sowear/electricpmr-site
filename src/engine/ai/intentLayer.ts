// ============================================================
// ElectricPMR — Intent Layer
// ============================================================
//
// Пользователь почти никогда не формулирует задачу точно.
// "Сделай нормальную электрику в этой квартире" — это не команда.
// Это намерение (Intent).
//
// Intent Layer превращает неформальный запрос в структурированную цель.
// ============================================================

import type { UUID } from "../types/common"

// ============================================================
// INTENT TYPES
// ============================================================

export type IntentCategory =
  | "add_object"       // Добавить объект
  | "move_object"      // Переместить объект
  | "delete_object"    // Удалить объект
  | "modify_property"  // Изменить свойство
  | "replace_object"   // Заменить объект
  | "validate"         // Проверить проект
  | "explain"          // Объяснить решение
  | "design"           // Спроектировать (комнату, проект)
  | "optimize"         // Оптимизировать
  | "export"           // Экспортировать документ
  | "query"            // Запросить информацию
  | "help"             // Помощь

export type IntentConfidence = "high" | "medium" | "low"

export interface Intent {
  id: UUID
  category: IntentCategory
  rawInput: string
  parsed: ParsedIntent
  confidence: IntentConfidence
  entities: IntentEntity[]
  constraints: IntentConstraint[]
  createdAt: Date
}

export interface ParsedIntent {
  action: string
  target?: string
  location?: string
  quantity?: number
  specifics?: Record<string, unknown>
}

export interface IntentEntity {
  type: EntityType
  value: string
  resolved?: string // UUID объекта в проекте
  confidence: number
}

export type EntityType =
  | "room"
  | "object_type"
  | "object_name"
  | "brand"
  | "material"
  | "location"
  | "number"
  | "measurement"
  | "constraint"

export interface IntentConstraint {
  type: ConstraintType
  value: unknown
  priority: "must" | "should" | "nice_to_have"
}

export type ConstraintType =
  | "budget"
  | "brand"
  | "installation_method" // открытая/скрытая проводка
  | "no_drilling"         // без штробления
  | "repairability"       // ремонтопригодность
  | "safety_level"
  | "timeline"

// ============================================================
// INTENT DETECTOR
// ============================================================

class IntentDetectorImpl {

  // --- Основной метод ---

  detect(input: string): Intent {
    const normalized = this.normalize(input)
    const category = this.classifyCategory(normalized)
    const entities = this.extractEntities(normalized)
    const constraints = this.extractConstraints(normalized)
    const parsed = this.parseIntent(normalized, category, entities)
    const confidence = this.calculateConfidence(parsed, entities)

    return {
      id: this.generateId(),
      category,
      rawInput: input,
      parsed,
      confidence,
      entities,
      constraints,
      createdAt: new Date(),
    }
  }

  // --- Классификация ---

  private classifyCategory(input: string): IntentCategory {
    const patterns: Array<{ pattern: RegExp; category: IntentCategory }> = [
      // Добавление
      { pattern: /(добавь|поставь|установи|создай|нужн[аоы]\s+розетк|нужн[аоы]\s+светильник)/i, category: "add_object" },
      { pattern: /(розетк|светильник|выключатель|автомат|щит|датчик)/i, category: "add_object" },

      // Перемещение
      { pattern: /(перенес|передвинь|перемести|сдвинь)/i, category: "move_object" },

      // Удаление
      { pattern: /(удали|убери|выреж)/i, category: "delete_object" },

      // Замена
      { pattern: /(замени|поменяй|вместо)/i, category: "replace_object" },

      // Модификация
      { pattern: /(измени|переключи|поставь|выставь)/i, category: "modify_property" },

      // Валидация
      { pattern: /(проверь|проверка|ошибк|нарушени)/i, category: "validate" },

      // Объяснение
      { pattern: /(объясни|почему|зачем|как\s+выбран|обосновани)/i, category: "explain" },

      // Проектирование
      { pattern: /(спроектируй|сделай\s+электрик|расчитай|расположи)/i, category: "design" },

      // Оптимизация
      { pattern: /(оптимизируй|сократи|удешеви|улучши)/i, category: "optimize" },

      // Экспорт
      { pattern: /(экспортируй|сохрани|выгрузи|спецификац|схему)/i, category: "export" },

      // Запрос информации
      { pattern: /(сколько|какой|какая|какое|покажи|выведи)/i, category: "query" },

      // Помощь
      { pattern: /(помощь|помоги|как\s+работ|что\s+умеешь)/i, category: "help" },
    ]

    for (const { pattern, category } of patterns) {
      if (pattern.test(input)) {
        return category
      }
    }

    return "query"
  }

  // --- Извлечение сущностей ---

  private extractEntities(input: string): IntentEntity[] {
    const entities: IntentEntity[] = []

    // Комнаты
    const rooms = [
      { pattern: /кухн[аеуы]?/i, value: "kitchen" },
      { pattern: /спальн[яеию]/i, value: "bedroom" },
      { pattern: /гостиная|зал/i, value: "living" },
      { pattern: /ванная|ванн[аеуы]?/i, value: "bathroom" },
      { pattern: /прихожая|коридор/i, value: "hall" },
      { pattern: /детская/i, value: "kids_room" },
      { pattern: /гараж/i, value: "garage" },
      { pattern: /офис/i, value: "office" },
    ]

    for (const { pattern, value } of rooms) {
      const match = input.match(pattern)
      if (match) {
        entities.push({
          type: "room",
          value: match[0],
          resolved: value,
          confidence: 0.9,
        })
      }
    }

    // Типы объектов
    const objectTypes = [
      { pattern: /розетк[аиеуы]/i, value: "outlet" },
      { pattern: /светильник|свет|лампа|лампочк/i, value: "light" },
      { pattern: /выключатель/i, value: "switch" },
      { pattern: /автомат|автоматический\s+выключатель/i, value: "breaker" },
      { pattern: /щит|щиток|электрощит/i, value: "panel" },
      { pattern: /датчик/i, value: "sensor" },
      { pattern: /кабел[яь]/i, value: "cable" },
      { pattern: /проводк[аиеуы]/i, value: "wiring" },
    ]

    for (const { pattern, value } of objectTypes) {
      const match = input.match(pattern)
      if (match) {
        entities.push({
          type: "object_type",
          value: match[0],
          resolved: value,
          confidence: 0.9,
        })
      }
    }

    // Бренды
    const brands = [
      { pattern: /abb/i, value: "ABB" },
      { pattern: /schneider/i, value: "Schneider" },
      { pattern: /iek/i, value: "IEK" },
      { pattern: /харчер|hager/i, value: "Hager" },
      { pattern: /legrand/i, value: "Legrand" },
      { pattern: /уэлс|wels/i, value: "Wels" },
    ]

    for (const { pattern, value } of brands) {
      const match = input.match(pattern)
      if (match) {
        entities.push({
          type: "brand",
          value: match[0],
          resolved: value,
          confidence: 0.95,
        })
      }
    }

    // Числа
    const numberMatch = input.match(/(\d+)\s*(штук|розеток|светильников|автоматов)?/i)
    if (numberMatch) {
      entities.push({
        type: "number",
        value: numberMatch[1],
        resolved: numberMatch[1],
        confidence: 0.95,
      })
    }

    // Размеры сечений
    const sectionMatch = input.match(/(\d+(?:\.\d+)?)\s*(?:мм²|кв\.?\s*мм)/i)
    if (sectionMatch) {
      entities.push({
        type: "measurement",
        value: sectionMatch[0],
        resolved: sectionMatch[1],
        confidence: 0.9,
      })
    }

    return entities
  }

  // --- Извлечение ограничений ---

  private extractConstraints(input: string): IntentConstraint[] {
    const constraints: IntentConstraint[] = []

    // Бюджет
    const budgetMatch = input.match(/(бюджет|дёшево|дёшево|недорого|дорого|максимум|минимум)\s*(\d+)?/i)
    if (budgetMatch) {
      constraints.push({
        type: "budget",
        value: budgetMatch[2] ? parseInt(budgetMatch[2]) : budgetMatch[1],
        priority: "must",
      })
    }

    // Без штробления
    if (/без\s+штроблен|без\s+штроб|открытая\s+проводк/i.test(input)) {
      constraints.push({
        type: "installation_method",
        value: "open",
        priority: "must",
      })
    }

    // Ремонтопригодность
    if (/ремонтопригодност|легко\s+ремонт/i.test(input)) {
      constraints.push({
        type: "repairability",
        value: "high",
        priority: "should",
      })
    }

    // Безопасность
    if (/максимал|безопасн|для\s+детей/i.test(input)) {
      constraints.push({
        type: "safety_level",
        value: "maximum",
        priority: "must",
      })
    }

    return constraints
  }

  // --- Парсинг намерения ---

  private parseIntent(
    input: string,
    category: IntentCategory,
    entities: IntentEntity[]
  ): ParsedIntent {
    const objectType = entities.find(e => e.type === "object_type")?.resolved
    const room = entities.find(e => e.type === "room")?.resolved
    const number = entities.find(e => e.type === "number")?.resolved
    const brand = entities.find(e => e.type === "brand")?.resolved

    return {
      action: category,
      target: objectType,
      location: room,
      quantity: number ? parseInt(number) : undefined,
      specifics: brand ? { brand } : undefined,
    }
  }

  // --- Расчёт уверенности ---

  private calculateConfidence(
    parsed: ParsedIntent,
    entities: IntentEntity[]
  ): IntentConfidence {
    let score = 0.5

    if (parsed.target) score += 0.2
    if (parsed.location) score += 0.15
    if (parsed.quantity) score += 0.1

    if (entities.length === 0) score -= 0.2
    if (entities.every(e => e.confidence > 0.8)) score += 0.1

    if (score >= 0.8) return "high"
    if (score >= 0.6) return "medium"
    return "low"
  }

  // --- Утилиты ---

  private normalize(input: string): string {
    return input
      .toLowerCase()
      .replace(/[^\w\sа-яёА-ЯЁ]/g, " ")
      .replace(/\s+/g, " ")
      .trim()
  }

  private generateId(): UUID {
    return `intent_${Date.now()}_${Math.random().toString(36).slice(2, 9)}` as UUID
  }
}

// ============================================================
// GOAL ENGINE
// ============================================================

export interface Goal {
  id: UUID
  intent: Intent
  description: string
  successCriteria: SuccessCriterion[]
  constraints: IntentConstraint[]
  priority: "high" | "medium" | "low"
  status: GoalStatus
  createdAt: Date
}

export type GoalStatus = "pending" | "in_progress" | "completed" | "failed"

export interface SuccessCriterion {
  description: string
  check: () => boolean
}

class GoalEngineImpl {

  createGoal(intent: Intent): Goal {
    const goals = this.generateGoals(intent)

    // Возвращаем приоритетную цель
    return goals[0] ?? {
      id: this.generateId(),
      intent,
      description: intent.rawInput,
      successCriteria: [],
      constraints: intent.constraints,
      priority: "medium",
      status: "pending",
      createdAt: new Date(),
    }
  }

  private generateGoals(intent: Intent): Goal[] {
    const goals: Goal[] = []

    switch (intent.category) {
      case "add_object":
        goals.push(this.createAddObjectGoal(intent))
        break
      case "move_object":
        goals.push(this.createMoveObjectGoal(intent))
        break
      case "replace_object":
        goals.push(this.createReplaceObjectGoal(intent))
        break
      case "validate":
        goals.push(this.createValidateGoal(intent))
        break
      case "explain":
        goals.push(this.createExplainGoal(intent))
        break
      case "design":
        goals.push(this.createDesignGoal(intent))
        break
    }

    return goals
  }

  private createAddObjectGoal(intent: Intent): Goal {
    const objectType = intent.parsed.target ?? "outlet"
    const room = intent.parsed.location
    const quantity = intent.parsed.quantity ?? 1

    return {
      id: this.generateId(),
      intent,
      description: `Добавить ${quantity} ${objectType} ${room ? `в ${room}` : ""}`,
      successCriteria: [
        {
          description: `Создано ${quantity} объектов типа ${objectType}`,
          check: () => true, // Будет проверяться после выполнения
        },
      ],
      constraints: intent.constraints,
      priority: "high",
      status: "pending",
      createdAt: new Date(),
    }
  }

  private createMoveObjectGoal(intent: Intent): Goal {
    return {
      id: this.generateId(),
      intent,
      description: `Переместить ${intent.parsed.target ?? "объект"} в ${intent.parsed.location ?? "указанную позицию"}`,
      successCriteria: [],
      constraints: intent.constraints,
      priority: "high",
      status: "pending",
      createdAt: new Date(),
    }
  }

  private createReplaceObjectGoal(intent: Intent): Goal {
    const brand = intent.entities.find(e => e.type === "brand")?.resolved
    return {
      id: this.generateId(),
      intent,
      description: `Заменить ${intent.parsed.target ?? "объект"} ${brand ? `на ${brand}` : ""}`,
      successCriteria: [],
      constraints: intent.constraints,
      priority: "high",
      status: "pending",
      createdAt: new Date(),
    }
  }

  private createValidateGoal(intent: Intent): Goal {
    return {
      id: this.generateId(),
      intent,
      description: "Проверить проект по нормативам",
      successCriteria: [
        {
          description: "Получен отчёт о валидации",
          check: () => true,
        },
      ],
      constraints: [],
      priority: "medium",
      status: "pending",
      createdAt: new Date(),
    }
  }

  private createExplainGoal(intent: Intent): Goal {
    return {
      id: this.generateId(),
      intent,
      description: `Объяснить: ${intent.rawInput}`,
      successCriteria: [
        {
          description: "Получено объяснение с обоснованием",
          check: () => true,
        },
      ],
      constraints: [],
      priority: "low",
      status: "pending",
      createdAt: new Date(),
    }
  }

  private createDesignGoal(intent: Intent): Goal {
    return {
      id: this.generateId(),
      intent,
      description: `Спроектировать: ${intent.rawInput}`,
      successCriteria: [],
      constraints: intent.constraints,
      priority: "high",
      status: "pending",
      createdAt: new Date(),
    }
  }

  private generateId(): UUID {
    return `goal_${Date.now()}_${Math.random().toString(36).slice(2, 9)}` as UUID
  }
}

// ============================================================
// СИНГЛТОНЫ
// ============================================================

export const IntentDetector = new IntentDetectorImpl()
export const GoalEngine = new GoalEngineImpl()
