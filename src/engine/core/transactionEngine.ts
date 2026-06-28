// ============================================================
// ElectricPMR — Transaction Engine
// ============================================================
//
// Все изменения проекта — только через транзакции.
// Begin → Commands → Validation → Dependency Update → Commit/Rollback
// ============================================================

import type { UUID } from "../types/common"
import type { UniversalObject } from "./universalObject"
import { ObjectRegistry } from "./objectRegistry"
import { DependencyGraph } from "./dependencyGraph"

// ============================================================
// TRANSACTION ENGINE
// ============================================================

class TransactionEngineImpl {
  private transactions: Map<UUID, Transaction> = new Map()
  private activeTransaction: Transaction | null = null
  private undoStack: Transaction[] = []
  private redoStack: Transaction[] = []
  private maxUndoSize = 100
  private listeners: Array<(event: TransactionEvent) => void> = []

  // --- Управление транзакциями ---

  begin(description?: string): Transaction {
    if (this.activeTransaction) {
      throw new Error(`Transaction already active: ${this.activeTransaction.id}`)
    }

    const id = `txn_${Date.now()}_${Math.random().toString(36).slice(2, 9)}` as UUID

    const transaction: Transaction = {
      id,
      description: description ?? "Unnamed transaction",
      status: "active",
      commands: [],
      snapshotBefore: this.takeSnapshot(),
      snapshotAfter: null,
      startedAt: new Date(),
      completedAt: null,
    }

    this.activeTransaction = transaction
    this.transactions.set(id, transaction)

    this.emit({ type: "begun", transactionId: id, description })
    return transaction
  }

  commit(): TransactionResult {
    if (!this.activeTransaction) {
      throw new Error("No active transaction")
    }

    const txn = this.activeTransaction

    // Валидация
    const validationResult = this.validateTransaction(txn)
    if (!validationResult.valid) {
      return this.rollback(validationResult.errors.join(", "))
    }

    // Применение команд
    const applyResult = this.applyCommands(txn)
    if (!applyResult.success) {
      return this.rollback(applyResult.error ?? "Failed to apply commands")
    }

    // Обновление зависимостей
    this.updateDependencies(txn)

    // Финальный снимок
    txn.snapshotAfter = this.takeSnapshot()

    // Завершение
    txn.status = "committed"
    txn.completedAt = new Date()
    this.activeTransaction = null

    // В стек отмены
    this.undoStack.push(txn)
    if (this.undoStack.length > this.maxUndoSize) {
      this.undoStack.shift()
    }
    this.redoStack = []

    this.emit({
      type: "committed",
      transactionId: txn.id,
      commandCount: txn.commands.length,
    })

    return {
      success: true,
      transactionId: txn.id,
      commandCount: txn.commands.length,
    }
  }

  rollback(reason?: string): TransactionResult {
    if (!this.activeTransaction) {
      throw new Error("No active transaction")
    }

    const txn = this.activeTransaction

    // Откат команд (в обратном порядке)
    for (const cmd of [...txn.commands].reverse()) {
      try {
        cmd.undo()
      } catch (err) {
        console.error(`Failed to undo command ${cmd.id}:`, err)
      }
    }

    // Восстановление снимка
    if (txn.snapshotBefore) {
      this.restoreSnapshot(txn.snapshotBefore)
    }

    txn.status = "rolled_back"
    txn.completedAt = new Date()
    this.activeTransaction = null

    this.emit({
      type: "rolled_back",
      transactionId: txn.id,
      reason: reason ?? "User rollback",
    })

    return {
      success: false,
      transactionId: txn.id,
      error: reason ?? "Rolled back",
    }
  }

  // --- Команды внутри транзакции ---

  execute(command: TransactionCommand): void {
    if (!this.activeTransaction) {
      throw new Error("No active transaction — use begin() first")
    }

    if (this.activeTransaction.status !== "active") {
      throw new Error(`Transaction ${this.activeTransaction.id} is ${this.activeTransaction.status}`)
    }

    try {
      command.execute()
      this.activeTransaction.commands.push(command)
    } catch (err) {
      // Автоматический откат при ошибке команды
      this.rollback(err instanceof Error ? err.message : String(err))
      throw err
    }
  }

  // --- Отмена/Повтор ---

  undo(): boolean {
    if (this.activeTransaction) {
      throw new Error("Cannot undo while transaction is active")
    }

    const txn = this.undoStack.pop()
    if (!txn) return false

    // Откатываем команды в обратном порядке
    for (const cmd of [...txn.commands].reverse()) {
      try {
        cmd.undo()
      } catch (err) {
        console.error(`Failed to undo command ${cmd.id}:`, err)
      }
    }

    // Восстанавливаем снимок
    if (txn.snapshotBefore) {
      this.restoreSnapshot(txn.snapshotBefore)
    }

    this.redoStack.push(txn)
    this.emit({ type: "undone", transactionId: txn.id })
    return true
  }

  redo(): boolean {
    if (this.activeTransaction) {
      throw new Error("Cannot redo while transaction is active")
    }

    const txn = this.redoStack.pop()
    if (!txn) return false

    // Повторяем команды
    for (const cmd of txn.commands) {
      try {
        cmd.execute()
      } catch (err) {
        console.error(`Failed to redo command ${cmd.id}:`, err)
        this.redoStack.push(txn)
        return false
      }
    }

    // Восстанавливаем снимок после
    if (txn.snapshotAfter) {
      this.restoreSnapshot(txn.snapshotAfter)
    }

    this.undoStack.push(txn)
    this.emit({ type: "redone", transactionId: txn.id })
    return true
  }

  canUndo(): boolean {
    return this.undoStack.length > 0 && !this.activeTransaction
  }

  canRedo(): boolean {
    return this.redoStack.length > 0 && !this.activeTransaction
  }

  // --- Снимки ---

  takeSnapshot(): TransactionSnapshot {
    const objects = ObjectRegistry.getAll()
    return {
      objects: objects.map(obj => JSON.parse(JSON.stringify(obj))),
      timestamp: new Date(),
    }
  }

  restoreSnapshot(snapshot: TransactionSnapshot): void {
    ObjectRegistry.clear()
    for (const obj of snapshot.objects) {
      ObjectRegistry.add(obj)
    }
  }

  // --- Запросы ---

  getTransaction(id: UUID): Transaction | undefined {
    return this.transactions.get(id)
  }

  getActiveTransaction(): Transaction | null {
    return this.activeTransaction
  }

  getHistory(limit: number = 50): Transaction[] {
    return Array.from(this.transactions.values())
      .filter(t => t.status === "committed" || t.status === "rolled_back")
      .sort((a, b) => b.startedAt.getTime() - a.startedAt.getTime())
      .slice(0, limit)
  }

  // --- События ---

  on(listener: (event: TransactionEvent) => void): () => void {
    this.listeners.push(listener)
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener)
    }
  }

  // --- Приватные методы ---

  private validateTransaction(txn: Transaction): ValidationResult {
    const errors: string[] = []

    // Валидируем все затронутые объекты
    for (const cmd of txn.commands) {
      if (cmd.type === "modify" && cmd.targetId) {
        const obj = ObjectRegistry.get(cmd.targetId)
        if (obj?.validation) {
          // Здесь будет вызов Rule Engine
          // Пока базовая проверка
          if (obj.identity.type === "breaker" && obj.electrical?.breakerRating) {
            const validRatings = [6, 10, 16, 20, 25, 32, 40, 50, 63]
            if (!validRatings.includes(obj.electrical.breakerRating)) {
              errors.push(`Invalid breaker rating: ${obj.electrical.breakerRating}A`)
            }
          }
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    }
  }

  private applyCommands(txn: Transaction): ApplyResult {
    for (const cmd of txn.commands) {
      try {
        cmd.execute()
      } catch (err) {
        return {
          success: false,
          error: err instanceof Error ? err.message : String(err),
        }
      }
    }
    return { success: true }
  }

  private updateDependencies(txn: Transaction): void {
    // Помечаем грязные объекты
    for (const cmd of txn.commands) {
      if (cmd.targetId) {
        DependencyGraph.markDirty(cmd.targetId)
      }
    }
  }

  private emit(event: TransactionEvent): void {
    for (const listener of this.listeners) {
      listener(event)
    }
  }
}

// ============================================================
// ТИПЫ
// ============================================================

export interface Transaction {
  id: UUID
  description: string
  status: TransactionStatus
  commands: TransactionCommand[]
  snapshotBefore: TransactionSnapshot | null
  snapshotAfter: TransactionSnapshot | null
  startedAt: Date
  completedAt: Date | null
}

export type TransactionStatus =
  | "active"
  | "committed"
  | "rolled_back"

export interface TransactionCommand {
  id: string
  type: "create" | "modify" | "delete"
  targetId?: UUID
  execute: () => void
  undo: () => void
  description?: string
}

export interface TransactionSnapshot {
  objects: UniversalObject[]
  timestamp: Date
}

export interface TransactionResult {
  success: boolean
  transactionId: UUID
  commandCount?: number
  error?: string
}

interface ValidationResult {
  valid: boolean
  errors: string[]
}

interface ApplyResult {
  success: boolean
  error?: string
}

export interface TransactionEvent {
  type: "begun" | "committed" | "rolled_back" | "undone" | "redone"
  transactionId: UUID
  description?: string
  reason?: string
  commandCount?: number
}

// ============================================================
// СИНГЛТОН
// ============================================================

export const TransactionEngine = new TransactionEngineImpl()
