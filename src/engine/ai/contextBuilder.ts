// ============================================================
// ElectricPMR — Context Builder
// ============================================================
//
// Не отправляй весь проект в LLM.
// Отправляй только релевантный контекст.
// ============================================================

import type { AIContext, AIMessage } from "./types"
import type { UUID } from "../types/common"
import type { ElectricalPoint, CircuitGroup, Panel } from "../types/electrical"
import type { Room, Wall } from "../types/geometry"

// ============================================================
// INTERFACE
// ============================================================

interface ProjectContext {
  walls: Wall[]
  rooms: Room[]
  points: ElectricalPoint[]
  circuits: CircuitGroup[]
  panels: Panel[]
}

interface ContextSlice {
  summary: string
  rooms: RoomSummary[]
  electrical: ElectricalSummary
  panels: PanelSummary[]
  normatives: string[]
  recentChanges: string[]
}

interface RoomSummary {
  id: UUID
  name: string
  type: string
  area: number
  points: number
  circuits: number
}

interface ElectricalSummary {
  totalPoints: number
  totalCircuits: number
  totalLoad: number
  phases: { L1: number; L2: number; L3: number }
}

interface PanelSummary {
  id: UUID
  name: string
  equipmentCount: number
  totalModules: number
}

// ============================================================
// CONTEXT BUILDER
// ============================================================

class ContextBuilderImpl {

  // --- Сборка контекста для LLM ---

  buildContext(
    project: ProjectContext,
    userMessage: string,
    aiContext: AIContext
  ): ContextSlice {
    // Определяем релевантные комнаты
    const relevantRooms = this.findRelevantRooms(project.rooms, userMessage, aiContext)

    // Определяем релевантные электроточки
    const relevantPoints = this.findRelevantPoints(project.points, relevantRooms)

    // Определяем релевантные группы
    const relevantCircuits = this.findRelevantCircuits(project.circuits, relevantPoints)

    // Собираем срез
    return {
      summary: this.buildSummary(project, relevantRooms),
      rooms: relevantRooms.map(r => ({
        id: r.id,
        name: r.name,
        type: r.type,
        area: r.area,
        points: relevantPoints.filter(p => p.roomId === r.id).length,
        circuits: relevantCircuits.filter(c => c.roomId === r.id).length,
      })),
      electrical: {
        totalPoints: relevantPoints.length,
        totalCircuits: relevantCircuits.length,
        totalLoad: relevantCircuits.reduce((sum, c) => sum + c.load.effectivePower, 0),
        phases: {
          L1: relevantCircuits.filter(c => c.phase === 1).reduce((sum, c) => sum + c.load.effectivePower, 0),
          L2: relevantCircuits.filter(c => c.phase === 2).reduce((sum, c) => sum + c.load.effectivePower, 0),
          L3: relevantCircuits.filter(c => c.phase === 3).reduce((sum, c) => sum + c.load.effectivePower, 0),
        },
      },
      panels: project.panels.map(p => ({
        id: p.id,
        name: p.name,
        equipmentCount: p.equipment.length,
        totalModules: p.equipment.reduce((sum, e) => sum + e.modules, 0),
      })),
      normatives: this.getRelevantNormatives(userMessage),
      recentChanges: aiContext.recentChanges.slice(-5),
    }
  }

  // --- Форматирование для LLM ---

  formatForLLM(slice: ContextSlice): string {
    const lines: string[] = []

    lines.push(`## Текущий проект`)
    lines.push(slice.summary)
    lines.push("")

    if (slice.rooms.length > 0) {
      lines.push("## Помещения")
      for (const room of slice.rooms) {
        lines.push(`- ${room.name} (${room.type}): ${room.area}м², ${room.points} точек, ${room.circuits} групп`)
      }
      lines.push("")
    }

    lines.push("## Электрика")
    lines.push(`Точек: ${slice.electrical.totalPoints}`)
    lines.push(`Групп: ${slice.electrical.totalCircuits}`)
    lines.push(`Мощность: ${slice.electrical.totalLoad}Вт`)
    lines.push(`Фазы: L1=${slice.electrical.phases.L1}Вт, L2=${slice.electrical.phases.L2}Вт, L3=${slice.electrical.phases.L3}Вт`)
    lines.push("")

    if (slice.panels.length > 0) {
      lines.push("## Щиты")
      for (const panel of slice.panels) {
        lines.push(`- ${panel.name}: ${panel.equipmentCount} элементов, ${panel.totalModules} модулей`)
      }
      lines.push("")
    }

    if (slice.normatives.length > 0) {
      lines.push("## Актуальные нормативы")
      for (const n of slice.normatives) {
        lines.push(`- ${n}`)
      }
      lines.push("")
    }

    if (slice.recentChanges.length > 0) {
      lines.push("## Последние изменения")
      for (const c of slice.recentChanges) {
        lines.push(`- ${c}`)
      }
    }

    return lines.join("\n")
  }

  // --- Системный промпт ---

  getSystemPrompt(): string {
    return `Ты — AI-инженер по проектированию электромонтажа в системе ElectricPMR.

Твои обязанности:
- Проектирование электрики в жилых и коммерческих помещениях
- Выбор кабелей, автоматов, УЗО по ПУЭ 7-е издание и СП 256.1325800.2016
- Расчёт нагрузок, баланс фаз, падения напряжения
- Оптимизация стоимости при сохранении качества

Правила:
1. НИКОГДА не меняй проект напрямую. Используй только инструменты.
2. Всегда проверяй проект после изменений.
3. Объясняй свои решения.
4. При неуверенности (< 0.7) — спрашивай пользователя.
5. Учитывай нормативы: ПУЭ, СП, ГОСТ.
6. Предлагай альтернативы, если есть сомнения.

Доступные инструменты: см. Tool Registry.`
  }

  // --- Приватные методы ---

  private findRelevantRooms(rooms: Room[], query: string, context: AIContext): Room[] {
    const q = query.toLowerCase()

    // Если указана конкретная комната в контексте
    if (context.activeRoom) {
      const room = rooms.find(r => r.id === context.activeRoom)
      if (room) return [room]
    }

    // Ищем по ключевым словам
    const keywords: Record<string, string[]> = {
      kitchen: ["кухня", "кухн", "kitchen"],
      bathroom: ["ванная", "ванн", "туалет", "bathroom", "санузел"],
      bedroom: ["спальня", "спальн", "bedroom"],
      living: ["гостиная", "гостин", "зал", "living"],
      hall: ["прихожая", "прихож", "коридор", "hall", "corridor"],
    }

    for (const [roomType, words] of Object.entries(keywords)) {
      if (words.some(w => q.includes(w))) {
        const found = rooms.filter(r => r.type === roomType)
        if (found.length > 0) return found
      }
    }

    // По умолчанию — все комнаты
    return rooms
  }

  private findRelevantPoints(points: ElectricalPoint[], rooms: Room[]): ElectricalPoint[] {
    const roomIds = new Set(rooms.map(r => r.id))
    return points.filter(p => !p.roomId || roomIds.has(p.roomId))
  }

  private findRelevantCircuits(circuits: CircuitGroup[], points: ElectricalPoint[]): CircuitGroup[] {
    const pointIds = new Set(points.map(p => p.id))
    return circuits.filter(c => c.points.some(pid => pointIds.has(pid)))
  }

  private buildSummary(project: ProjectContext, rooms: Room[]): string {
    const totalArea = rooms.reduce((sum, r) => sum + r.area, 0)
    return `${rooms.length} помещений, ${totalArea.toFixed(1)}м², ${project.walls.length} стен, ${project.points.length} электроточек`
  }

  private getRelevantNormatives(query: string): string[] {
    const q = query.toLowerCase()
    const norms: string[] = []

    if (q.includes("розетк") || q.includes("outlet")) {
      norms.push("ПУЭ 7.1.36 — высота розеток ≥300мм")
    }
    if (q.includes("ванн") || q.includes("bathroom")) {
      norms.push("ПУЭ 7.1.47 — розетки в ванных через УЗО 30мА")
    }
    if (q.includes("кабел") || q.includes("cable")) {
      norms.push("ПУЭ 7.1.31 — минимальные сечения")
      norms.push("ПУЭ 6.6.20 — падение напряжения ≤5%")
    }
    if (q.includes("автомат") || q.includes("breaker")) {
      norms.push("ПУЭ 7.1.34 — селективность автоматов")
    }
    if (q.includes("щит") || q.includes("panel")) {
      norms.push("СП 16.1 — установка щитов 1.4-1.7м")
    }

    return norms
  }
}

export const ContextBuilder = new ContextBuilderImpl()
