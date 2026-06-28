// ============================================================
// ElectricPMR — Planner
// ============================================================
//
// Декомпозиция задачи на последовательность команд.
// LLM не выполняет команды напрямую — сначала план.
// ============================================================

import type { AIPlan, AIPlanStep } from "./types"
import { ToolRegistry } from "./toolRegistry"
import type { UUID } from "../types/common"

// ============================================================
// PLANNER
// ============================================================

class PlannerImpl {

  // --- Создание плана из пользовательского запроса ---

  createPlan(goal: string, contextSummary: string): AIPlan {
    const steps = this.decomposeGoal(goal, contextSummary)
    const confidence = this.estimateConfidence(steps)

    return {
      id: this.generateId(),
      goal,
      steps,
      estimatedConfidence: confidence,
      estimatedChanges: steps.length,
      requiresConfirmation: confidence < 0.7,
    }
  }

  // --- Декомпозиция целей ---

  private decomposeGoal(goal: string, context: string): AIPlanStep[] {
    const g = goal.toLowerCase()
    const steps: AIPlanStep[] = []
    let order = 1

    // Паттерн: "добавь розетку в [комнату]"
    if (g.includes("розетк") && (g.includes("добавь") || g.includes("поставь"))) {
      const room = this.extractRoom(g)
      const count = this.extractCount(g) ?? 1
      const position = this.guessPosition(g)

      for (let i = 0; i < count; i++) {
        steps.push({
          order: order++,
          toolName: "createOutlet",
          parameters: {
            x: position.x + i * 200,
            y: position.y,
            name: `Розетка ${room ? `в ${room}` : ""} ${i + 1}`,
          },
          description: `Создать розетку ${room ? `в ${room}` : ""}`,
          dependencies: [],
          estimatedImpact: "low",
        })
      }

      steps.push({
        order: order++,
        toolName: "validateProject",
        parameters: {},
        description: "Проверить проект после изменений",
        dependencies: steps.map(s => s.order),
        estimatedImpact: "low",
      })
    }

    // Паттерн: "добавь светильник"
    if (g.includes("светильник") || g.includes("свет") && (g.includes("добавь") || g.includes("поставь"))) {
      const room = this.extractRoom(g)

      steps.push({
        order: order++,
        toolName: "createLight",
        parameters: {
          x: 400,
          y: 300,
          subtype: "light_ceiling",
          name: `Светильник ${room ? `в ${room}` : ""}`,
        },
        description: `Создать светильник ${room ? `в ${room}` : ""}`,
        dependencies: [],
        estimatedImpact: "low",
      })
    }

    // Паттерн: "проверь проект"
    if (g.includes("проверь") || g.includes("проверка") || g.includes("ошибк")) {
      steps.push({
        order: order++,
        toolName: "validateProject",
        parameters: {},
        description: "Проверить проект на ошибки",
        dependencies: [],
        estimatedImpact: "low",
      })
    }

    // Паттерн: "рассчитай нагрузку"
    if (g.includes("нагрузк") || g.includes("рассчитай")) {
      steps.push({
        order: order++,
        toolName: "calculateLoad",
        parameters: { scope: "project" },
        description: "Рассчитать общую нагрузку",
        dependencies: [],
        estimatedImpact: "low",
      })
    }

    // Паттерн: "экспорт в PDF"
    if (g.includes("pdf") || g.includes("экспорт") || g.includes("документ")) {
      steps.push({
        order: order++,
        toolName: "exportPDF",
        parameters: {},
        description: "Экспортировать проект в PDF",
        dependencies: [],
        estimatedImpact: "low",
      })
    }

    // Если ни один паттерн не распознан — создаём общий план
    if (steps.length === 0) {
      steps.push({
        order: order++,
        toolName: "validateProject",
        parameters: {},
        description: `Выполнить: ${goal}`,
        dependencies: [],
        estimatedImpact: "medium",
      })
    }

    return steps
  }

  // --- Оценка уверенности ---

  private estimateConfidence(steps: AIPlanStep[]): number {
    if (steps.length === 0) return 0.5

    // Проверяем, все ли инструменты существуют
    const allToolsExist = steps.every(s => ToolRegistry.get(s.toolName) !== undefined)
    if (!allToolsExist) return 0.3

    // Простая эвристика: чем меньше шагов — тем выше уверенность
    if (steps.length <= 2) return 0.9
    if (steps.length <= 5) return 0.8
    if (steps.length <= 10) return 0.7
    return 0.6
  }

  // --- Извлечение параметров из текста ---

  private extractRoom(text: string): string | null {
    const rooms: Record<string, string[]> = {
      kitchen: ["кухня", "кухн"],
      bathroom: ["ванная", "ванн", "туалет", "санузел"],
      bedroom: ["спальня", "спальн"],
      living: ["гостиная", "гостин", "зал"],
      hall: ["прихожая", "прихож", "коридор"],
    }

    for (const [roomType, keywords] of Object.entries(rooms)) {
      if (keywords.some(k => text.includes(k))) {
        return roomType
      }
    }
    return null
  }

  private extractCount(text: string): number | null {
    const countWords: Record<string, number> = {
      "одну": 1, "один": 1, "одна": 1,
      "две": 2, "два": 2, "две": 2,
      "три": 3, "четыре": 4, "пять": 5,
    }

    for (const [word, num] of Object.entries(countWords)) {
      if (text.includes(word)) return num
    }

    // Ищем цифры
    const match = text.match(/(\d+)/)
    if (match) return parseInt(match[1])

    return null
  }

  private guessPosition(text: string): Point {
    // Заглушка — в реальном продукте здесь будет анализ контекста комнаты
    return { x: 400, y: 300 }
  }

  private generateId(): UUID {
    return `plan_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
  }
}

type Point = { x: number; y: number }

export const Planner = new PlannerImpl()
