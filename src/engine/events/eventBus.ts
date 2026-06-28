// ============================================================
// ElectricPMR — Event Bus (событийная шина)
// ============================================================
//
// Философия:
//   Нет "пользователь нажал кнопку". Есть "событие произошло".
//   Система реагирует на события. Ничего не забывается.
// ============================================================

import type { SystemEvent, EventType } from "../types/events"

export type EventHandler<T extends SystemEvent = SystemEvent> = (event: T) => void | Promise<void>
export type Unsubscribe = () => void

interface Subscription {
  handler: EventHandler
  eventType: string | "*"       // "*" = подписка на все события
  once: boolean
}

// Максимальная длина истории (после чего старые события архивируются)
const MAX_HISTORY = 10_000

class EventBusImpl {
  private subscriptions: Subscription[] = []
  private history: SystemEvent[] = []
  private listeners: Set<() => void> = new Set()
  private isProcessing = false
  private eventQueue: SystemEvent[] = []

  // --- Подписка ---

  on<T extends SystemEvent["type"]>(
    eventType: T | "*",
    handler: EventHandler
  ): Unsubscribe {
    const sub: Subscription = {
      handler: handler as EventHandler,
      eventType,
      once: false,
    }
    this.subscriptions.push(sub)
    return () => {
      this.subscriptions = this.subscriptions.filter(s => s !== sub)
    }
  }

  once<T extends SystemEvent["type"]>(
    eventType: T | "*",
    handler: EventHandler
  ): Unsubscribe {
    const sub: Subscription = {
      handler: handler as EventHandler,
      eventType,
      once: true,
    }
    this.subscriptions.push(sub)
    return () => {
      this.subscriptions = this.subscriptions.filter(s => s !== sub)
    }
  }

  // --- Публикация события ---

  emit(event: SystemEvent): void {
    // Сохраняем в историю
    this.history.push(event)
    if (this.history.length > MAX_HISTORY) {
      this.history = this.history.slice(-MAX_HISTORY)
    }

    // Добавляем в очередь (избегаем рекурсии)
    this.eventQueue.push(event)
    if (!this.isProcessing) {
      this.processQueue()
    }
  }

  private async processQueue(): Promise<void> {
    this.isProcessing = true
    while (this.eventQueue.length > 0) {
      const event = this.eventQueue.shift()!
      await this.dispatch(event)
    }
    this.isProcessing = false
    // Уведомляем UI-слушателей об обновлении
    this.listeners.forEach(listener => listener())
  }

  private async dispatch(event: SystemEvent): Promise<void> {
    const eventTypeName = event.type

    for (const sub of this.subscriptions) {
      if (sub.eventType === "*" || sub.eventType === eventTypeName) {
        try {
          await sub.handler(event)
        } catch (err) {
          console.error(`[EventBus] Error in handler for ${eventTypeName}:`, err)
        }
      }
    }

    // Удаляем одноразовые подписки
    this.subscriptions = this.subscriptions.filter(sub => {
      if (sub.once && (sub.eventType === "*" || sub.eventType === eventTypeName)) {
        return false
      }
      return true
    })
  }

  // --- История ---

  getHistory(filter?: {
    types?: EventType[]
    since?: Date
    limit?: number
  }): SystemEvent[] {
    let events = [...this.history]

    if (filter?.types) {
      const typeSet = new Set(filter.types)
      events = events.filter(e => typeSet.has(e.type as EventType))
    }

    if (filter?.since) {
      // История хранит события с type, но не timestamp отдельно
      // Фильтруем по порядку (события идут последовательно)
      const sinceIndex = this.history.findIndex((_, i) => {
        // Простая эвристика: берём последние N событий
        return false // пока не используем
      })
    }

    if (filter?.limit) {
      events = events.slice(-filter.limit)
    }

    return events
  }

  clearHistory(): void {
    this.history = []
  }

  // --- UI-подписки (для React) ---

  subscribe(listener: () => void): Unsubscribe {
    this.listeners.add(listener)
    return () => { this.listeners.delete(listener) }
  }

  getStats() {
    return {
      historyLength: this.history.length,
      subscriptionCount: this.subscriptions.length,
      listenerCount: this.listeners.size,
      queueLength: this.eventQueue.length,
    }
  }
}

// Синглтон
export const EventBus = new EventBusImpl()
