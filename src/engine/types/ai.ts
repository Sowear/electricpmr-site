// ============================================================
// ElectricPMR Core Types — AI Engine
// ============================================================

import type { UUID } from "./common"
import type { Point } from "./common"

// --- User Task ---

export interface UserTask {
  id: UUID
  type: TaskType
  description: string          // "Добавь розетку в кухню"
  scope?: TaskScope
  constraints?: TaskConstraint[]
  createdAt: Date
}

export type TaskType =
  | "generate"                  // "Построй электрику"
  | "optimize"                  // "Оптимизируй стоимость"
  | "replace"                   // "Замени кабель на более дешёвый"
  | "check"                     // "Проверь ошибки"
  | "explain"                   // "Почему выбран этот автомат?"
  | "modify"                    // "Добавь розетку"
  | "simulate"                  // "Смоделируй нагрузку"
  | "export"                    // "Экспортируй в PDF"

export interface TaskScope {
  type: "project" | "room" | "circuit" | "panel" | "object"
  id?: UUID
}

export interface TaskConstraint {
  field: string
  operator: "eq" | "gt" | "lt" | "gte" | "lte" | "contains"
  value: unknown
}

// --- Task Result ---

export interface TaskResult {
  taskId: UUID
  status: "completed" | "partial" | "failed"
  changes: TaskChange[]
  explanation: string
  alternatives?: TaskAlternative[]
  confidence: number
  requiresConfirmation: boolean
}

export interface TaskChange {
  action: "created" | "modified" | "removed" | "replaced"
  targetType: string
  targetId?: UUID
  before?: unknown
  after?: unknown
  description: string
}

export interface TaskAlternative {
  id: UUID
  description: string
  reason: string
  confidence: number
  preview?: unknown
}

// --- AI Agent Status ---

export type AgentType =
  | "chief_engineer"
  | "architect"
  | "electrical_engineer"
  | "estimator"
  | "purchasing"
  | "qa"
  | "document"
  | "service"

export interface AgentStatus {
  type: AgentType
  name: string
  status: "idle" | "working" | "error"
  lastAction?: string
  lastActionAt?: Date
}

// --- AI Project State ---

export interface AIProjectState {
  lastPlanGeneration?: Date
  lastElectricalGeneration?: Date
  lastValidation?: Date
  lastOptimization?: Date
  totalAIActions: number
  confidence: number           // средняя уверенность AI по проекту
}
