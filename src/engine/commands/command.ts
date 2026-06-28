// ============================================================
// ElectricPMR — Command System
// ============================================================
//
// Философия:
//   Все действия — команды. Пользователь и AI работают
//   через один и тот же интерфейс. Undo/Redo за free.
// ============================================================

import type { UUID } from "../types/common"

// ============================================================
// БАЗОВЫЙ ИНТЕРФЕЙС КОМАНДЫ
// ============================================================

export interface Command {
  readonly id: UUID
  readonly type: string
  readonly description: string
  readonly timestamp: Date

  execute(): CommandResult
  undo(): CommandResult
  redo(): CommandResult

  // Для UI: что изменилось
  getChanges(): CommandChange[]
}

export interface CommandResult {
  success: boolean
  error?: string
  data?: unknown
}

export interface CommandChange {
  action: "created" | "modified" | "removed" | "assigned" | "unassigned"
  targetType: string
  targetId: UUID
  description: string
  before?: unknown
  after?: unknown
}

// ============================================================
// COMMAND MANAGER (Undo/Redo stack)
// ============================================================

class CommandManagerImpl {
  private undoStack: Command[] = []
  private redoStack: Command[] = []
  private maxSize: number = 200
  private listeners: Set<() => void> = new Set()

  execute(command: Command): CommandResult {
    const result = command.execute()

    if (result.success) {
      this.undoStack.push(command)
      if (this.undoStack.length > this.maxSize) {
        this.undoStack.shift()
      }
      // При новой команде — очищаем redo
      this.redoStack = []
      this.notify()
    }

    return result
  }

  undo(): CommandResult {
    const command = this.undoStack.pop()
    if (!command) {
      return { success: false, error: "Nothing to undo" }
    }

    const result = command.undo()
    if (result.success) {
      this.redoStack.push(command)
      this.notify()
    }
    return result
  }

  redo(): CommandResult {
    const command = this.redoStack.pop()
    if (!command) {
      return { success: false, error: "Nothing to redo" }
    }

    const result = command.redo()
    if (result.success) {
      this.undoStack.push(command)
      this.notify()
    }
    return result
  }

  canUndo(): boolean {
    return this.undoStack.length > 0
  }

  canRedo(): boolean {
    return this.redoStack.length > 0
  }

  getUndoDescription(): string | null {
    const last = this.undoStack[this.undoStack.length - 1]
    return last?.description ?? null
  }

  getRedoDescription(): string | null {
    const last = this.redoStack[this.redoStack.length - 1]
    return last?.description ?? null
  }

  clear(): void {
    this.undoStack = []
    this.redoStack = []
    this.notify()
  }

  getHistory(): Array<{ command: Command; direction: "undo" | "redo" }> {
    return [
      ...this.undoStack.map(c => ({ command: c, direction: "undo" as const })),
      ...this.redoStack.reverse().map(c => ({ command: c, direction: "redo" as const })),
    ]
  }

  // Подписка на изменения (для React)
  subscribe(listener: () => void): () => void {
    this.listeners.add(listener)
    return () => { this.listeners.delete(listener) }
  }

  private notify(): void {
    this.listeners.forEach(l => l())
  }
}

export const CommandManager = new CommandManagerImpl()

// ============================================================
// УТИЛИТА: генерация ID
// ============================================================

export function generateCommandId(): UUID {
  return `cmd_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
}
