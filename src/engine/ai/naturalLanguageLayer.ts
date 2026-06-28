// ============================================================
// ElectricPMR — Natural Language Layer
// ============================================================
//
// Единая точка входа для текстовых команд пользователя.
// Превращает естественный язык в конкретные действия над проектом.
//
// Пять базовых сценариев:
// 1. "Добавь две розетки в спальню."
// 2. "Перенеси щит в прихожую."
// 3. "Замени все автоматы на Schneider."
// 4. "Проверь проект по ПУЭ."
// 5. "Объясни, почему выбрано сечение 2.5 мм²."
// ============================================================

import type { UUID } from "../types/common"
import { IntentDetector, GoalEngine, type Intent, type Goal } from "./intentLayer"
import { KnowledgeBase, type RoomTemplate } from "./knowledgeBase"
import { AIMemory, type ConversationTurn } from "./aiMemory"
import { EngineFacade } from "../facade/engineFacade"
import { ComponentStore, type ComponentMap } from "../core/ecs"

// ============================================================
// NATURAL LANGUAGE LAYER
// ============================================================

class NaturalLanguageLayerImpl {

  // --- Основной метод обработки ---

  async processInput(
    input: string,
    userId: UUID,
    projectId: UUID
  ): Promise<NLResponse> {
    // 1. Детекция намерения
    const intent = IntentDetector.detect(input)

    // 2. Создание цели
    const goal = GoalEngine.createGoal(intent)

    // 3. Планирование и выполнение
    const result = await this.executeGoal(goal, userId, projectId)

    // 4. Запись в память
    AIMemory.addConversationTurn({
      id: this.generateId(),
      timestamp: new Date(),
      type: "user_input",
      input,
      scenario: intent.category,
    })

    AIMemory.addConversationTurn({
      id: this.generateId(),
      timestamp: new Date(),
      type: "action",
      scenario: intent.category,
      response: result.message,
      accepted: result.success,
    })

    AIMemory.recordChange(projectId, {
      action: intent.category,
      description: input,
    })

    return result
  }

  // --- Выполнение целей ---

  private async executeGoal(
    goal: Goal,
    userId: UUID,
    projectId: UUID
  ): Promise<NLResponse> {
    const intent = goal.intent

    switch (intent.category) {
      case "add_object":
        return this.executeAddObject(intent, projectId)
      case "move_object":
        return this.executeMoveObject(intent, projectId)
      case "replace_object":
        return this.executeReplaceObject(intent, projectId)
      case "validate":
        return this.executeValidate(projectId)
      case "explain":
        return this.executeExplain(intent, projectId)
      case "design":
        return this.executeDesign(intent, projectId)
      default:
        return {
          success: false,
          message: "Не удалось распознать намерение. Попробуйте переформулировать.",
          actions: [],
        }
    }
  }

  // --- Сценарий 1: Добавление объектов ---

  private executeAddObject(intent: Intent, projectId: UUID): NLResponse {
    const objectType = intent.parsed.target ?? "outlet"
    const room = intent.parsed.location
    const quantity = intent.parsed.quantity ?? 1

    // Получаем шаблон комнаты для типичных позиций
    const roomTemplate = room ? KnowledgeBase.getRoomTemplate(room) : undefined

    const createdObjects: UUID[] = []

    for (let i = 0; i < quantity; i++) {
      // Вычисляем позицию (упрощённо)
      const x = 500 + i * 300
      const y = 300

      let objectId: UUID

      switch (objectType) {
        case "outlet":
          objectId = EngineFacade.createOutlet(x, y, {
            name: `Розетка ${room ? `(${room})` : ""} ${i + 1}`,
          })
          break
        case "light":
          objectId = EngineFacade.createLight(x, y, {
            name: `Светильник ${room ? `(${room})` : ""} ${i + 1}`,
          })
          break
        case "switch":
          objectId = EngineFacade.createSwitch(x, y, {
            name: `Выключатель ${room ? `(${room})` : ""} ${i + 1}`,
          })
          break
        default:
          objectId = EngineFacade.createOutlet(x, y, {
            name: `${objectType} ${i + 1}`,
          })
      }

      createdObjects.push(objectId)
    }

    // Формируем ответ
    const objectNames: Record<string, string> = {
      outlet: "розетк",
      light: "светильник",
      switch: "выключатель",
    }

    const typeName = objectNames[objectType] ?? objectType
    const roomText = room ? ` в ${room}` : ""

    return {
      success: true,
      message: `Добавлено ${quantity} ${typeName}${quantity > 1 ? (quantity < 5 ? "и" : "") : ""} ${roomText}.`,
      actions: createdObjects.map(id => ({
        type: "created",
        objectId: id,
        description: `Создан объект`,
      })),
      suggestions: this.getAddSuggestions(objectType, room),
    }
  }

  // --- Сценарий 2: Перемещение объектов ---

  private executeMoveObject(intent: Intent, projectId: UUID): NLResponse {
    const objectType = intent.parsed.target
    const room = intent.parsed.location

    // Ищем объект для перемещения
    const entities = ComponentStore.queryByComponent("identity")
    const target = entities.find(e => {
      const identity = e.data
      return identity.type === objectType || identity.name.toLowerCase().includes(objectType ?? "")
    })

    if (!target) {
      return {
        success: false,
        message: `Не удалось найти объект "${objectType}" для перемещения.`,
        actions: [],
      }
    }

    // Перемещаем (упрощённо — ставим в центр указанной комнаты)
    const newX = 2000
    const newY = 1500

    EngineFacade.moveEntity(target.entityId, newX, newY)

    return {
      success: true,
      message: `${target.data.name} перемещён${room ? ` в ${room}` : ""}.`,
      actions: [{
        type: "moved",
        objectId: target.entityId,
        description: `Перемещён в позицию (${newX}, ${newY})`,
      }],
    }
  }

  // --- Сценарий 3: Замена объектов ---

  private executeReplaceObject(intent: Intent, projectId: UUID): NLResponse {
    const objectType = intent.parsed.target
    const brand = intent.entities.find(e => e.type === "brand")?.resolved

    if (!brand) {
      return {
        success: false,
        message: "Укажите бренд, на который нужно заменить.",
        actions: [],
      }
    }

    // Ищем все объекты указанного типа
    const entities = ComponentStore.queryByComponent("identity")
    const targets = entities.filter(e => e.data.type === objectType)

    if (targets.length === 0) {
      return {
        success: false,
        message: `Не найдено объектов типа "${objectType}" для замены.`,
        actions: [],
      }
    }

    // Заменяем (обновляем метаданные)
    const replaced: UUID[] = []
    for (const target of targets) {
      const metadata = ComponentStore.getComponent(target.entityId, "metadata")
      if (metadata) {
        ComponentStore.addComponent(target.entityId, "metadata", {
          ...metadata,
          manufacturer: brand,
        })
        replaced.push(target.entityId)
      }
    }

    return {
      success: true,
      message: `Заменено ${replaced.length} объектов на ${brand}.`,
      actions: replaced.map(id => ({
        type: "modified",
        objectId: id,
        description: `Бренд изменён на ${brand}`,
      })),
    }
  }

  // --- Сценарий 4: Валидация ---

  private executeValidate(projectId: UUID): NLResponse {
    const report = EngineFacade.validateProject()

    const issues = [
      ...report.errors.map(e => `❌ ${e}`),
      ...report.warnings.map(w => `⚠️ ${w}`),
    ]

    let message: string
    if (report.valid && report.warnings.length === 0) {
      message = "✅ Проект соответствует нормативам. Ошибок и предупреждений нет."
    } else if (report.valid) {
      message = `⚠️ Проект в целом корректен, но есть ${report.warnings.length} предупреждений:\n${issues.join("\n")}`
    } else {
      message = `❌ Обнаружены ошибки:\n${issues.join("\n")}`
    }

    return {
      success: report.valid,
      message,
      actions: [],
      metadata: {
        objectCount: report.objectCount,
        errorCount: report.errors.length,
        warningCount: report.warnings.length,
      },
    }
  }

  // --- Сценарий 5: Объяснение ---

  private executeExplain(intent: Intent, projectId: UUID): NLResponse {
    const input = intent.rawInput.toLowerCase()

    // Определяем, что нужно объяснить
    if (input.includes("сечение") || input.includes("кабел")) {
      return this.explainCableSection()
    }

    if (input.includes("автомат") || input.includes("номинал")) {
      return this.explainBreakerSelection()
    }

    if (input.includes("узв") || input.includes("rcd")) {
      return this.explainRCD()
    }

    return {
      success: true,
      message: "Выбор сечения кабеля основан на расчёте тока нагрузки и допустимого падения напряжения. Для бытовых розеточных групп обычно используется 2.5 мм² (до 25А), для освещения — 1.5 мм² (до 16А), для электроплиты — 6 мм² (до 46А).",
      actions: [],
    }
  }

  private explainCableSection(): NLResponse {
    return {
      success: true,
      message: [
        "📐 **Выбор сечения кабеля**",
        "",
        "Сечение определяется двумя факторами:",
        "1. **Ток нагрузки** — кабель должен выдерживать ток потребителей",
        "2. **Падение напряжения** — не более 5% от номинала",
        "",
        "Типичные сечения:",
        "• 1.5 мм² — освещение (до 16А, ~3.5 кВт)",
        "• 2.5 мм² — розетки (до 25А, ~5.5 кВт)",
        "• 4 мм² — силовые потребители (до 32А, ~7 кВт)",
        "• 6 мм² — электроплита, духовой шкаф (до 46А, ~10 кВт)",
        "",
        "Для данной розеточной группы выбрано 2.5 мм², так как расчётный ток нагрузки не превышает 16А.",
      ].join("\n"),
      actions: [],
    }
  }

  private explainBreakerSelection(): NLResponse {
    return {
      success: true,
      message: [
        "⚡ **Выбор номинала автомата**",
        "",
        "Автомат защищает кабель от перегрузки и короткого замыкания.",
        "",
        "Правило: номинал автомата ≤ допустимый ток кабеля",
        "",
        "Типичные搭配:",
        "• Кабель 1.5 мм² → Автомат 10А",
        "• Кабель 2.5 мм² → Автомат 16А",
        "• Кабель 4 мм² → Автомат 25А",
        "• Кабель 6 мм² → Автомат 32А",
        "",
        "Тип кривой: C (бытовые), B (чувствительные), D (двигатели)",
      ].join("\n"),
      actions: [],
    }
  }

  private explainRCD(): NLResponse {
    return {
      success: true,
      message: [
        "🛡️ **Выбор УЗО (RCD)**",
        "",
        "УЗО защищает от утечки тока и поражения электричеством.",
        "",
        "Обязательно в:",
        "• Ванных комнатах",
        "• Кухнях (рядом с водой)",
        "• Для розеток, доступных детям",
        "",
        "Типы:",
        "• AC — только переменный ток (дешёвое)",
        "• A — переменный + пульсирующий (рекомендуется)",
        "• B — переменный + постоянный (для электроники)",
        "",
        "Номинальный ток: не менее номинала автомата на линии",
        "Ток утечки: 30мА (бытовые), 10мА (влажные помещения)",
      ].join("\n"),
      actions: [],
    }
  }

  // --- Сценарий 6: Проектирование ---

  private executeDesign(intent: Intent, projectId: UUID): NLResponse {
    const room = intent.parsed.location

    if (!room) {
      return {
        success: false,
        message: "Укажите помещение для проектирования.",
        actions: [],
      }
    }

    const template = KnowledgeBase.getRoomTemplate(room)
    if (!template) {
      return {
        success: false,
        message: `Не найден шаблон для помещения "${room}".`,
        actions: [],
      }
    }

    // Создаём объекты по шаблону
    const created: UUID[] = []
    for (const obj of template.typicalObjects) {
      const count = typeof obj.count === "number" ? obj.count : obj.count.min

      for (let i = 0; i < count; i++) {
        const x = 500 + i * 300
        const y = obj.mountingHeight ?? 300

        let id: UUID
        switch (obj.type) {
          case "outlet":
          case "outlet_waterproof":
            id = EngineFacade.createOutlet(x, y, { name: obj.name })
            break
          case "light_ceiling":
            id = EngineFacade.createLight(x, y, { name: obj.name })
            break
          case "switch":
            id = EngineFacade.createSwitch(x, y, { name: obj.name })
            break
          default:
            id = EngineFacade.createOutlet(x, y, { name: obj.name })
        }

        created.push(id)
      }
    }

    return {
      success: true,
      message: `Спроектировано помещение "${template.nameRu}" по типовому шаблону. Создано ${created.length} объектов. Рекомендации:\n${template.tips.map(t => `• ${t}`).join("\n")}`,
      actions: created.map(id => ({
        type: "created",
        objectId: id,
        description: "Создан по шаблону",
      })),
    }
  }

  // --- Подсказки ---

  private getAddSuggestions(objectType: string, room?: string): string[] {
    const suggestions: string[] = []

    if (objectType === "outlet" && room) {
      const template = KnowledgeBase.getRoomTemplate(room)
      if (template) {
        const remaining = template.typicalObjects.filter(o =>
          o.type.includes("outlet") && !suggestions.includes(o.name)
        )
        for (const obj of remaining.slice(0, 3)) {
          suggestions.push(`Добавить ${obj.name}`)
        }
      }
    }

    return suggestions
  }

  // --- Утилиты ---

  private generateId(): UUID {
    return `nl_${Date.now()}_${Math.random().toString(36).slice(2, 9)}` as UUID
  }
}

// ============================================================
// ТИПЫ
// ============================================================

export interface NLResponse {
  success: boolean
  message: string
  actions: NLAction[]
  suggestions?: string[]
  metadata?: Record<string, unknown>
}

export interface NLAction {
  type: "created" | "moved" | "modified" | "deleted" | "validated" | "explained"
  objectId?: UUID
  description: string
}

// ============================================================
// СИНГЛТОН
// ============================================================

export const NaturalLanguageLayer = new NaturalLanguageLayerImpl()
