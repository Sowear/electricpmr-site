// ============================================================
// ElectricPMR — Success Metrics
// ============================================================
//
// Three mandatory metrics for each new feature:
// 1. Task completion time
// 2. Number of user actions
// 3. Rate of automatic decisions
// ============================================================

import type { UUID } from "../types/common"

// ============================================================
// METRICS TYPES
// ============================================================

export interface TaskMetrics {
  taskId: UUID
  taskName: string
  startTime: Date
  endTime?: Date
  duration?: number
  userActions: number
  autoDecisions: number
  totalDecisions: number
  autoDecisionRate: number
}

export interface ProjectMetrics {
  projectId: UUID
  tasks: TaskMetrics[]
  totalTime: number
  totalActions: number
  totalAutoDecisions: number
  totalDecisions: number
  overallAutoRate: number
  averageTaskTime: number
  efficiency: EfficiencyMetrics
}

export interface EfficiencyMetrics {
  timePerRoom: number
  actionsPerCircuit: number
  autoRate: number
  score: number
}

export interface BenchmarkComparison {
  metric: string
  current: number
  target: number
  status: "better" | "equal" | "worse"
  delta: number
}

// ============================================================
// SUCCESS METRICS
// ============================================================

class SuccessMetricsImpl {
  private tasks: Map<UUID, TaskMetrics> = new Map()
  private projectTasks: Map<UUID, UUID[]> = new Map()

  startTask(projectId: UUID, taskName: string): UUID {
    const taskId = this.generateId()

    const task: TaskMetrics = {
      taskId,
      taskName,
      startTime: new Date(),
      userActions: 0,
      autoDecisions: 0,
      totalDecisions: 0,
      autoDecisionRate: 0,
    }

    this.tasks.set(taskId, task)

    if (!this.projectTasks.has(projectId)) {
      this.projectTasks.set(projectId, [])
    }
    this.projectTasks.get(projectId)!.push(taskId)

    return taskId
  }

  endTask(taskId: UUID): void {
    const task = this.tasks.get(taskId)
    if (!task) return

    task.endTime = new Date()
    task.duration = task.endTime.getTime() - task.startTime.getTime()

    if (task.totalDecisions > 0) {
      task.autoDecisionRate = task.autoDecisions / task.totalDecisions
    }
  }

  recordUserAction(taskId: UUID): void {
    const task = this.tasks.get(taskId)
    if (task) task.userActions++
  }

  recordAutoDecision(taskId: UUID): void {
    const task = this.tasks.get(taskId)
    if (task) {
      task.autoDecisions++
      task.totalDecisions++
    }
  }

  recordManualDecision(taskId: UUID): void {
    const task = this.tasks.get(taskId)
    if (task) task.totalDecisions++
  }

  getProjectMetrics(projectId: UUID): ProjectMetrics | null {
    const taskIds = this.projectTasks.get(projectId)
    if (!taskIds) return null

    const tasks = taskIds
      .map(id => this.tasks.get(id))
      .filter((t): t is TaskMetrics => t !== undefined)

    const totalTime = tasks.reduce((sum, t) => sum + (t.duration ?? 0), 0)
    const totalActions = tasks.reduce((sum, t) => sum + t.userActions, 0)
    const totalAutoDecisions = tasks.reduce((sum, t) => sum + t.autoDecisions, 0)
    const totalDecisions = tasks.reduce((sum, t) => sum + t.totalDecisions, 0)

    const efficiency = this.calculateEfficiency(tasks)

    return {
      projectId,
      tasks,
      totalTime,
      totalActions,
      totalAutoDecisions,
      totalDecisions,
      overallAutoRate: totalDecisions > 0 ? totalAutoDecisions / totalDecisions : 0,
      averageTaskTime: tasks.length > 0 ? totalTime / tasks.length : 0,
      efficiency,
    }
  }

  private calculateEfficiency(tasks: TaskMetrics[]): EfficiencyMetrics {
    const totalTime = tasks.reduce((sum, t) => sum + (t.duration ?? 0), 0)
    const totalActions = tasks.reduce((sum, t) => sum + t.userActions, 0)
    const totalAuto = tasks.reduce((sum, t) => sum + t.autoDecisions, 0)
    const totalDecisions = tasks.reduce((sum, t) => sum + t.totalDecisions, 0)

    const rooms = 5
    const circuits = 10

    const autoRate = totalDecisions > 0 ? totalAuto / totalDecisions : 0

    let score = 50
    if (totalTime < 30 * 60 * 1000) score += 20
    if (totalActions < 50) score += 15
    if (autoRate > 0.7) score += 15

    return {
      timePerRoom: rooms > 0 ? totalTime / rooms : 0,
      actionsPerCircuit: circuits > 0 ? totalActions / circuits : 0,
      autoRate,
      score: Math.min(100, score),
    }
  }

  compareToBenchmarks(projectId: UUID): BenchmarkComparison[] {
    const metrics = this.getProjectMetrics(projectId)
    if (!metrics) return []

    const benchmarks: Array<{ metric: string; target: number; unit: string }> = [
      { metric: "apartment_design_time", target: 25 * 60 * 1000, unit: "ms" },
      { metric: "user_actions", target: 40, unit: "count" },
      { metric: "auto_decision_rate", target: 0.75, unit: "rate" },
      { metric: "time_per_room", target: 5 * 60 * 1000, unit: "ms" },
    ]

    return benchmarks.map(b => {
      let current: number
      switch (b.metric) {
        case "apartment_design_time":
          current = metrics.totalTime
          break
        case "user_actions":
          current = metrics.totalActions
          break
        case "auto_decision_rate":
          current = metrics.overallAutoRate
          break
        case "time_per_room":
          current = metrics.efficiency.timePerRoom
          break
        default:
          current = 0
      }

      const delta = current - b.target
      let status: "better" | "equal" | "worse"

      if (b.metric === "auto_decision_rate") {
        status = current >= b.target ? "better" : "worse"
      } else {
        status = current <= b.target ? "better" : "worse"
      }

      return {
        metric: b.metric,
        current,
        target: b.target,
        status,
        delta,
      }
    })
  }

  formatDuration(ms: number): string {
    const minutes = Math.floor(ms / 60000)
    const seconds = Math.floor((ms % 60000) / 1000)
    return minutes + " min " + seconds + " sec"
  }

  formatReport(projectId: UUID): string {
    const metrics = this.getProjectMetrics(projectId)
    if (!metrics) return "Metrics not found"

    const lines: string[] = []

    lines.push("## Project Metrics\n")
    lines.push("Total time: " + this.formatDuration(metrics.totalTime))
    lines.push("User actions: " + metrics.totalActions)
    lines.push("Auto decisions: " + metrics.totalAutoDecisions + "/" + metrics.totalDecisions + " (" + (metrics.overallAutoRate * 100).toFixed(0) + "%)")
    lines.push("Efficiency: " + metrics.efficiency.score + "/100\n")

    lines.push("### Benchmark Comparison")
    const comparisons = this.compareToBenchmarks(projectId)
    for (const comp of comparisons) {
      const icon = comp.status === "better" ? "[OK]" : comp.status === "worse" ? "[!!]" : "[--]"
      const current = this.formatValue(comp.current)
      const target = this.formatValue(comp.target)
      lines.push(icon + " " + comp.metric + ": " + current + " (target: " + target + ")")
    }

    return lines.join("\n")
  }

  private formatValue(value: number): string {
    if (value > 1000000) {
      return (value / 60000).toFixed(1) + " min"
    }
    if (value > 1000) {
      return (value / 1000).toFixed(1) + " sec"
    }
    if (value <= 1) {
      return (value * 100).toFixed(0) + "%"
    }
    return value.toFixed(0)
  }

  private generateId(): UUID {
    return ("metric_" + Date.now() + "_" + Math.random().toString(36).slice(2, 9)) as UUID
  }
}

// ============================================================
// SINGLETON
// ============================================================

export const SuccessMetrics = new SuccessMetricsImpl()
