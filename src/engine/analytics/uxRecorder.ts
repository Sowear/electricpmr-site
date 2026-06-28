// ============================================================
// ElectricPMR — UX Recorder
// ============================================================
//
// Tracks user interactions for:
// - Friction Index (how many clicks to complete a task)
// - AI Accuracy (AI suggestions accepted vs modified)
// - Trust Score (user confidence in AI)
// ============================================================

export interface UXEvent {
  id: string
  timestamp: number
  type: "click" | "drag" | "keyboard" | "ai_action" | "ai_accept" | "ai_modify" | "ai_reject" | "tool_switch" | "undo" | "redo" | "save" | "export"
  target?: string
  details?: Record<string, unknown>
  duration?: number
}

export interface UXMetrics {
  totalEvents: number
  sessionDuration: number
  clicksByTarget: Map<string, number>
  aiAcceptanceRate: number
  aiModifications: number
  aiRejections: number
  averageTaskDuration: number
  frictionIndex: number
  undoRate: number
}

class UXRecorderImpl {
  private events: UXEvent[] = []
  private sessionStart = Date.now()
  private maxEvents = 1000

  track(type: UXEvent["type"], target?: string, details?: Record<string, unknown>): void {
    const event: UXEvent = {
      id: `ux_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      timestamp: Date.now(),
      type,
      target,
      details,
    }

    this.events.push(event)

    if (this.events.length > this.maxEvents) {
      this.events = this.events.slice(-this.maxEvents)
    }
  }

  trackAIAction(action: "accept" | "modify" | "reject", pointId?: string, originalType?: string, finalType?: string): void {
    const type = action === "accept" ? "ai_accept" : action === "modify" ? "ai_modify" : "ai_reject"
    this.track(type, pointId, { originalType, finalType })
  }

  getMetrics(): UXMetrics {
    const now = Date.now()
    const sessionDuration = (now - this.sessionStart) / 1000

    const clicksByTarget = new Map<string, number>()
    this.events.filter(e => e.type === "click").forEach(e => {
      if (e.target) {
        clicksByTarget.set(e.target, (clicksByTarget.get(e.target) ?? 0) + 1)
      }
    })

    const aiEvents = this.events.filter(e => e.type === "ai_accept" || e.type === "ai_modify" || e.type === "ai_reject")
    const aiAccepts = this.events.filter(e => e.type === "ai_accept").length
    const aiMods = this.events.filter(e => e.type === "ai_modify").length
    const aiRejects = this.events.filter(e => e.type === "ai_reject").length
    const aiAcceptanceRate = aiEvents.length > 0 ? aiAccepts / aiEvents.length : 0

    const undos = this.events.filter(e => e.type === "undo").length
    const totalActions = this.events.filter(e => ["click", "drag", "tool_switch"].includes(e.type)).length
    const undoRate = totalActions > 0 ? undos / totalActions : 0

    const frictionIndex = totalActions > 0
      ? Math.round((undos / totalActions) * 100 + (aiMods / Math.max(aiEvents.length, 1)) * 50)
      : 0

    return {
      totalEvents: this.events.length,
      sessionDuration,
      clicksByTarget,
      aiAcceptanceRate,
      aiModifications: aiMods,
      aiRejections: aiRejects,
      averageTaskDuration: sessionDuration / Math.max(totalActions, 1),
      frictionIndex,
      undoRate,
    }
  }

  getRecentEvents(count: number = 20): UXEvent[] {
    return this.events.slice(-count)
  }

  clear(): void {
    this.events = []
    this.sessionStart = Date.now()
  }

  export(): string {
    return JSON.stringify({
      sessionStart: new Date(this.sessionStart).toISOString(),
      exportedAt: new Date().toISOString(),
      events: this.events,
      metrics: this.getMetrics(),
    }, null, 2)
  }
}

export const UXRecorder = new UXRecorderImpl()
