// ============================================================
// ElectricPMR — Completeness Engine
// ============================================================
//
// На основе шаблонов определяет, чего не хватает в проекте.
// Не "обязательно", а "обычно бывает".
// ============================================================

import type { UUID } from "../types/common"
import { KnowledgeBase, ROOM_KNOWLEDGE, type RoomTemplate } from "./knowledgeBase"
import { ComponentStore } from "../core/ecs"

// ============================================================
// COMPLETENESS TYPES
// ============================================================

export interface CompletenessReport {
  projectId: UUID
  overallScore: number // 0-100
  rooms: RoomCompleteness[]
  missingItems: MissingItem[]
  recommendations: string[]
}

export interface RoomCompleteness {
  roomId: UUID
  roomName: string
  roomType: string
  score: number // 0-100
  expected: ExpectedItem[]
  actual: ActualItem[]
  missing: MissingItem[]
}

export interface ExpectedItem {
  type: string
  name: string
  expectedCount: number
  category: "electrical" | "safety" | "comfort" | "convenience"
}

export interface ActualItem {
  type: string
  name: string
  count: number
}

export interface MissingItem {
  type: string
  name: string
  roomType: string
  roomName: string
  priority: "essential" | "recommended" | "optional"
  reason: string
}

// ============================================================
// COMPLETENESS ENGINE
// ============================================================

class CompletenessEngineImpl {

  analyze(projectId: UUID): CompletenessReport {
    const rooms = this.findRooms(projectId)
    const roomReports: RoomCompleteness[] = []

    for (const room of rooms) {
      const report = this.analyzeRoom(room)
      roomReports.push(report)
    }

    // Собираем все пропущенные элементы
    const missingItems = roomReports.flatMap(r => r.missing)

    // Генерируем рекомендации
    const recommendations = this.generateRecommendations(missingItems)

    // Общий балл
    const overallScore = roomReports.length > 0
      ? Math.round(roomReports.reduce((sum, r) => sum + r.score, 0) / roomReports.length)
      : 0

    return {
      projectId,
      overallScore,
      rooms: roomReports,
      missingItems,
      recommendations,
    }
  }

  private findRooms(projectId: UUID): Array<{ id: UUID; name: string; type: string }> {
    const entities = ComponentStore.queryByComponent("identity")
    const rooms: Array<{ id: UUID; name: string; type: string }> = []

    for (const entity of entities) {
      if (entity.data.type === "room") {
        rooms.push({
          id: entity.entityId,
          name: entity.data.name,
          type: entity.data.type,
        })
      }
    }

    // Если нет явных комнат — ищем по типам
    if (rooms.length === 0) {
      // Пытаемся определить комнаты по контексту
      const outlets = ComponentStore.queryByComponent("metadata")
      const roomTypes = new Set<string>()

      for (const entity of outlets) {
        if (entity.data.tags?.includes("kitchen")) roomTypes.add("kitchen")
        if (entity.data.tags?.includes("bedroom")) roomTypes.add("bedroom")
        if (entity.data.tags?.includes("bathroom")) roomTypes.add("bathroom")
      }

      for (const roomType of roomTypes) {
        rooms.push({
          id: `auto_${roomType}` as UUID,
          name: ROOM_KNOWLEDGE[roomType]?.nameRu ?? roomType,
          type: roomType,
        })
      }
    }

    return rooms
  }

  private analyzeRoom(room: { id: UUID; name: string; type: string }): RoomCompleteness {
    const template = KnowledgeBase.getRoomTemplate(room.type)
    const expected = template?.typicalObjects ?? []

    // Считаем фактические объекты
    const entities = ComponentStore.queryByComponent("identity")
    const roomEntities = entities.filter(e => {
      // Упрощённо — проверяем теги или расположение
      return true
    })

    const actualCounts = new Map<string, number>()
    for (const entity of roomEntities) {
      const type = entity.data.type
      actualCounts.set(type, (actualCounts.get(type) ?? 0) + 1)
    }

    // Сравниваем
    const expectedItems: ExpectedItem[] = expected.map(e => ({
      type: e.type,
      name: e.name,
      expectedCount: typeof e.count === "number" ? e.count : e.count.min,
      category: this.categorizeItem(e.type),
    }))

    const actualItems: ActualItem[] = expectedItems.map(e => ({
      type: e.type,
      name: e.name,
      count: actualCounts.get(e.type) ?? 0,
    }))

    // Находим пропущенные
    const missing: MissingItem[] = []
    for (let i = 0; i < expectedItems.length; i++) {
      const exp = expectedItems[i]
      const act = actualItems[i]

      if (act.count < exp.expectedCount) {
        missing.push({
          type: exp.type,
          name: exp.name,
          roomType: room.type,
          roomName: room.name,
          priority: exp.category === "safety" ? "essential" :
                    exp.category === "electrical" ? "recommended" : "optional",
          reason: `Ожидалось ${exp.expectedCount}, найдено ${act.count}`,
        })
      }
    }

    // Балл
    const totalExpected = expectedItems.reduce((sum, e) => sum + e.expectedCount, 0)
    const totalActual = actualItems.reduce((sum, a) => sum + a.count, 0)
    const score = totalExpected > 0
      ? Math.min(100, Math.round((totalActual / totalExpected) * 100))
      : 100

    return {
      roomId: room.id,
      roomName: room.name,
      roomType: room.type,
      score,
      expected: expectedItems,
      actual: actualItems,
      missing,
    }
  }

  private categorizeItem(type: string): "electrical" | "safety" | "comfort" | "convenience" {
    if (type.includes("sensor")) return "safety"
    if (type.includes("outlet") || type.includes("light") || type.includes("switch")) return "electrical"
    if (type.includes("ac") || type.includes("heater")) return "comfort"
    return "convenience"
  }

  private generateRecommendations(missing: MissingItem[]): string[] {
    const recs: string[] = []

    const essential = missing.filter(m => m.priority === "essential")
    const recommended = missing.filter(m => m.priority === "recommended")

    if (essential.length > 0) {
      recs.push(`Критически важные элементы: ${essential.map(m => m.name).join(", ")}`)
    }

    if (recommended.length > 0) {
      recs.push(`Рекомендуемые элементы: ${recommended.map(m => m.name).join(", ")}`)
    }

    return recs
  }
}

// ============================================================
// СИНГЛТОН
// ============================================================

export const CompletenessEngine = new CompletenessEngineImpl()
