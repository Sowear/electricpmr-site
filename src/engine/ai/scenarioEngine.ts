// ============================================================
// ElectricPMR — Scenario Engine
// ============================================================
//
// Анализ последствий изменений: "Что будет если...?"
//
// Пример: "Заказчик решил поставить тепловой насос"
// → Нужен новый автомат
// → Изменится загрузка фаз
// → Потребуется больше модулей
// → Стоимость увеличится
// → Существующий кабель не подходит
// ============================================================

import type { UUID } from "../types/common"
import { ComponentStore, type ElectricalData } from "../core/ecs"
import { TopologyEngine, type TopologyNode } from "./topologyEngine"
import { DecisionTree } from "./decisionTree"

// ============================================================
// SCENARIO TYPES
// ============================================================

export type ScenarioType =
  | "add_load"           // Добавление нагрузки
  | "remove_load"        // Удаление нагрузки
  | "replace_equipment"  // Замена оборудования
  | "upgrade_service"    // Модернизация ввода
  | "add_source"         // Добавление источника (генератор, солнце, EV)
  | "change_constraints" // Изменение ограничений

export interface Scenario {
  id: UUID
  type: ScenarioType
  name: string
  description: string
  changes: ScenarioChange[]
  timestamp: Date
}

export interface ScenarioChange {
  type: "add" | "remove" | "modify"
  targetType: string
  targetId?: UUID
  description: string
  specs?: Record<string, unknown>
}

export interface ScenarioImpact {
  scenarioId: UUID
  topologyChanges: TopologyChange[]
  loadChanges: LoadChange[]
  costImpact: CostImpact
  constraintViolations: ConstraintViolation[]
  recommendations: string[]
  riskLevel: "low" | "medium" | "high"
}

export interface TopologyChange {
  type: "add_node" | "remove_node" | "upgrade_node" | "add_cable" | "upgrade_cable"
  description: string
  before?: unknown
  after?: unknown
}

export interface LoadChange {
  phase: 1 | 2 | 3
  before: number
  after: number
  delta: number
}

export interface CostImpact {
  materials: number
  installation: number
  total: number
  currency: string
}

export interface ConstraintViolation {
  constraint: string
  message: string
  severity: "error" | "warning"
}

// ============================================================
// SCENARIO ENGINE
// ============================================================

class ScenarioEngineImpl {
  private scenarios: Map<UUID, Scenario> = new Map()

  // --- Создание сценария ---

  createScenario(
    type: ScenarioType,
    name: string,
    description: string,
    changes: ScenarioChange[]
  ): Scenario {
    const id = this.generateId()
    const scenario: Scenario = {
      id,
      type,
      name,
      description,
      changes,
      timestamp: new Date(),
    }

    this.scenarios.set(id, scenario)
    return scenario
  }

  // --- Анализ последствий ---

  analyzeImpact(scenario: Scenario): ScenarioImpact {
    const topology = TopologyEngine.buildTopology("current" as UUID)

    const topologyChanges: TopologyChange[] = []
    const loadChanges: LoadChange[] = []
    const constraintViolations: ConstraintViolation[] = []
    const recommendations: string[] = []

    // Анализируем каждое изменение
    for (const change of scenario.changes) {
      switch (change.type) {
        case "add":
          this.analyzeAddition(change, topology, topologyChanges, loadChanges, recommendations)
          break
        case "remove":
          this.analyzeRemoval(change, topology, topologyChanges, loadChanges, recommendations)
          break
        case "modify":
          this.analyzeModification(change, topology, topologyChanges, loadChanges, recommendations)
          break
      }
    }

    // Рассчитываем стоимость
    const costImpact = this.estimateCostImpact(scenario, topologyChanges)

    // Проверяем ограничения
    this.checkConstraints(topologyChanges, loadChanges, constraintViolations)

    // Определяем уровень риска
    const riskLevel = this.calculateRiskLevel(topologyChanges, loadChanges, constraintViolations)

    return {
      scenarioId: scenario.id,
      topologyChanges,
      loadChanges,
      costImpact,
      constraintViolations,
      recommendations,
      riskLevel,
    }
  }

  private analyzeAddition(
    change: ScenarioChange,
    topology: ReturnType<typeof TopologyEngine.buildTopology>,
    topologyChanges: TopologyChange[],
    loadChanges: LoadChange[],
    recommendations: string[]
  ): void {
    // Определяем тип добавляемого оборудования
    const equipmentType = change.targetType
    const specs = change.specs ?? {}

    // Оцениваем нагрузку
    const estimatedLoad = this.estimateLoad(equipmentType, specs)

    // Находим подходящую группу
    const targetCircuit = this.findBestCircuit(topology, estimatedLoad)

    if (targetCircuit) {
      topologyChanges.push({
        type: "add_node",
        description: `Добавить ${change.description} в группу "${targetCircuit.name}"`,
        after: { load: estimatedLoad, circuit: targetCircuit.name },
      })

      // Проверяем, выдержит ли автомат
      if (targetCircuit.rating && targetCircuit.load) {
        const projectedLoad = (targetCircuit.load + estimatedLoad) / 220
        if (projectedLoad > targetCircuit.rating * 0.9) {
          recommendations.push(
            `Группа "${targetCircuit.name}" будет загружена более чем на 90%. ` +
            `Рекомендуется увеличить номинал автомата или создать отдельную линию.`
          )
        }
      }
    } else {
      // Нужна новая группа
      const newCircuit = this.recommendNewCircuit(equipmentType, estimatedLoad)
      topologyChanges.push({
        type: "add_node",
        description: `Создать новую группу: ${newCircuit.name}`,
        after: newCircuit,
      })

      recommendations.push(
        `Для размещения ${change.description} рекомендуется создать отдельную группу ` +
        `с автоматом ${newCircuit.breakerRating}А и кабелем ${newCircuit.cableSection}мм².`
      )
    }
  }

  private analyzeRemoval(
    change: ScenarioChange,
    topology: ReturnType<typeof TopologyEngine.buildTopology>,
    topologyChanges: TopologyChange[],
    loadChanges: LoadChange[],
    recommendations: string[]
  ): void {
    topologyChanges.push({
      type: "remove_node",
      description: `Удалить ${change.description}`,
    })

    recommendations.push(
      `После удаления ${change.description} рекомендуется перераспределить нагрузку по фазам.`
    )
  }

  private analyzeModification(
    change: ScenarioChange,
    topology: ReturnType<typeof TopologyEngine.buildTopology>,
    topologyChanges: TopologyChange[],
    loadChanges: LoadChange[],
    recommendations: string[]
  ): void {
    topologyChanges.push({
      type: "upgrade_node",
      description: `Модифицировать ${change.description}`,
      before: change.specs?.before,
      after: change.specs?.after,
    })
  }

  private estimateLoad(equipmentType: string, specs: Record<string, unknown>): number {
    const defaultLoads: Record<string, number> = {
      heat_pump: 5000,
      ev_charger: 7400,
      solar_inverter: 5000,
      battery: 3000,
      generator: 5000,
      air_conditioner: 2500,
      electric_stove: 7000,
      water_heater: 2000,
      sauna: 6000,
    }

    return (specs.power as number) ?? defaultLoads[equipmentType] ?? 1000
  }

  private findBestCircuit(
    topology: ReturnType<typeof TopologyEngine.buildTopology>,
    requiredLoad: number
  ): TopologyNode | undefined {
    const circuits = topology.nodes.filter(n => n.type === "circuit")

    // Ищем группу с достаточным запасом
    for (const circuit of circuits) {
      if (circuit.rating && circuit.load) {
        const availableCapacity = circuit.rating * 220 * 0.8 - circuit.load
        if (availableCapacity >= requiredLoad) {
          return circuit
        }
      }
    }

    return undefined
  }

  private recommendNewCircuit(equipmentType: string, load: number): {
    name: string
    breakerRating: number
    cableSection: number
  } {
    const current = load / 220

    let cableSection: number
    let breakerRating: number

    if (current <= 16) {
      cableSection = 2.5
      breakerRating = 16
    } else if (current <= 25) {
      cableSection = 4
      breakerRating = 25
    } else if (current <= 32) {
      cableSection = 6
      breakerRating = 32
    } else {
      cableSection = 10
      breakerRating = 40
    }

    return {
      name: `Новая линия (${equipmentType})`,
      breakerRating,
      cableSection,
    }
  }

  private estimateCostImpact(
    scenario: Scenario,
    topologyChanges: TopologyChange[]
  ): CostImpact {
    let materials = 0
    let installation = 0

    for (const change of topologyChanges) {
      if (change.type === "add_node") {
        materials += 5000 // Упрощённо
        installation += 3000
      } else if (change.type === "upgrade_node") {
        materials += 2000
        installation += 1500
      }
    }

    return {
      materials,
      installation,
      total: materials + installation,
      currency: "RUB",
    }
  }

  private checkConstraints(
    topologyChanges: TopologyChange[],
    loadChanges: LoadChange[],
    violations: ConstraintViolation[]
  ): void {
    // Проверка заполнения щита
    const newNodesCount = topologyChanges.filter(c => c.type === "add_node").length
    if (newNodesCount > 4) {
      violations.push({
        constraint: "panel_capacity",
        message: `Требуется ${newNodesCount} дополнительных модулей в щите`,
        severity: "warning",
      })
    }
  }

  private calculateRiskLevel(
    topologyChanges: TopologyChange[],
    loadChanges: LoadChange[],
    violations: ConstraintViolation[]
  ): "low" | "medium" | "high" {
    const errorCount = violations.filter(v => v.severity === "error").length
    const warningCount = violations.filter(v => v.severity === "warning").length

    if (errorCount > 0) return "high"
    if (warningCount > 2 || topologyChanges.length > 5) return "medium"
    return "low"
  }

  // --- Запросы ---

  getScenario(id: UUID): Scenario | undefined {
    return this.scenarios.get(id)
  }

  getAllScenarios(): Scenario[] {
    return Array.from(this.scenarios.values())
  }

  // --- Утилиты ---

  private generateId(): UUID {
    return `scenario_${Date.now()}_${Math.random().toString(36).slice(2, 9)}` as UUID
  }
}

// ============================================================
// СИНГЛТОН
// ============================================================

export const ScenarioEngine = new ScenarioEngineImpl()
