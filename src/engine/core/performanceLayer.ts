// ============================================================
// ElectricPMR — Performance Layer
// ============================================================
//
// Calculation Cache, Spatial Index, Dirty Objects,
// Incremental Updates, Metrics API
// ============================================================

import type { UUID } from "../types/common"
import type { UniversalObject } from "./universalObject"
import { ObjectRegistry } from "./objectRegistry"

// ============================================================
// PERFORMANCE LAYER
// ============================================================

class PerformanceLayerImpl {
  private cache = new CalculationCache()
  private spatialIndex = new SpatialIndex()
  private metrics = new MetricsCollector()

  // --- Кэш расчётов ---

  getCached<T>(key: string): T | undefined {
    return this.cache.get<T>(key)
  }

  setCached<T>(key: string, value: T, ttlMs: number = 60000): void {
    this.cache.set(key, value, ttlMs)
  }

  invalidateCache(pattern?: string): void {
    if (pattern) {
      this.cache.invalidatePattern(pattern)
    } else {
      this.cache.clear()
    }
  }

  // --- Пространственный индекс ---

  buildSpatialIndex(): void {
    this.spatialIndex.clear()
    for (const obj of ObjectRegistry.getAll()) {
      if (obj.geometry) {
        this.spatialIndex.insert(obj)
      }
    }
  }

  querySpatial(x: number, y: number, radius: number): UniversalObject[] {
    return this.spatialIndex.query(x, y, radius)
  }

  queryBounds(
    minX: number, minY: number,
    maxX: number, maxY: number
  ): UniversalObject[] {
    return this.spatialIndex.queryBounds(minX, minY, maxX, maxY)
  }

  // --- Метрики ---

  startTimer(name: string): () => number {
    return this.metrics.startTimer(name)
  }

  recordMetric(name: string, value: number): void {
    this.metrics.record(name, value)
  }

  getMetrics(): MetricsSnapshot {
    return this.metrics.getSnapshot()
  }

  resetMetrics(): void {
    this.metrics.reset()
  }
}

// ============================================================
// CALCULATION CACHE
// ============================================================

class CalculationCache {
  private entries = new Map<string, CacheEntry>()

  get<T>(key: string): T | undefined {
    const entry = this.entries.get(key)
    if (!entry) return undefined

    if (Date.now() > entry.expiresAt) {
      this.entries.delete(key)
      return undefined
    }

    entry.hits++
    return entry.value as T
  }

  set<T>(key: string, value: T, ttlMs: number = 60000): void {
    this.entries.set(key, {
      value,
      createdAt: Date.now(),
      expiresAt: Date.now() + ttlMs,
      hits: 0,
    })
  }

  invalidate(key: string): void {
    this.entries.delete(key)
  }

  invalidatePattern(pattern: string): void {
    const regex = new RegExp(pattern)
    for (const key of this.entries.keys()) {
      if (regex.test(key)) {
        this.entries.delete(key)
      }
    }
  }

  clear(): void {
    this.entries.clear()
  }

  getStats(): CacheStats {
    const entries = Array.from(this.entries.values())
    return {
      size: entries.length,
      totalHits: entries.reduce((sum, e) => sum + e.hits, 0),
      avgHits: entries.length > 0
        ? entries.reduce((sum, e) => sum + e.hits, 0) / entries.length
        : 0,
    }
  }
}

interface CacheEntry {
  value: unknown
  createdAt: number
  expiresAt: number
  hits: number
}

interface CacheStats {
  size: number
  totalHits: number
  avgHits: number
}

// ============================================================
// SPATIAL INDEX (Quadtree)
// ============================================================

class SpatialIndex {
  private root: QuadNode | null = null
  private bounds = { minX: -100000, minY: -100000, maxX: 100000, maxY: 100000 }
  private maxDepth = 8
  private maxObjects = 10

  insert(obj: UniversalObject): void {
    if (!this.root) {
      this.root = new QuadNode(this.bounds, 0, this.maxDepth, this.maxObjects)
    }
    this.root.insert(obj)
  }

  query(x: number, y: number, radius: number): UniversalObject[] {
    if (!this.root) return []

    const range = {
      minX: x - radius,
      minY: y - radius,
      maxX: x + radius,
      maxY: y + radius,
    }

    const results: UniversalObject[] = []
    this.root.query(range, results)

    // Фильтруем по реальному расстоянию
    return results.filter(obj => {
      if (!obj.geometry) return false
      const dx = obj.geometry.position.x - x
      const dy = obj.geometry.position.y - y
      return Math.sqrt(dx * dx + dy * dy) <= radius
    })
  }

  queryBounds(
    minX: number, minY: number,
    maxX: number, maxY: number
  ): UniversalObject[] {
    if (!this.root) return []

    const range = { minX, minY, maxX, maxY }
    const results: UniversalObject[] = []
    this.root.query(range, results)
    return results
  }

  clear(): void {
    this.root = null
  }
}

class QuadNode {
  private objects: UniversalObject[] = []
  private children: QuadNode[] | null = null

  constructor(
    private bounds: { minX: number; minY: number; maxX: number; maxY: number },
    private depth: number,
    private maxDepth: number,
    private maxObjects: number
  ) {}

  insert(obj: UniversalObject): void {
    if (!this.contains(obj)) return

    if (this.children) {
      for (const child of this.children) {
        child.insert(obj)
      }
      return
    }

    this.objects.push(obj)

    if (this.objects.length > this.maxObjects && this.depth < this.maxDepth) {
      this.subdivide()
    }
  }

  query(range: { minX: number; minY: number; maxX: number; maxY: number }, results: UniversalObject[]): void {
    if (!this.intersects(range)) return

    for (const obj of this.objects) {
      if (this.objInRange(obj, range)) {
        results.push(obj)
      }
    }

    if (this.children) {
      for (const child of this.children) {
        child.query(range, results)
      }
    }
  }

  private contains(obj: UniversalObject): boolean {
    if (!obj.geometry) return false
    const { x, y } = obj.geometry.position
    return x >= this.bounds.minX && x <= this.bounds.maxX &&
           y >= this.bounds.minY && y <= this.bounds.maxY
  }

  private intersects(range: { minX: number; minY: number; maxX: number; maxY: number }): boolean {
    return !(range.maxX < this.bounds.minX || range.minX > this.bounds.maxX ||
             range.maxY < this.bounds.minY || range.minY > this.bounds.maxY)
  }

  private objInRange(obj: UniversalObject, range: { minX: number; minY: number; maxX: number; maxY: number }): boolean {
    if (!obj.geometry) return false
    const { x, y } = obj.geometry.position
    return x >= range.minX && x <= range.maxX &&
           y >= range.minY && y <= range.maxY
  }

  private subdivide(): void {
    const midX = (this.bounds.minX + this.bounds.maxX) / 2
    const midY = (this.bounds.minY + this.bounds.maxY) / 2

    this.children = [
      new QuadNode({ minX: this.bounds.minX, minY: this.bounds.minY, maxX: midX, maxY: midY }, this.depth + 1, this.maxDepth, this.maxObjects),
      new QuadNode({ minX: midX, minY: this.bounds.minY, maxX: this.bounds.maxX, maxY: midY }, this.depth + 1, this.maxDepth, this.maxObjects),
      new QuadNode({ minX: this.bounds.minX, minY: midY, maxX: midX, maxY: this.bounds.maxY }, this.depth + 1, this.maxDepth, this.maxObjects),
      new QuadNode({ minX: midX, minY: midY, maxX: this.bounds.maxX, maxY: this.bounds.maxY }, this.depth + 1, this.maxDepth, this.maxObjects),
    ]

    for (const obj of this.objects) {
      for (const child of this.children) {
        child.insert(obj)
      }
    }

    this.objects = []
  }
}

// ============================================================
// METRICS COLLECTOR
// ============================================================

class MetricsCollector {
  private metrics = new Map<string, MetricEntry>()

  startTimer(name: string): () => number {
    const start = performance.now()
    return () => {
      const duration = performance.now() - start
      this.record(name, duration)
      return duration
    }
  }

  record(name: string, value: number): void {
    if (!this.metrics.has(name)) {
      this.metrics.set(name, {
        values: [],
        sum: 0,
        count: 0,
        min: Infinity,
        max: -Infinity,
      })
    }

    const entry = this.metrics.get(name)!
    entry.values.push(value)
    entry.sum += value
    entry.count++
    entry.min = Math.min(entry.min, value)
    entry.max = Math.max(entry.max, value)

    // Храним последние 1000 значений
    if (entry.values.length > 1000) {
      entry.values.shift()
    }
  }

  getSnapshot(): MetricsSnapshot {
    const entries: Record<string, MetricSnapshot> = {}

    for (const [name, entry] of this.metrics) {
      entries[name] = {
        avg: entry.count > 0 ? entry.sum / entry.count : 0,
        min: entry.min === Infinity ? 0 : entry.min,
        max: entry.max === -Infinity ? 0 : entry.max,
        count: entry.count,
        latest: entry.values.length > 0 ? entry.values[entry.values.length - 1] : 0,
      }
    }

    return {
      timestamp: new Date(),
      metrics: entries,
    }
  }

  reset(): void {
    this.metrics.clear()
  }
}

interface MetricEntry {
  values: number[]
  sum: number
  count: number
  min: number
  max: number
}

export interface MetricsSnapshot {
  timestamp: Date
  metrics: Record<string, MetricSnapshot>
}

interface MetricSnapshot {
  avg: number
  min: number
  max: number
  count: number
  latest: number
}

// ============================================================
// СИНГЛТОН
// ============================================================

export const PerformanceLayer = new PerformanceLayerImpl()
