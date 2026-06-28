// ============================================================
// ElectricPMR — Audit Log
// ============================================================
//
// Полная история действий: кто, что, когда, почему.
// Не Event Bus History — а именно инженерный аудит.
// ============================================================

import type { UUID } from "../types/common"

// ============================================================
// AUDIT LOG
// ============================================================

class AuditLogImpl {
  private entries: AuditEntry[] = []
  private maxEntries = 10000
  private listeners: Array<(entry: AuditEntry) => void> = []

  // --- Запись ---

  log(event: AuditEvent): AuditEntry {
    const entry: AuditEntry = {
      id: `audit_${Date.now()}_${Math.random().toString(36).slice(2, 9)}` as UUID,
      timestamp: new Date(),
      ...event,
    }

    this.entries.push(entry)

    // Ограничиваем размер
    if (this.entries.length > this.maxEntries) {
      this.entries = this.entries.slice(-this.maxEntries)
    }

    this.emit(entry)
    return entry
  }

  // --- Convenience методы ---

  commandExecuted(
    commandId: string,
    commandType: string,
    source: AuditSource,
    details?: {
      author?: string
      reason?: string
      affectedObjects?: UUID[]
      duration?: number
    }
  ): AuditEntry {
    return this.log({
      type: "command_executed",
      commandId,
      commandType,
      source,
      author: details?.author,
      reason: details?.reason,
      affectedObjects: details?.affectedObjects,
      duration: details?.duration,
    })
  }

  commandRolledBack(
    commandId: string,
    commandType: string,
    source: AuditSource,
    reason?: string
  ): AuditEntry {
    return this.log({
      type: "command_rolled_back",
      commandId,
      commandType,
      source,
      reason,
    })
  }

  transactionCommitted(
    transactionId: UUID,
    commandCount: number,
    source: AuditSource
  ): AuditEntry {
    return this.log({
      type: "transaction_committed",
      transactionId,
      commandCount,
      source,
    })
  }

  transactionRolledBack(
    transactionId: UUID,
    reason?: string
  ): AuditEntry {
    return this.log({
      type: "transaction_rolled_back",
      transactionId,
      reason,
    })
  }

  projectSaved(
    projectPath: string,
    objectCount: number
  ): AuditEntry {
    return this.log({
      type: "project_saved",
      projectPath,
      objectCount,
    })
  }

  projectLoaded(
    projectPath: string,
    objectCount: number,
    duration: number
  ): AuditEntry {
    return this.log({
      type: "project_loaded",
      projectPath,
      objectCount,
      duration,
    })
  }

  validationPerformed(
    objectCount: number,
    errorCount: number,
    warningCount: number,
    duration: number
  ): AuditEntry {
    return this.log({
      type: "validation_performed",
      objectCount,
      errorCount,
      warningCount,
      duration,
    })
  }

  aiAction(
    action: string,
    toolName: string,
    confidence: number,
    affectedObjects: UUID[]
  ): AuditEntry {
    return this.log({
      type: "ai_action",
      action,
      toolName,
      confidence,
      affectedObjects,
      source: "ai",
    })
  }

  error(
    message: string,
    context?: string,
    stack?: string
  ): AuditEntry {
    return this.log({
      type: "error",
      message,
      context,
      stack,
    })
  }

  // --- Запросы ---

  getEntries(filter?: AuditFilter): AuditEntry[] {
    let result = [...this.entries]

    if (filter?.type) {
      result = result.filter(e => e.type === filter.type)
    }

    if (filter?.source) {
      result = result.filter(e => e.source === filter.source)
    }

    if (filter?.author) {
      result = result.filter(e => e.author === filter.author)
    }

    if (filter?.since) {
      result = result.filter(e => e.timestamp >= filter.since!)
    }

    if (filter?.until) {
      result = result.filter(e => e.timestamp <= filter.until!)
    }

    if (filter?.limit) {
      result = result.slice(-filter.limit)
    }

    return result
  }

  getCommandHistory(commandId: string): AuditEntry[] {
    return this.entries.filter(
      e => (e.type === "command_executed" || e.type === "command_rolled_back") &&
           (e as CommandAuditEntry).commandId === commandId
    )
  }

  getObjectHistory(objectId: UUID): AuditEntry[] {
    return this.entries.filter(e => {
      if ("affectedObjects" in e) {
        return (e as CommandAuditEntry).affectedObjects?.includes(objectId)
      }
      return false
    })
  }

  // --- Статистика ---

  getStats(): AuditStats {
    const byType: Partial<Record<AuditEventType, number>> = {}
    const bySource: Partial<Record<AuditSource, number>> = {}

    for (const entry of this.entries) {
      byType[entry.type] = (byType[entry.type] ?? 0) + 1
      if (entry.source) {
        bySource[entry.source] = (bySource[entry.source] ?? 0) + 1
      }
    }

    return {
      totalEntries: this.entries.length,
      byType,
      bySource,
      oldestEntry: this.entries[0]?.timestamp,
      newestEntry: this.entries[this.entries.length - 1]?.timestamp,
    }
  }

  // --- Очистка ---

  clear(): void {
    this.entries = []
  }

  // --- Экспорт ---

  exportJSON(): string {
    return JSON.stringify(this.entries, null, 2)
  }

  // --- События ---

  on(listener: (entry: AuditEntry) => void): () => void {
    this.listeners.push(listener)
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener)
    }
  }

  private emit(entry: AuditEntry): void {
    for (const listener of this.listeners) {
      listener(entry)
    }
  }
}

// ============================================================
// ТИПЫ
// ============================================================

export type AuditSource = "user" | "ai" | "plugin" | "import" | "migration" | "system"

export type AuditEventType =
  | "command_executed"
  | "command_rolled_back"
  | "transaction_committed"
  | "transaction_rolled_back"
  | "project_saved"
  | "project_loaded"
  | "validation_performed"
  | "ai_action"
  | "error"

export interface AuditEntry {
  id: UUID
  timestamp: Date
  type: AuditEventType
  source?: AuditSource
  author?: string
  reason?: string
}

export interface CommandAuditEntry extends AuditEntry {
  type: "command_executed" | "command_rolled_back"
  commandId: string
  commandType: string
  source: AuditSource
  affectedObjects?: UUID[]
  duration?: number
}

export interface TransactionAuditEntry extends AuditEntry {
  type: "transaction_committed" | "transaction_rolled_back"
  transactionId: UUID
  commandCount?: number
  reason?: string
}

export interface ProjectAuditEntry extends AuditEntry {
  type: "project_saved" | "project_loaded"
  projectPath: string
  objectCount: number
  duration?: number
}

export interface ValidationAuditEntry extends AuditEntry {
  type: "validation_performed"
  objectCount: number
  errorCount: number
  warningCount: number
  duration: number
}

export interface AIAuditEntry extends AuditEntry {
  type: "ai_action"
  action: string
  toolName: string
  confidence: number
  affectedObjects: UUID[]
  source: "ai"
}

export interface ErrorAuditEntry extends AuditEntry {
  type: "error"
  message: string
  context?: string
  stack?: string
}

export type AuditEvent = Omit<AuditEntry, "id" | "timestamp"> & {
  type: AuditEventType
}

export interface AuditFilter {
  type?: AuditEventType
  source?: AuditSource
  author?: string
  since?: Date
  until?: Date
  limit?: number
}

export interface AuditStats {
  totalEntries: number
  byType: Partial<Record<AuditEventType, number>>
  bySource: Partial<Record<AuditSource, number>>
  oldestEntry?: Date
  newestEntry?: Date
}

// ============================================================
// СИНГЛТОН
// ============================================================

export const AuditLog = new AuditLogImpl()
