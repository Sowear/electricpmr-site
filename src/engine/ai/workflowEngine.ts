// ============================================================
// ElectricPMR — Workflow Engine
// ============================================================
//
// Проект — это не просто набор объектов.
// Это последовательность инженерных решений.
//
// Workflow Engine управляет процессом проектирования:
// - статусы этапов;
// - контракты входов/выходов;
// - готовность;
// - следующий логичный шаг.
// ============================================================

import type { UUID } from "../types/common"
import { KnowledgeBase } from "./knowledgeBase"

// ============================================================
// WORKFLOW TYPES
// ============================================================

export type StageId =
  | "initial_data"
  | "geometry"
  | "rooms"
  | "furniture"
  | "electrical_points"
  | "circuits"
  | "cable_routes"
  | "panel"
  | "validation"
  | "optimization"
  | "documentation"
  | "complete"

export type StageStatus = "locked" | "available" | "in_progress" | "blocked" | "completed"

export interface WorkflowStage {
  id: StageId
  name: string
  nameRu: string
  description: string
  order: number
  status: StageStatus
  progress: number // 0-100
  confidence: number // 0-100
  dependencies: StageId[]
  inputs: StageContract[]
  outputs: StageContract[]
  completedAt?: Date
  duration?: number // ms
}

export interface StageContract {
  type: string
  description: string
  satisfied: boolean
  details?: string
}

export interface ProjectWorkflow {
  projectId: UUID
  stages: WorkflowStage[]
  currentStage: StageId
  overallProgress: number
  overallConfidence: number
  startedAt: Date
  lastModified: Date
}

// ============================================================
// WORKFLOW ENGINE
// ============================================================

class WorkflowEngineImpl {
  private workflows: Map<UUID, ProjectWorkflow> = new Map()
  private listeners: Array<(event: WorkflowEvent) => void> = []

  // --- Инициализация ---

  initWorkflow(projectId: UUID): ProjectWorkflow {
    const stages = this.createDefaultStages()

    const workflow: ProjectWorkflow = {
      projectId,
      stages,
      currentStage: "initial_data",
      overallProgress: 0,
      overallConfidence: 0,
      startedAt: new Date(),
      lastModified: new Date(),
    }

    this.workflows.set(projectId, workflow)
    this.updateProgress(workflow)

    return workflow
  }

  private createDefaultStages(): WorkflowStage[] {
    return [
      {
        id: "initial_data",
        name: "Initial Data",
        nameRu: "Исходные данные",
        description: "Определение требований: тип здания, количество комнат, бюджет, ограничения",
        order: 0,
        status: "available",
        progress: 0,
        confidence: 0,
        dependencies: [],
        inputs: [],
        outputs: [
          { type: "building_type", description: "Тип здания", satisfied: false },
          { type: "room_count", description: "Количество помещений", satisfied: false },
          { type: "budget", description: "Бюджет", satisfied: false },
          { type: "constraints", description: "Ограничения", satisfied: false },
        ],
      },
      {
        id: "geometry",
        name: "Geometry",
        nameRu: "Геометрия",
        description: "Планировка: стены, двери, окна",
        order: 1,
        status: "locked",
        progress: 0,
        confidence: 0,
        dependencies: ["initial_data"],
        inputs: [
          { type: "building_type", description: "Тип здания", satisfied: false },
        ],
        outputs: [
          { type: "walls", description: "Стены", satisfied: false },
          { type: "doors", description: "Двери", satisfied: false },
          { type: "windows", description: "Окна", satisfied: false },
        ],
      },
      {
        id: "rooms",
        name: "Rooms",
        nameRu: "Помещения",
        description: "Определение помещений: кухня, спальня, ванная и т.д.",
        order: 2,
        status: "locked",
        progress: 0,
        confidence: 0,
        dependencies: ["geometry"],
        inputs: [
          { type: "walls", description: "Стены", satisfied: false },
        ],
        outputs: [
          { type: "room_list", description: "Список помещений", satisfied: false },
          { type: "room_types", description: "Типы помещений", satisfied: false },
        ],
      },
      {
        id: "furniture",
        name: "Furniture",
        nameRu: "Мебель",
        description: "Расстановка мебели для определения позиций розеток и выключателей",
        order: 3,
        status: "locked",
        progress: 0,
        confidence: 0,
        dependencies: ["rooms"],
        inputs: [
          { type: "room_list", description: "Список помещений", satisfied: false },
        ],
        outputs: [
          { type: "furniture_layout", description: "План мебели", satisfied: false },
        ],
      },
      {
        id: "electrical_points",
        name: "Electrical Points",
        nameRu: "Электроточки",
        description: "Размещение розеток, выключателей, светильников, датчиков",
        order: 4,
        status: "locked",
        progress: 0,
        confidence: 0,
        dependencies: ["furniture"],
        inputs: [
          { type: "furniture_layout", description: "План мебели", satisfied: false },
          { type: "room_types", description: "Типы помещений", satisfied: false },
        ],
        outputs: [
          { type: "outlets", description: "Розетки", satisfied: false },
          { type: "switches", description: "Выключатели", satisfied: false },
          { type: "lights", description: "Светильники", satisfied: false },
          { type: "sensors", description: "Датчики", satisfied: false },
        ],
      },
      {
        id: "circuits",
        name: "Circuits",
        nameRu: "Группы",
        description: "Формирование электрических групп: как точки объединяются в линии",
        order: 5,
        status: "locked",
        progress: 0,
        confidence: 0,
        dependencies: ["electrical_points"],
        inputs: [
          { type: "outlets", description: "Розетки", satisfied: false },
          { type: "lights", description: "Светильники", satisfied: false },
        ],
        outputs: [
          { type: "circuit_list", description: "Список групп", satisfied: false },
          { type: "circuit_loads", description: "Нагрузки групп", satisfied: false },
        ],
      },
      {
        id: "cable_routes",
        name: "Cable Routes",
        nameRu: "Кабельные трассы",
        description: "Прокладка кабельных трасс от щита до потребителей",
        order: 6,
        status: "locked",
        progress: 0,
        confidence: 0,
        dependencies: ["circuits"],
        inputs: [
          { type: "circuit_list", description: "Список групп", satisfied: false },
        ],
        outputs: [
          { type: "routes", description: "Трассы", satisfied: false },
          { type: "cable_lengths", description: "Длины кабелей", satisfied: false },
        ],
      },
      {
        id: "panel",
        name: "Panel",
        nameRu: "Щит",
        description: "Компоновка электрощита: автоматы, УЗО, ввод",
        order: 7,
        status: "locked",
        progress: 0,
        confidence: 0,
        dependencies: ["circuits"],
        inputs: [
          { type: "circuit_list", description: "Список групп", satisfied: false },
          { type: "circuit_loads", description: "Нагрузки групп", satisfied: false },
        ],
        outputs: [
          { type: "panel_config", description: "Конфигурация щита", satisfied: false },
          { type: "breaker_list", description: "Список автоматов", satisfied: false },
        ],
      },
      {
        id: "validation",
        name: "Validation",
        nameRu: "Проверка",
        description: "Проверка проекта по нормативам: ПУЭ, СП, селективность",
        order: 8,
        status: "locked",
        progress: 0,
        confidence: 0,
        dependencies: ["panel"],
        inputs: [
          { type: "panel_config", description: "Конфигурация щита", satisfied: false },
        ],
        outputs: [
          { type: "validation_result", description: "Результат проверки", satisfied: false },
        ],
      },
      {
        id: "optimization",
        name: "Optimization",
        nameRu: "Оптимизация",
        description: "Оптимизация: стоимость, длина кабеля, баланс фаз",
        order: 9,
        status: "locked",
        progress: 0,
        confidence: 0,
        dependencies: ["validation"],
        inputs: [
          { type: "validation_result", description: "Результат проверки", satisfied: false },
        ],
        outputs: [
          { type: "optimization_result", description: "Результат оптимизации", satisfied: false },
        ],
      },
      {
        id: "documentation",
        name: "Documentation",
        nameRu: "Документация",
        description: "Генерация документации: спецификация, схема, пояснительная записка",
        order: 10,
        status: "locked",
        progress: 0,
        confidence: 0,
        dependencies: ["optimization"],
        inputs: [
          { type: "optimization_result", description: "Результат оптимизации", satisfied: false },
        ],
        outputs: [
          { type: "specification", description: "Спецификация", satisfied: false },
          { type: "schematic", description: "Схема", satisfied: false },
        ],
      },
      {
        id: "complete",
        name: "Complete",
        nameRu: "Готово",
        description: "Проект завершён и готов к передаче",
        order: 11,
        status: "locked",
        progress: 0,
        confidence: 0,
        dependencies: ["documentation"],
        inputs: [
          { type: "specification", description: "Спецификация", satisfied: false },
        ],
        outputs: [],
      },
    ]
  }

  // --- Управление статусами ---

  getNextStage(projectId: UUID): WorkflowStage | null {
    const workflow = this.workflows.get(projectId)
    if (!workflow) return null

    // Ищем первый доступный этап
    return workflow.stages.find(s => s.status === "available") ?? null
  }

  startStage(projectId: UUID, stageId: StageId): boolean {
    const workflow = this.workflows.get(projectId)
    if (!workflow) return false

    const stage = workflow.stages.find(s => s.id === stageId)
    if (!stage) return false

    // Проверяем зависимости
    const depsSatisfied = stage.dependencies.every(depId => {
      const dep = workflow.stages.find(s => s.id === depId)
      return dep?.status === "completed"
    })

    if (!depsSatisfied) return false

    // Проверяем входные контракты
    const inputsSatisfied = stage.inputs.every(input => input.satisfied)
    if (!inputsSatisfied) return false

    stage.status = "in_progress"
    workflow.currentStage = stageId
    workflow.lastModified = new Date()

    this.emit({ type: "stage_started", projectId, stageId })
    return true
  }

  completeStage(projectId: UUID, stageId: StageId): boolean {
    const workflow = this.workflows.get(projectId)
    if (!workflow) return false

    const stage = workflow.stages.find(s => s.id === stageId)
    if (!stage || stage.status !== "in_progress") return false

    // Проверяем выходные контракты
    const outputsSatisfied = stage.outputs.every(output => output.satisfied)
    if (!outputsSatisfied) return false

    stage.status = "completed"
    stage.completedAt = new Date()
    stage.progress = 100

    // Разблокируем следующие этапы
    this.unlockDependentStages(workflow, stageId)

    // Обновляем прогресс
    this.updateProgress(workflow)

    workflow.lastModified = new Date()

    this.emit({ type: "stage_completed", projectId, stageId })
    return true
  }

  private unlockDependentStages(workflow: ProjectWorkflow, completedStageId: StageId): void {
    for (const stage of workflow.stages) {
      if (stage.status !== "locked") continue

      const allDepsCompleted = stage.dependencies.every(depId => {
        const dep = workflow.stages.find(s => s.id === depId)
        return dep?.status === "completed"
      })

      if (allDepsCompleted) {
        stage.status = "available"
      }
    }
  }

  // --- Прогресс ---

  private updateProgress(workflow: ProjectWorkflow): void {
    const completed = workflow.stages.filter(s => s.status === "completed").length
    const total = workflow.stages.length

    workflow.overallProgress = Math.round((completed / total) * 100)

    // Уверенность — среднее по этапам
    const totalConfidence = workflow.stages.reduce((sum, s) => sum + s.confidence, 0)
    workflow.overallConfidence = Math.round(totalConfidence / total)
  }

  getProgress(projectId: UUID): number {
    return this.workflows.get(projectId)?.overallProgress ?? 0
  }

  getConfidence(projectId: UUID): number {
    return this.workflows.get(projectId)?.overallConfidence ?? 0
  }

  // --- Readiness ---

  getReadiness(projectId: UUID): ReadinessReport {
    const workflow = this.workflows.get(projectId)
    if (!workflow) {
      return { ready: false, percentage: 0, issues: ["Проект не найден"] }
    }

    const issues: string[] = []

    for (const stage of workflow.stages) {
      if (stage.status === "locked") {
        issues.push(`Этап "${stage.nameRu}" заблокирован`)
      }

      // Проверяем невыполненные контракты
      for (const input of stage.inputs) {
        if (!input.satisfied) {
          issues.push(`${stage.nameRu}: нет "${input.description}"`)
        }
      }
    }

    return {
      ready: issues.length === 0,
      percentage: workflow.overallProgress,
      issues,
    }
  }

  // --- Confidence Map ---

  getConfidenceMap(projectId: UUID): ConfidenceMap {
    const workflow = this.workflows.get(projectId)
    if (!workflow) return {}

    const map: ConfidenceMap = {}

    for (const stage of workflow.stages) {
      map[stage.id] = {
        name: stage.nameRu,
        confidence: stage.confidence,
        status: stage.status,
      }
    }

    return map
  }

  // --- Запросы ---

  getWorkflow(projectId: UUID): ProjectWorkflow | undefined {
    return this.workflows.get(projectId)
  }

  getStage(projectId: UUID, stageId: StageId): WorkflowStage | undefined {
    return this.workflows.get(projectId)?.stages.find(s => s.id === stageId)
  }

  // --- События ---

  on(listener: (event: WorkflowEvent) => void): () => void {
    this.listeners.push(listener)
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener)
    }
  }

  private emit(event: WorkflowEvent): void {
    for (const listener of this.listeners) {
      listener(event)
    }
  }
}

// ============================================================
// ТИПЫ
// ============================================================

export interface ReadinessReport {
  ready: boolean
  percentage: number
  issues: string[]
}

export interface ConfidenceMap {
  [stageId: string]: {
    name: string
    confidence: number
    status: StageStatus
  }
}

export interface WorkflowEvent {
  type: "stage_started" | "stage_completed" | "project_completed"
  projectId: UUID
  stageId: StageId
}

// ============================================================
// СИНГЛТОН
// ============================================================

export const WorkflowEngine = new WorkflowEngineImpl()
