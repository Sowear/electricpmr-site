// ============================================================
// ElectricPMR — Health API
// ============================================================
//
// Полная картина состояния системы.
// Для мониторинга, отладки и оптимизации.
// ============================================================

import type { UUID } from "../types/common"
import { ComponentStore } from "./ecs"
import { DependencyGraph } from "./dependencyGraph"
import { PropertyDependencyGraph } from "./propertyDependencyGraph"
import { TransactionEngine } from "./transactionEngine"
import { RelationshipSystem } from "./relationshipSystem"
import { PerformanceLayer } from "./performanceLayer"
import { AuditLog } from "./auditLog"
import { SnapshotEngine } from "./snapshotEngine"
import { CommandManager } from "./commands"

// ============================================================
// HEALTH API
// ============================================================

class HealthApiImpl {

  // --- Полный отчёт о здоровье ---

  getFullHealthReport(): HealthReport {
    const start = performance.now()

    const report: HealthReport = {
      timestamp: new Date(),
      status: "healthy",
      components: {
        ecs: this.getECSHealth(),
        dependencies: this.getDependencyHealth(),
        transactions: this.getTransactionHealth(),
        relationships: this.getRelationshipHealth(),
        performance: this.getPerformanceHealth(),
        audit: this.getAuditHealth(),
        snapshots: this.getSnapshotHealth(),
        commands: this.getCommandHealth(),
      },
      metrics: this.getSystemMetrics(),
      issues: [],
      duration: 0,
    }

    // Определяем общий статус
    for (const [name, component] of Object.entries(report.components)) {
      if (component.status === "critical") {
        report.status = "critical"
        report.issues.push({
          severity: "critical",
          component: name,
          message: component.message,
        })
      } else if (component.status === "degraded" && report.status !== "critical") {
        report.status = "degraded"
        report.issues.push({
          severity: "warning",
          component: name,
          message: component.message,
        })
      }
    }

    report.duration = performance.now() - start
    return report
  }

  // --- Компоненты ---

  private getECSHealth(): ComponentHealth {
    const stats = ComponentStore.getStats()

    return {
      status: stats.entityCount > 10000 ? "degraded" : "healthy",
      message: `${stats.entityCount} entities, ${stats.totalComponents} components`,
      data: stats,
    }
  }

  private getDependencyHealth(): ComponentHealth {
    const cycles = DependencyGraph.detectCycles()
    const isolated = DependencyGraph.getIsolatedObjects()

    const status = cycles.length > 0 ? "critical" : "degraded"
    const message = cycles.length > 0
      ? `${cycles.length} dependency cycles detected`
      : `${isolated.length} isolated objects`

    return {
      status,
      message,
      data: { cycles: cycles.length, isolated: isolated.length },
    }
  }

  private getTransactionHealth(): ComponentHealth {
    const active = TransactionEngine.getActiveTransaction()
    const history = TransactionEngine.getHistory(10)

    return {
      status: active ? "degraded" : "healthy",
      message: active
        ? `Active transaction: ${active.id}`
        : `${history.length} recent transactions`,
      data: { active: !!active, recentCount: history.length },
    }
  }

  private getRelationshipHealth(): ComponentHealth {
    const stats = RelationshipSystem.getStats()
    const validation = RelationshipSystem.validate()

    const status = validation.valid ? "healthy" : "critical"

    return {
      status,
      message: `${stats.total} relationships, ${validation.issues.length} issues`,
      data: stats,
    }
  }

  private getPerformanceHealth(): ComponentHealth {
    const metrics = PerformanceLayer.getMetrics()
    const cacheStats = { size: 0, avgHits: 0 }

    return {
      status: cacheStats.avgHits < 0.3 ? "degraded" : "healthy",
      message: `Cache: ${cacheStats.size} entries, avg hits: ${cacheStats.avgHits.toFixed(2)}`,
      data: { metrics: metrics.metrics, cache: cacheStats },
    }
  }

  private getAuditHealth(): ComponentHealth {
    const stats = AuditLog.getStats()

    return {
      status: "healthy",
      message: `${stats.totalEntries} audit entries`,
      data: stats,
    }
  }

  private getSnapshotHealth(): ComponentHealth {
    const stats = SnapshotEngine.getStats()

    return {
      status: stats.totalSnapshots === 0 ? "degraded" : "healthy",
      message: `${stats.totalSnapshots} snapshots, ${stats.commandsSinceLastSnapshot} commands since last`,
      data: stats,
    }
  }

  private getCommandHealth(): ComponentHealth {
    const canUndo = TransactionEngine.canUndo()
    const canRedo = TransactionEngine.canRedo()

    return {
      status: "healthy",
      message: `Undo: ${canUndo ? "available" : "empty"}, Redo: ${canRedo ? "available" : "empty"}`,
      data: { canUndo, canRedo },
    }
  }

  // --- Метрики системы ---

  private getSystemMetrics(): SystemMetrics {
    return {
      objects: ComponentStore.getAllEntities().length,
      commandsPerSecond: this.getCommandsPerSecond(),
      activeTransactions: TransactionEngine.getActiveTransaction() ? 1 : 0,
      memory: this.getMemoryUsage(),
      cacheHitRatio: this.getCacheHitRatio(),
      validationTime: this.getValidationTime(),
      calculationTime: this.getCalculationTime(),
      fps: this.getFPS(),
      undoSize: TransactionEngine.canUndo() ? 1 : 0,
      graphNodes: DependencyGraph.getIsolatedObjects().length,
      graphDepth: 0,
    }
  }

  private getCommandsPerSecond(): number {
    const stats = AuditLog.getStats()
    if (!stats.oldestEntry || !stats.newestEntry) return 0

    const duration = stats.newestEntry.getTime() - stats.oldestEntry.getTime()
    if (duration === 0) return 0

    return (stats.totalEntries / duration) * 1000
  }

  private getMemoryUsage(): number {
    if (typeof performance !== "undefined" && "memory" in performance) {
      const perf = performance as unknown as { memory?: { usedJSHeapSize?: number } }
      return perf.memory?.usedJSHeapSize ?? 0
    }
    return 0
  }

  private getCacheHitRatio(): number {
    const metrics = PerformanceLayer.getMetrics()
    return metrics.metrics["cache_hit"]?.avg ?? 0
  }

  private getValidationTime(): number {
    const metrics = PerformanceLayer.getMetrics()
    return metrics.metrics["validation"]?.avg ?? 0
  }

  private getCalculationTime(): number {
    const metrics = PerformanceLayer.getMetrics()
    return metrics.metrics["calculation"]?.avg ?? 0
  }

  private getFPS(): number {
    // Заглушка — в реальном продукте здесь будет трекинг FPS
    return 60
  }
}

// ============================================================
// ТИПЫ
// ============================================================

export interface HealthReport {
  timestamp: Date
  status: "healthy" | "degraded" | "critical"
  components: Record<string, ComponentHealth>
  metrics: SystemMetrics
  issues: HealthIssue[]
  duration: number
}

export interface ComponentHealth {
  status: "healthy" | "degraded" | "critical"
  message: string
  data?: unknown
}

export interface SystemMetrics {
  objects: number
  commandsPerSecond: number
  activeTransactions: number
  memory: number
  cacheHitRatio: number
  validationTime: number
  calculationTime: number
  fps: number
  undoSize: number
  graphNodes: number
  graphDepth: number
}

export interface HealthIssue {
  severity: "warning" | "critical"
  component: string
  message: string
}

// ============================================================
// СИНГЛТОН
// ============================================================

export const HealthApi = new HealthApiImpl()
