// ============================================================
// ElectricPMR — Tool Registry
// ============================================================
//
// Все инструменты, которые AI может вызывать.
// LLM никогда не меняет проект напрямую — только через туты.
// ============================================================

import type { AIToolDefinition, AIToolResult, ToolSideEffect } from "./types"
import type { UUID, Point } from "../types/common"
import type { ElectricalPoint } from "../types/electrical"

// ============================================================
// TOOL REGISTRY
// ============================================================

class ToolRegistryImpl {
  private tools: Map<string, RegisteredTool> = new Map()
  private executionLog: ToolExecution[] = []

  // --- Регистрация ---

  register(tool: AIToolDefinition, executor: ToolExecutor): void {
    this.tools.set(tool.name, { definition: tool, executor })
  }

  get(name: string): RegisteredTool | undefined {
    return this.tools.get(name)
  }

  getAll(): AIToolDefinition[] {
    return Array.from(this.tools.values()).map(t => t.definition)
  }

  getByCategory(category: AIToolDefinition["category"]): AIToolDefinition[] {
    return this.getAll().filter(t => t.category === category)
  }

  // --- Выполнение ---

  async execute(name: string, params: Record<string, unknown>): Promise<AIToolResult> {
    const registered = this.tools.get(name)
    if (!registered) {
      return { success: false, error: `Tool "${name}" not found` }
    }

    // Валидация параметров
    const validationError = this.validateParams(registered.definition, params)
    if (validationError) {
      return { success: false, error: validationError }
    }

    // Выполнение
    const startTime = Date.now()
    try {
      const result = await registered.executor(params)
      const duration = Date.now() - startTime

      this.executionLog.push({
        toolName: name,
        params,
        result,
        duration,
        timestamp: new Date(),
      })

      return result
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : String(err),
      }
    }
  }

  // --- Лог ---

  getExecutionLog(): ToolExecution[] {
    return [...this.executionLog]
  }

  clearLog(): void {
    this.executionLog = []
  }

  // --- Валидация параметров ---

  private validateParams(definition: AIToolDefinition, params: Record<string, unknown>): string | null {
    for (const param of definition.parameters) {
      if (param.required && !(param.name in params)) {
        return `Missing required parameter: ${param.name}`
      }
      if (param.enum && params[param.name] && !param.enum.includes(params[param.name] as string)) {
        return `Invalid value for ${param.name}: ${params[param.name]}. Allowed: ${param.enum.join(", ")}`
      }
    }
    return null
  }
}

// ============================================================
// ТИПЫ
// ============================================================

type ToolExecutor = (params: Record<string, unknown>) => Promise<AIToolResult>

interface RegisteredTool {
  definition: AIToolDefinition
  executor: ToolExecutor
}

interface ToolExecution {
  toolName: string
  params: Record<string, unknown>
  result: AIToolResult
  duration: number
  timestamp: Date
}

// ============================================================
// СИНГЛТОН
// ============================================================

export const ToolRegistry = new ToolRegistryImpl()

// ============================================================
// СТАНДАРТНЫЕ ИНСТРУМЕНТЫ
// ============================================================

export function registerDefaultTools(): void {
  // --- ГЕОМЕТРИЯ ---

  ToolRegistry.register(
    {
      name: "createWall",
      description: "Создать стену между двумя точками",
      category: "geometry",
      parameters: [
        { name: "x1", type: "number", description: "X начальной точки (мм)", required: true },
        { name: "y1", type: "number", description: "Y начальной точки (мм)", required: true },
        { name: "x2", type: "number", description: "X конечной точки (мм)", required: true },
        { name: "y2", type: "number", description: "Y конечной точки (мм)", required: true },
        { name: "thickness", type: "number", description: "Толщина (мм, по умолчанию 200)", required: false },
        { name: "material", type: "string", description: "Материал", required: false, enum: ["brick", "concrete", "drywall", "wood", "glass", "stone", "aerated_concrete"] },
      ],
    },
    async (params) => ({
      success: true,
      data: { type: "wall", points: [{ x: params.x1, y: params.y1 }, { x: params.x2, y: params.y2 }] },
      sideEffects: [{ type: "created", targetType: "wall", targetId: "pending", description: "Стена создана" }],
    })
  )

  // --- ЭЛЕКТРИКА ---

  ToolRegistry.register(
    {
      name: "createOutlet",
      description: "Добавить розетку в указанную позицию",
      category: "electrical",
      parameters: [
        { name: "x", type: "number", description: "X позиция (мм)", required: true },
        { name: "y", type: "number", description: "Y позиция (мм)", required: true },
        { name: "subtype", type: "string", description: "Тип розетки", required: false, enum: ["outlet", "outlet_waterproof", "outlet_triple"] },
        { name: "mountingHeight", type: "number", description: "Высота установки (мм)", required: false },
        { name: "name", type: "string", description: "Название", required: false },
      ],
    },
    async (params) => ({
      success: true,
      data: { type: params.subtype ?? "outlet", position: { x: params.x, y: params.y } },
      sideEffects: [{ type: "created", targetType: "outlet", targetId: "pending", description: "Розетка создана" }],
    })
  )

  ToolRegistry.register(
    {
      name: "createLight",
      description: "Добавить светильник",
      category: "electrical",
      parameters: [
        { name: "x", type: "number", description: "X позиция (мм)", required: true },
        { name: "y", type: "number", description: "Y позиция (мм)", required: true },
        { name: "subtype", type: "string", description: "Тип светильника", required: false, enum: ["light_ceiling", "light_wall", "light_spot", "light_strip"] },
        { name: "name", type: "string", description: "Название", required: false },
      ],
    },
    async (params) => ({
      success: true,
      data: { type: params.subtype ?? "light_ceiling", position: { x: params.x, y: params.y } },
      sideEffects: [{ type: "created", targetType: "light", targetId: "pending", description: "Светильник создан" }],
    })
  )

  ToolRegistry.register(
    {
      name: "createSwitch",
      description: "Добавить выключатель",
      category: "electrical",
      parameters: [
        { name: "x", type: "number", description: "X позиция (мм)", required: true },
        { name: "y", type: "number", description: "Y позиция (мм)", required: true },
        { name: "subtype", type: "string", description: "Тип выключателя", required: false, enum: ["switch", "switch_pass_through", "dimmer"] },
        { name: "name", type: "string", description: "Название", required: false },
      ],
    },
    async (params) => ({
      success: true,
      data: { type: params.subtype ?? "switch", position: { x: params.x, y: params.y } },
      sideEffects: [{ type: "created", targetType: "switch", targetId: "pending", description: "Выключатель создан" }],
    })
  )

  ToolRegistry.register(
    {
      name: "createPanel",
      description: "Создать электрощит",
      category: "electrical",
      parameters: [
        { name: "x", type: "number", description: "X позиция (мм)", required: true },
        { name: "y", type: "number", description: "Y позиция (мм)", required: true },
        { name: "name", type: "string", description: "Название щита", required: false },
      ],
    },
    async (params) => ({
      success: true,
      data: { type: "panel", position: { x: params.x, y: params.y }, name: params.name ?? "Щит" },
      sideEffects: [{ type: "created", targetType: "panel", targetId: "pending", description: "Щит создан" }],
    })
  )

  // --- РАСЧЁТЫ ---

  ToolRegistry.register(
    {
      name: "validateProject",
      description: "Проверить проект на ошибки и нарушения нормативов",
      category: "validation",
      parameters: [],
    },
    async () => ({
      success: true,
      data: { validated: true },
    })
  )

  ToolRegistry.register(
    {
      name: "calculateLoad",
      description: "Рассчитать нагрузку на группу или весь проект",
      category: "calculation",
      parameters: [
        { name: "scope", type: "string", description: "Область расчёта", required: false, enum: ["project", "circuit", "room"] },
        { name: "targetId", type: "string", description: "ID группы или комнаты", required: false },
      ],
    },
    async (params) => ({
      success: true,
      data: { scope: params.scope ?? "project", calculated: true },
    })
  )

  // --- ПОИСК ---

  ToolRegistry.register(
    {
      name: "searchLibrary",
      description: "Поиск объектов в библиотеке",
      category: "search",
      parameters: [
        { name: "query", type: "string", description: "Поисковый запрос", required: true },
      ],
    },
    async (params) => ({
      success: true,
      data: { query: params.query, results: [] },
    })
  )

  // --- ДОКУМЕНТЫ ---

  ToolRegistry.register(
    {
      name: "exportPDF",
      description: "Экспортировать проект в PDF",
      category: "document",
      parameters: [
        { name: "include", type: "array", description: "Что включить в PDF", required: false },
      ],
    },
    async () => ({
      success: true,
      data: { exported: true, format: "pdf" },
    })
  )
}
