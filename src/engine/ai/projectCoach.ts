// ============================================================
// ElectricPMR — Project Coach
// ============================================================
//
// Не чат.
// Постоянный инженерный помощник, который:
// - подсказывает следующий шаг;
// - рекомендует улучшения;
// - объясняет компромиссы;
// - следит за прогрессом.
// ============================================================

import type { UUID } from "../types/common"
import { WorkflowEngine, type WorkflowStage, type StageId } from "./workflowEngine"
import { CompletenessEngine, type CompletenessReport } from "./completenessEngine"
import { ProjectHealth, type ProjectHealthReport } from "./projectHealth"
import { VariantEngine } from "./variantEngine"
import { KnowledgeBase } from "./knowledgeBase"

// ============================================================
// COACH TYPES
// ============================================================

export type MessageType = "next_step" | "recommendation" | "warning" | "info" | "celebration"

export interface CoachMessage {
  id: UUID
  type: MessageType
  title: string
  message: string
  action?: CoachAction
  priority: "high" | "medium" | "low"
  timestamp: Date
}

export interface CoachAction {
  label: string
  type: "start_stage" | "add_object" | "run_validation" | "view_variant" | "export"
  params?: Record<string, unknown>
}

export interface CoachContext {
  projectId: UUID
  workflow: ReturnType<typeof WorkflowEngine.getWorkflow>
  completeness: CompletenessReport
  health: ProjectHealthReport
  lastAction?: string
}

// ============================================================
// PROJECT COACH
// ============================================================

class ProjectCoachImpl {
  private messages: Map<UUID, CoachMessage[]> = new Map()
  private listeners: Array<(message: CoachMessage) => void> = []

  // --- Генерация рекомендаций ---

  getRecommendations(projectId: UUID): CoachMessage[] {
    const messages: CoachMessage[] = []

    // 1. Следующий шаг workflow
    const nextStep = this.getNextStepMessage(projectId)
    if (nextStep) messages.push(nextStep)

    // 2. Незавершённые элементы
    const completenessMsgs = this.getCompletenessMessages(projectId)
    messages.push(...completenessMsgs)

    // 3. Улучшения здоровья
    const healthMsgs = this.getHealthMessages(projectId)
    messages.push(...healthMsgs)

    // 4. Рекомендации по вариантам
    const variantMsgs = this.getVariantMessages(projectId)
    messages.push(...variantMsgs)

    // Сохраняем
    this.messages.set(projectId, messages)

    return messages
  }

  private getNextStepMessage(projectId: UUID): CoachMessage | null {
    const nextStage = WorkflowEngine.getNextStage(projectId)
    if (!nextStage) return null

    const actions: Record<StageId, CoachAction> = {
      initial_data: { label: "Ввести исходные данные", type: "start_stage", params: { stage: "initial_data" } },
      geometry: { label: "Нарисовать план", type: "start_stage", params: { stage: "geometry" } },
      rooms: { label: "Определить помещения", type: "start_stage", params: { stage: "rooms" } },
      furniture: { label: "Расставить мебель", type: "start_stage", params: { stage: "furniture" } },
      electrical_points: { label: "Разместить электроточки", type: "start_stage", params: { stage: "electrical_points" } },
      circuits: { label: "Сформировать группы", type: "start_stage", params: { stage: "circuits" } },
      cable_routes: { label: "Проложить трассы", type: "start_stage", params: { stage: "cable_routes" } },
      panel: { label: "Скомпоновать щит", type: "start_stage", params: { stage: "panel" } },
      validation: { label: "Проверить проект", type: "run_validation" },
      optimization: { label: "Оптимизировать", type: "start_stage", params: { stage: "optimization" } },
      documentation: { label: "Сгенерировать документы", type: "export" },
      complete: { label: "Проект готов!", type: "export" },
    }

    return {
      id: this.generateId(),
      type: "next_step",
      title: "Следующий шаг",
      message: `Сейчас лучше перейти к этапу «${nextStage.nameRu}»: ${nextStage.description}`,
      action: actions[nextStage.id],
      priority: "high",
      timestamp: new Date(),
    }
  }

  private getCompletenessMessages(projectId: UUID): CoachMessage[] {
    const completeness = CompletenessEngine.analyze(projectId)
    const messages: CoachMessage[] = []

    // Критические пропуски
    const essential = completeness.missingItems.filter(m => m.priority === "essential")
    if (essential.length > 0) {
      messages.push({
        id: this.generateId(),
        type: "warning",
        title: "Отсутствуют важные элементы",
        message: `В помещениях не хватает: ${essential.map(m => `${m.name} (${m.roomName})`).join(", ")}`,
        priority: "high",
        timestamp: new Date(),
      })
    }

    // Рекомендуемые пропуски
    const recommended = completeness.missingItems.filter(m => m.priority === "recommended")
    if (recommended.length > 0) {
      messages.push({
        id: this.generateId(),
        type: "recommendation",
        title: "Рекомендуемые элементы",
        message: `Для удобства стоит добавить: ${recommended.slice(0, 3).map(m => m.name).join(", ")}`,
        action: { label: "Добавить", type: "add_object" },
        priority: "medium",
        timestamp: new Date(),
      })
    }

    return messages
  }

  private getHealthMessages(projectId: UUID): CoachMessage[] {
    const health = ProjectHealth.analyze(projectId)
    const messages: CoachMessage[] = []

    // Предложения по улучшению
    for (const improvement of health.improvements.slice(0, 2)) {
      messages.push({
        id: this.generateId(),
        type: "recommendation",
        title: improvement.category,
        message: `${improvement.description} (+${improvement.impact} баллов)`,
        priority: improvement.priority as "high" | "medium" | "low",
        timestamp: new Date(),
      })
    }

    // Поздравление с достижениями
    if (health.engineeringScore >= 90) {
      messages.push({
        id: this.generateId(),
        type: "celebration",
        title: "Отличный результат!",
        message: `Engineering Score: ${health.engineeringScore}/100. Проект высокого качества.`,
        priority: "low",
        timestamp: new Date(),
      })
    }

    return messages
  }

  private getVariantMessages(projectId: UUID): CoachMessage[] {
    const variants = VariantEngine.getProjectVariants(projectId)
    const messages: CoachMessage[] = []

    if (variants.length === 0) {
      messages.push({
        id: this.generateId(),
        type: "recommendation",
        title: "Сравнение вариантов",
        message: "Хотите сравнить варианты решения: Эконом, Стандарт, Премиум?",
        action: { label: "Сравнить", type: "view_variant" },
        priority: "low",
        timestamp: new Date(),
      })
    }

    return messages
  }

  // --- Контекстные подсказки ---

  getContextualHint(projectId: UUID, currentAction: string): string | null {
    const hints: Record<string, string> = {
      "add_outlet": "Рекомендуемая высота розетки: 300мм от пола. Для кухни — 1100мм (над столешницей).",
      "add_light": "Светильники обычно размещаются в центре помещения или над рабочей зоной.",
      "add_switch": "Выключатель у двери — 900мм от пола. Проходной — у кровати.",
      "add_breaker": "Для розеточных групп — автомат 16А. Для освещения — 10А.",
      "move_panel": "Щит рекомендуется размещать в прихожей на высоте 1.4-1.7м.",
    }

    return hints[currentAction] ?? null
  }

  // --- Объяснение решений ---

  explainDecision(projectId: UUID, decisionType: string): string {
    const explanations: Record<string, string> = {
      cable_section: "Сечение кабеля определяется расчётным током. Для розеток — 2.5мм² (до 25А), для освещения — 1.5мм² (до 16А).",
      breaker_rating: "Номинал автомата не должен превышать допустимый ток кабеля. Тип C — для бытовых нагрузок.",
      rcd_selection: "УЗО 30мА обязательно для ванных, кухонь и розеток, доступных детям.",
      phase_balance: "Нагрузка распределяется по фазам для минимизации потерь.",
    }

    return explanations[decisionType] ?? "Детали решения доступны в разделе «Обоснование»."
  }

  // --- Запросы ---

  getMessages(projectId: UUID): CoachMessage[] {
    return this.messages.get(projectId) ?? []
  }

  // --- События ---

  on(listener: (message: CoachMessage) => void): () => void {
    this.listeners.push(listener)
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener)
    }
  }

  private emit(message: CoachMessage): void {
    for (const listener of this.listeners) {
      listener(message)
    }
  }

  private generateId(): UUID {
    return `coach_${Date.now()}_${Math.random().toString(36).slice(2, 9)}` as UUID
  }
}

// ============================================================
// СИНГЛТОН
// ============================================================

export const ProjectCoach = new ProjectCoachImpl()
