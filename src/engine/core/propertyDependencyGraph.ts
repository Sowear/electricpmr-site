// ============================================================
// ElectricPMR — Property-level Dependency Graph
// ============================================================
//
// Зависимости между свойствами объектов, а не между объектами.
//
// Пример:
//   Outlet.power → Circuit.load → Breaker.rating → Panel.width
//
// Это значительно уменьшает количество пересчётов.
// ============================================================

import type { UUID } from "../types/common"
import { ComponentStore, type ComponentName } from "./ecs"

// ============================================================
// PROPERTY PATH
// ============================================================

// Путь к свойству: "entityId.componentName.propertyName"
export type PropertyPath = string

// ============================================================
// DEPENDENCY EDGE
// ============================================================

export interface PropertyDependency {
  from: PropertyPath    // Что зависит
  to: PropertyPath      // От чего зависит
  type: DependencyType
  description?: string
}

export type DependencyType =
  | "calculation"    // Вычисляемая зависимость
  | "validation"     // Валидационная зависимость
  | "display"        // Визуальная зависимость
  | "aggregate"      // Агрегационная зависимость

// ============================================================
// PROPERTY DEPENDENCY GRAPH
// ============================================================

class PropertyDependencyGraphImpl {
  private dependencies: PropertyDependency[] = []
  private forwardAdj: Map<PropertyPath, PropertyPath[]> = new Map()
  private reverseAdj: Map<PropertyPath, PropertyPath[]> = new Map()
  private dirtyProperties: Set<PropertyPath> = new Set()
  private recalcOrder: PropertyPath[] = []

  // --- Построение графа ---

  addDependency(dep: PropertyDependency): void {
    this.dependencies.push(dep)
    this.addToAdj(this.forwardAdj, dep.from, dep.to)
    this.addToAdj(this.reverseAdj, dep.to, dep.from)
  }

  removeDependency(from: PropertyPath, to: PropertyPath): void {
    this.dependencies = this.dependencies.filter(
      d => !(d.from === from && d.to === to)
    )
    this.removeFromAdj(this.forwardAdj, from, to)
    this.removeFromAdj(this.reverseAdj, to, from)
  }

  // --- Запросы ---

  // От чего зависит свойство
  getDependencies(propertyPath: PropertyPath): PropertyPath[] {
    return this.forwardAdj.get(propertyPath) ?? []
  }

  // Что зависит от свойства
  getDependents(propertyPath: PropertyPath): PropertyPath[] {
    return this.reverseAdj.get(propertyPath) ?? []
  }

  // Все косвенные зависимости
  getAllDependencies(propertyPath: PropertyPath, maxDepth: number = 10): PropertyPath[] {
    const result = new Set<PropertyPath>()
    const queue: Array<{ path: PropertyPath; depth: number }> = [
      { path: propertyPath, depth: 0 }
    ]

    while (queue.length > 0) {
      const { path, depth } = queue.shift()!
      if (depth >= maxDepth) continue

      for (const dep of this.getDependencies(path)) {
        if (!result.has(dep)) {
          result.add(dep)
          queue.push({ path: dep, depth: depth + 1 })
        }
      }
    }

    return Array.from(result)
  }

  // Все косвенные зависимые
  getAllDependents(propertyPath: PropertyPath, maxDepth: number = 10): PropertyPath[] {
    const result = new Set<PropertyPath>()
    const queue: Array<{ path: PropertyPath; depth: number }> = [
      { path: propertyPath, depth: 0 }
    ]

    while (queue.length > 0) {
      const { path, depth } = queue.shift()!
      if (depth >= maxDepth) continue

      for (const dep of this.getDependents(path)) {
        if (!result.has(dep)) {
          result.add(dep)
          queue.push({ path: dep, depth: depth + 1 })
        }
      }
    }

    return Array.from(result)
  }

  // --- Обнаружение циклов ---

  detectCycles(): PropertyPath[][] {
    const cycles: PropertyPath[][] = []
    const visited = new Set<PropertyPath>()
    const inStack = new Set<PropertyPath>()
    const path: PropertyPath[] = []

    const dfs = (node: PropertyPath): void => {
      if (inStack.has(node)) {
        const cycleStart = path.indexOf(node)
        cycles.push(path.slice(cycleStart).concat(node))
        return
      }
      if (visited.has(node)) return

      visited.add(node)
      inStack.add(node)
      path.push(node)

      for (const dep of this.getDependencies(node)) {
        dfs(dep)
      }

      path.pop()
      inStack.delete(node)
    }

    // Собираем все уникальные пути
    const allPaths = new Set<PropertyPath>()
    for (const dep of this.dependencies) {
      allPaths.add(dep.from)
      allPaths.add(dep.to)
    }

    for (const path of allPaths) {
      dfs(path)
    }

    return cycles
  }

  // --- Топологическая сортировка ---

  topologicalSort(): PropertyPath[] {
    const visited = new Set<PropertyPath>()
    const sorted: PropertyPath[] = []

    const visit = (node: PropertyPath): void => {
      if (visited.has(node)) return
      visited.add(node)

      for (const dep of this.getDependencies(node)) {
        visit(dep)
      }

      sorted.push(node)
    }

    const allPaths = new Set<PropertyPath>()
    for (const dep of this.dependencies) {
      allPaths.add(dep.from)
      allPaths.add(dep.to)
    }

    for (const path of allPaths) {
      visit(path)
    }

    return sorted
  }

  // --- Mark Dirty + Recalculation Plan ---

  markDirty(propertyPath: PropertyPath): void {
    this.dirtyProperties.add(propertyPath)

    // Помечаем все зависимые свойства как грязные
    const dependents = this.getAllDependents(propertyPath)
    for (const dep of dependents) {
      this.dirtyProperties.add(dep)
    }
  }

  getDirtyProperties(): PropertyPath[] {
    return Array.from(this.dirtyProperties)
  }

  clearDirty(): void {
    this.dirtyProperties.clear()
  }

  // Получить порядок пересчёта (топологическая сортировка грязных)
  getRecalculationOrder(): PropertyPath[] {
    const dirty = this.dirtyProperties
    const sorted: PropertyPath[] = []
    const visited = new Set<PropertyPath>()

    const visit = (node: PropertyPath): void => {
      if (visited.has(node) || !dirty.has(node)) return
      visited.add(node)

      for (const dep of this.getDependencies(node)) {
        if (dirty.has(dep)) {
          visit(dep)
        }
      }

      sorted.push(node)
    }

    for (const node of dirty) {
      visit(node)
    }

    return sorted
  }

  // --- Анализ ---

  getDepth(propertyPath: PropertyPath): number {
    const deps = this.getDependencies(propertyPath)
    if (deps.length === 0) return 0
    return 1 + Math.max(...deps.map(d => this.getDepth(d)))
  }

  getCriticalPath(): PropertyPath[] {
    // Самый длинный путь в графе
    const allPaths = new Set<PropertyPath>()
    for (const dep of this.dependencies) {
      allPaths.add(dep.from)
      allPaths.add(dep.to)
    }

    let longestPath: PropertyPath[] = []
    for (const path of allPaths) {
      const deps = this.getAllDependencies(path)
      if (deps.length > longestPath.length) {
        longestPath = deps
      }
    }

    return longestPath
  }

  // --- Визуализация ---

  toDOT(): string {
    const lines: string[] = ["digraph propertyDependencies {"]

    for (const dep of this.dependencies) {
      lines.push(`  "${dep.from}" -> "${dep.to}" [label="${dep.type}"];`)
    }

    lines.push("}")
    return lines.join("\n")
  }

  // --- Импорт/экспорт ---

  exportAll(): PropertyDependency[] {
    return [...this.dependencies]
  }

  importAll(dependencies: PropertyDependency[]): void {
    this.clear()
    for (const dep of dependencies) {
      this.addDependency(dep)
    }
  }

  clear(): void {
    this.dependencies = []
    this.forwardAdj.clear()
    this.reverseAdj.clear()
    this.dirtyProperties.clear()
  }

  // --- Приватные методы ---

  private addToAdj(adj: Map<PropertyPath, PropertyPath[]>, from: PropertyPath, to: PropertyPath): void {
    if (!adj.has(from)) adj.set(from, [])
    adj.get(from)!.push(to)
  }

  private removeFromAdj(adj: Map<PropertyPath, PropertyPath[]>, from: PropertyPath, to: PropertyPath): void {
    const list = adj.get(from)
    if (list) {
      const idx = list.indexOf(to)
      if (idx >= 0) list.splice(idx, 1)
    }
  }
}

// ============================================================
// FACTORY: Предустановленные зависимости
// ============================================================

export function createElectricalDependencies(
  outletId: UUID,
  circuitId: UUID,
  breakerId: UUID,
  panelId: UUID
): PropertyDependency[] {
  return [
    {
      from: `${outletId}.electrical.load`,
      to: `${circuitId}.electrical.load`,
      type: "aggregate",
      description: "Нагрузка розетки влияет на нагрузку группы",
    },
    {
      from: `${circuitId}.electrical.load`,
      to: `${breakerId}.electrical.breakerRating`,
      type: "validation",
      description: "Нагрузка группы не должна превышать номинал автомата",
    },
    {
      from: `${breakerId}.electrical.breakerRating`,
      to: `${panelId}.geometry.width`,
      type: "calculation",
      description: "Количество автоматов определяет размер щита",
    },
  ]
}

export function createRoomDependencies(roomId: UUID): PropertyDependency[] {
  return [
    {
      from: `${roomId}.geometry.width`,
      to: `${roomId}.geometry.height`,
      type: "display",
      description: "Ширина и высота комнаты связаны",
    },
  ]
}

// ============================================================
// СИНГЛТОН
// ============================================================

export const PropertyDependencyGraph = new PropertyDependencyGraphImpl()
