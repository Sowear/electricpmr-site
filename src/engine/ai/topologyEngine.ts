// ============================================================
// ElectricPMR — Electrical Topology Engine
// ============================================================
//
// Граф энергоснабжения — не набор объектов, а единая модель
// электрической сети от ввода до потребителя.
//
// Ввод → УЗИП → Вводной автомат → Счётчик → УЗО → Группы → Линии → Потребители
// ============================================================

import type { UUID } from "../types/common"
import { ComponentStore, type ElectricalData } from "../core/ecs"

// ============================================================
// TOPOLOGY TYPES
// ============================================================

export type TopologyNodeType =
  | "service_entry"     // Точка ввода СН
  | "main_breaker"      // Вводной автомат
  | "meter"             // Счётчик
  | "surge_protection"  // УЗИП
  | "main_rcd"          // УЗО на вводе
  | "distribution_panel" // Распределительный щит
  | "sub_panel"         // Подщит
  | "circuit_breaker"   // Автомат группы
  | "rcd"               // УЗО группы
  | "rcbo"              // АВДТ
  | "circuit"           // Группа (линия)
  | "outlet"            // Розетка
  | "light"             // Светильник
  | "appliance"         // Прибор
  | "junction_box"      // Распаечная коробка
  | "cable_tray"        // Кабельный лоток
  | "ev_charger"        // EV-зарядка
  | "solar_inverter"    // Инвертор солнечных панелей
  | "battery"           // Аккумулятор
  | "ups"               // ИБП
  | "generator"         // Генератор

export type TopologyNodeType2 = "single_phase" | "three_phase"

export interface TopologyNode {
  id: UUID
  type: TopologyNodeType
  name: string
  phase: 1 | 2 | 3 | 123 // 123 = three-phase
  rating?: number // А (для автоматов, УЗО)
  load?: number // Вт
  voltageDrop?: number // %
  position?: { x: number; y: number }
  metadata?: Record<string, unknown>
}

export interface TopologyEdge {
  id: UUID
  from: UUID
  to: UUID
  type: "power" | "protection" | "control"
  cableSection?: number // мм²
  cableLength?: number // м
}

export interface TopologyTree {
  root: TopologyNode
  nodes: TopologyNode[]
  edges: TopologyEdge[]
  depth: number
  totalLoad: number
  phases: { L1: number; L2: number; L3: number }
}

// ============================================================
// TOPOLOGY ENGINE
// ============================================================

class TopologyEngineImpl {
  private nodes: Map<UUID, TopologyNode> = new Map()
  private edges: Map<UUID, TopologyEdge> = new Map()
  private adjacency: Map<UUID, UUID[]> = new Map()
  private reverseAdj: Map<UUID, UUID[]> = new Map()

  // --- Построение топологии ---

  buildTopology(projectId: UUID): TopologyTree {
    this.clear()

    // 1. Создаём узлы из компонентов
    this.createNodesFromComponents()

    // 2. Создаём связи изRelationships
    this.createEdgesFromRelationships()

    // 3. Строим дерево от ввода
    const root = this.findServiceEntry()

    if (!root) {
      // Если нет ввода — создаём дефолтную структуру
      return this.createDefaultTopology()
    }

    // 4. Рассчитываем нагрузки
    this.calculateLoads(root.id)

    // 5. Собираем результат
    return this.assembleTree(root)
  }

  private createNodesFromComponents(): void {
    // Ввод
    const entities = ComponentStore.getAllEntities()
    for (const id of entities) {
      const identity = ComponentStore.getComponent(id, "identity")
      const electrical = ComponentStore.getComponent(id, "electrical")
      if (!identity) continue

      const type = this.mapToTopologyType(identity.type)
      if (!type) continue

      const node: TopologyNode = {
        id,
        type,
        name: identity.name,
        phase: electrical?.phase ?? 1,
        rating: electrical?.breakerRating,
        load: electrical?.power,
      }

      this.nodes.set(id, node)
    }
  }

  private createEdgesFromRelationships(): void {
    // Преобразуем relationships в edges
    const entities = ComponentStore.getAllEntities()
    for (const id of entities) {
      const rels = ComponentStore.getComponent(id, "relationships")
      if (!rels) continue

      // connectedTo → power edge
      for (const targetId of rels.connectedTo) {
        if (this.nodes.has(targetId)) {
          const edge: TopologyEdge = {
            id: `edge_${id}_${targetId}` as UUID,
            from: id,
            to: targetId,
            type: "power",
          }
          this.edges.set(edge.id, edge)
          this.addToAdjacency(this.adjacency, id, targetId)
          this.addToAdjacency(this.reverseAdj, targetId, id)
        }
      }

      // belongsTo → parent edge
      if (rels.belongsTo && this.nodes.has(rels.belongsTo)) {
        const edge: TopologyEdge = {
          id: `edge_${id}_${rels.belongsTo}` as UUID,
          from: rels.belongsTo,
          to: id,
          type: "power",
        }
        this.edges.set(edge.id, edge)
        this.addToAdjacency(this.adjacency, rels.belongsTo, id)
        this.addToAdjacency(this.reverseAdj, id, rels.belongsTo)
      }
    }
  }

  private findServiceEntry(): TopologyNode | undefined {
    return Array.from(this.nodes.values()).find(n => n.type === "service_entry")
  }

  private createDefaultTopology(): TopologyTree {
    // Создаём стандартную топологию для однокомнатной квартиры
    const serviceEntry = this.createNode("service_entry", "Ввод", 123)
    const mainBreaker = this.createNode("main_breaker", "Вводной автомат", 123, 32)
    const meter = this.createNode("meter", "Счётчик", 123)
    const mainRcd = this.createNode("main_rcd", "УЗО вводное", 123, 25)
    const panel = this.createNode("distribution_panel", "Щит", 123)

    // Группы
    const lighting = this.createNode("circuit", "Освещение", 1, 10)
    const outletsLiving = this.createNode("circuit", "Розетки гостиная", 1, 16)
    const outletsKitchen = this.createNode("circuit", "Розетки кухня", 1, 16)
    const stove = this.createNode("circuit", "Электроплита", 1, 32)
    const bathroom = this.createNode("circuit", "Ванная", 1, 10)

    // Связи
    this.createEdge(serviceEntry.id, mainBreaker.id, "power")
    this.createEdge(mainBreaker.id, meter.id, "power")
    this.createEdge(meter.id, mainRcd.id, "power")
    this.createEdge(mainRcd.id, panel.id, "power")
    this.createEdge(panel.id, lighting.id, "power")
    this.createEdge(panel.id, outletsLiving.id, "power")
    this.createEdge(panel.id, outletsKitchen.id, "power")
    this.createEdge(panel.id, stove.id, "power")
    this.createEdge(panel.id, bathroom.id, "power")

    // Нагрузки
    lighting.load = 800
    outletsLiving.load = 3500
    outletsKitchen.load = 3500
    stove.load = 7000
    bathroom.load = 2200

    return this.assembleTree(serviceEntry)
  }

  private createNode(
    type: TopologyNodeType,
    name: string,
    phase: 1 | 2 | 3 | 123,
    rating?: number
  ): TopologyNode {
    const id = `topo_${Date.now()}_${Math.random().toString(36).slice(2, 9)}` as UUID
    const node: TopologyNode = { id, type, name, phase, rating }
    this.nodes.set(id, node)
    return node
  }

  private createEdge(from: UUID, to: UUID, type: "power" | "protection" | "control"): TopologyEdge {
    const id = `edge_${from}_${to}` as UUID
    const edge: TopologyEdge = { id, from, to, type }
    this.edges.set(id, edge)
    this.addToAdjacency(this.adjacency, from, to)
    this.addToAdjacency(this.reverseAdj, to, from)
    return edge
  }

  private addToAdjacency(adj: Map<UUID, UUID[]>, from: UUID, to: UUID): void {
    if (!adj.has(from)) adj.set(from, [])
    adj.get(from)!.push(to)
  }

  // --- Расчёт нагрузок ---

  private calculateLoads(rootId: UUID): void {
    const visited = new Set<UUID>()

    const dfs = (nodeId: UUID): number => {
      if (visited.has(nodeId)) return 0
      visited.add(nodeId)

      const node = this.nodes.get(nodeId)
      if (!node) return 0

      // Суммируем нагрузки потомков
      const children = this.adjacency.get(nodeId) ?? []
      let totalChildLoad = 0
      for (const childId of children) {
        totalChildLoad += dfs(childId)
      }

      // Если у узла нет своей нагрузки — берём сумму потомков
      if (!node.load || node.load === 0) {
        node.load = totalChildLoad
      }

      return node.load
    }

    dfs(rootId)
  }

  // --- Сборка дерева ---

  private assembleTree(root: TopologyNode): TopologyTree {
    const nodes = Array.from(this.nodes.values())
    const edges = Array.from(this.edges.values())

    // Находим глубину
    const depth = this.calculateDepth(root.id)

    // Считаем общую нагрузку и фазы
    const totalLoad = nodes.reduce((sum, n) => sum + (n.load ?? 0), 0)
    const phases = this.calculatePhaseBalance(nodes)

    return {
      root,
      nodes,
      edges,
      depth,
      totalLoad,
      phases,
    }
  }

  private calculateDepth(nodeId: UUID, visited = new Set<UUID>()): number {
    if (visited.has(nodeId)) return 0
    visited.add(nodeId)

    const children = this.adjacency.get(nodeId) ?? []
    if (children.length === 0) return 0

    return 1 + Math.max(...children.map(c => this.calculateDepth(c, new Set(visited))))
  }

  private calculatePhaseBalance(nodes: TopologyNode[]): { L1: number; L2: number; L3: number } {
    const phases = { L1: 0, L2: 0, L3: 0 }

    for (const node of nodes) {
      if (!node.load) continue

      switch (node.phase) {
        case 1: phases.L1 += node.load; break
        case 2: phases.L2 += node.load; break
        case 3: phases.L3 += node.load; break
        default: // 123 = распределяем равномерно
          phases.L1 += node.load / 3
          phases.L2 += node.load / 3
          phases.L3 += node.load / 3
      }
    }

    return phases
  }

  // --- Анализ топологии ---

  getSelectablePath(from: UUID, to: UUID): TopologyNode[] {
    // BFS для поиска пути
    const visited = new Set<UUID>()
    const queue: Array<{ id: UUID; path: TopologyNode[] }> = [
      { id: from, path: [] }
    ]

    while (queue.length > 0) {
      const { id, path } = queue.shift()!
      if (id === to) return path
      if (visited.has(id)) continue
      visited.add(id)

      const node = this.nodes.get(id)
      if (node) {
        const children = this.adjacency.get(id) ?? []
        for (const childId of children) {
          queue.push({
            id: childId,
            path: [...path, node],
          })
        }
      }
    }

    return []
  }

  findBreakersForCircuit(circuitId: UUID): TopologyNode[] {
    const path = this.getSelectablePath(this.findServiceEntry()?.id ?? circuitId, circuitId)
    return path.filter(n =>
      n.type === "circuit_breaker" ||
      n.type === "rcd" ||
      n.type === "rcbo" ||
      n.type === "main_breaker" ||
      n.type === "main_rcd"
    )
  }

  // --- Валидация топологии ---

  validate(): TopologyValidation {
    const issues: TopologyIssue[] = []

    // Проверка наличия ввода
    const serviceEntry = this.findServiceEntry()
    if (!serviceEntry) {
      issues.push({
        severity: "error",
        message: "Отсутствует точка ввода электроснабжения",
        type: "missing_service_entry",
      })
    }

    // Проверка селективности
    const breakers = Array.from(this.nodes.values()).filter(
      n => n.type === "circuit_breaker" || n.type === "main_breaker"
    )

    for (const breaker of breakers) {
      if (!breaker.rating) {
        issues.push({
          severity: "warning",
          message: `Автомат ${breaker.name} без номинала`,
          type: "missing_rating",
        })
      }
    }

    // Проверка перегрузки
    for (const node of this.nodes.values()) {
      if (node.type === "circuit_breaker" && node.rating && node.load) {
        if (node.load / 220 > node.rating * 0.9) {
          issues.push({
            severity: "warning",
            message: `Автомат ${node.name} загружен более чем на 90%`,
            type: "overload_risk",
          })
        }
      }
    }

    return {
      valid: issues.filter(i => i.severity === "error").length === 0,
      issues,
    }
  }

  // --- Экспорт ---

  toDOT(): string {
    const lines: string[] = ["digraph topology {"]

    for (const node of this.nodes.values()) {
      const label = `${node.name}\\n${node.type}\\n${node.rating ? node.rating + "А" : ""}`
      lines.push(`  "${node.id}" [label="${label}" shape=box];`)
    }

    for (const edge of this.edges.values()) {
      lines.push(`  "${edge.from}" -> "${edge.to}";`)
    }

    lines.push("}")
    return lines.join("\n")
  }

  // --- Утилиты ---

  private mapToTopologyType(objectType: string): TopologyNodeType | null {
    const mapping: Record<string, TopologyNodeType> = {
      panel: "distribution_panel",
      breaker: "circuit_breaker",
      rcd: "rcd",
      rcbo: "rcbo",
      outlet: "outlet",
      light_ceiling: "light",
      light_wall: "light",
      light_spot: "light",
      switch: "outlet",
      sensor_smoke: "appliance",
      appliance: "appliance",
      junction_box: "junction_box",
    }
    return mapping[objectType] ?? null
  }

  getNodes(): TopologyNode[] {
    return Array.from(this.nodes.values())
  }

  getEdges(): TopologyEdge[] {
    return Array.from(this.edges.values())
  }

  getNode(id: UUID): TopologyNode | undefined {
    return this.nodes.get(id)
  }

  clear(): void {
    this.nodes.clear()
    this.edges.clear()
    this.adjacency.clear()
    this.reverseAdj.clear()
  }
}

// ============================================================
// ТИПЫ
// ============================================================

export interface TopologyValidation {
  valid: boolean
  issues: TopologyIssue[]
}

export interface TopologyIssue {
  severity: "error" | "warning" | "info"
  message: string
  type: string
}

// ============================================================
// СИНГЛТОН
// ============================================================

export const TopologyEngine = new TopologyEngineImpl()
