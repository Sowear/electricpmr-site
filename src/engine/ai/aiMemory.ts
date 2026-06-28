// ============================================================
// ElectricPMR — AI Memory
// ============================================================
//
// Инженерная память проекта и предпочтений пользователя.
// Не память разговора — а то, что система запоминает о пользователе.
// ============================================================

import type { UUID } from "../types/common"

// ============================================================
// MEMORY TYPES
// ============================================================

export interface UserPreferences {
  userId: UUID
  brandPreference: string[]      // ["ABB", "Schneider"]
  brandBlacklist: string[]       // ["IEK"]
  cableType: string              // "VVGng", "NYM"
  installationMethod: "open" | "hidden" | "mixed"
  mountingHeight: {
    outlet: number
    switch: number
    outletHeight: number
  }
  defaultCableSection: number
  alwaysUseRCDOption: boolean
  priceAwareness: "low" | "medium" | "high"
}

export interface ProjectMemory {
  projectId: UUID
  lastModified: Date
  objectCount: number
  circuitCount: number
  panelCount: number
  totalPower: number
  recentChanges: ProjectChange[]
  userFeedback: UserFeedback[]
}

export interface ProjectChange {
  timestamp: Date
  action: string
  objectId?: UUID
  objectType?: string
  description: string
}

export interface UserFeedback {
  timestamp: Date
  scenario: string
  accepted: boolean
  rating?: number // 1-5
  comment?: string
}

// ============================================================
// AI MEMORY
// ============================================================

class AIMemoryImpl {
  private userPreferences: Map<UUID, UserPreferences> = new Map()
  private projectMemories: Map<UUID, ProjectMemory> = new Map()
  private conversationHistory: ConversationTurn[] = []

  // --- User Preferences ---

  getUserPreferences(userId: UUID): UserPreferences {
    if (!this.userPreferences.has(userId)) {
      this.userPreferences.set(userId, this.getDefaultPreferences(userId))
    }
    return this.userPreferences.get(userId)!
  }

  setUserPreferences(userId: UUID, prefs: Partial<UserPreferences>): void {
    const current = this.getUserPreferences(userId)
    this.userPreferences.set(userId, { ...current, ...prefs })
  }

  private getDefaultPreferences(userId: UUID): UserPreferences {
    return {
      userId,
      brandPreference: ["ABB", "Schneider"],
      brandBlacklist: [],
      cableType: "VVGng",
      installationMethod: "hidden",
      mountingHeight: {
        outlet: 300,
        switch: 900,
        outletHeight: 1100,
      },
      defaultCableSection: 2.5,
      alwaysUseRCDOption: true,
      priceAwareness: "medium",
    }
  }

  // --- Project Memory ---

  getProjectMemory(projectId: UUID): ProjectMemory {
    if (!this.projectMemories.has(projectId)) {
      this.projectMemories.set(projectId, {
        projectId,
        lastModified: new Date(),
        objectCount: 0,
        circuitCount: 0,
        panelCount: 0,
        totalPower: 0,
        recentChanges: [],
        userFeedback: [],
      })
    }
    return this.projectMemories.get(projectId)!
  }

  recordChange(projectId: UUID, change: Omit<ProjectChange, "timestamp">): void {
    const memory = this.getProjectMemory(projectId)
    memory.recentChanges.push({
      ...change,
      timestamp: new Date(),
    })
    memory.lastModified = new Date()

    // Ограничиваем историю
    if (memory.recentChanges.length > 100) {
      memory.recentChanges = memory.recentChanges.slice(-100)
    }
  }

  recordFeedback(projectId: UUID, feedback: Omit<UserFeedback, "timestamp">): void {
    const memory = this.getProjectMemory(projectId)
    memory.userFeedback.push({
      ...feedback,
      timestamp: new Date(),
    })
  }

  // --- Conversation Memory ---

  addConversationTurn(turn: ConversationTurn): void {
    this.conversationHistory.push(turn)

    // Ограничиваем историю
    if (this.conversationHistory.length > 50) {
      this.conversationHistory = this.conversationHistory.slice(-50)
    }
  }

  getConversationHistory(): ConversationTurn[] {
    return [...this.conversationHistory]
  }

  getRecentContext(turns: number = 5): ConversationTurn[] {
    return this.conversationHistory.slice(-turns)
  }

  // --- Learning ---

  learnFromAcceptance(scenario: string, accepted: boolean): void {
    // Анализируем паттерны принятия решений
    const recentFeedback = this.conversationHistory
      .filter(t => t.type === "action" && t.accepted !== undefined)
      .slice(-20)

    // Если пользователь часто отвергает определённые типы действий,
    // снижаем приоритет подобных предложений
    const rejectionRate = recentFeedback.filter(f => !f.accepted).length / recentFeedback.length

    // Здесь можно добавить более сложную логику обучения
    console.log(`Rejection rate: ${rejectionRate.toFixed(2)}`)
  }

  getRecommendation(scenario: string): string | null {
    // На основе истории предыдущих действий
    const similarScenarios = this.conversationHistory.filter(
      t => t.scenario === scenario
    )

    if (similarScenarios.length === 0) return null

    const lastAction = similarScenarios[similarScenarios.length - 1]
    return lastAction.response
  }

  // --- Statistics ---

  getStats(): MemoryStats {
    return {
      userPreferencesCount: this.userPreferences.size,
      projectMemoriesCount: this.projectMemories.size,
      conversationTurnsCount: this.conversationHistory.length,
      averageFeedbackRating: this.getAverageFeedbackRating(),
    }
  }

  private getAverageFeedbackRating(): number {
    const ratings = this.conversationHistory
      .filter(t => t.rating !== undefined)
      .map(t => t.rating!)

    if (ratings.length === 0) return 0
    return ratings.reduce((a, b) => a + b, 0) / ratings.length
  }

  // --- Export/Import ---

  exportUserData(userId: UUID): UserDataExport {
    return {
      preferences: this.getUserPreferences(userId),
      projectMemories: Array.from(this.projectMemories.values()),
      conversationHistory: this.conversationHistory,
    }
  }

  importUserData(userId: UUID, data: UserDataExport): void {
    this.userPreferences.set(userId, data.preferences)
    for (const memory of data.projectMemories) {
      this.projectMemories.set(memory.projectId, memory)
    }
    this.conversationHistory = data.conversationHistory
  }

  clear(): void {
    this.userPreferences.clear()
    this.projectMemories.clear()
    this.conversationHistory = []
  }
}

// ============================================================
// ТИПЫ
// ============================================================

export interface ConversationTurn {
  id: UUID
  timestamp: Date
  type: "user_input" | "action" | "response" | "error"
  input?: string
  scenario?: string
  response?: string
  accepted?: boolean
  rating?: number
  metadata?: Record<string, unknown>
}

export interface UserDataExport {
  preferences: UserPreferences
  projectMemories: ProjectMemory[]
  conversationHistory: ConversationTurn[]
}

export interface MemoryStats {
  userPreferencesCount: number
  projectMemoriesCount: number
  conversationTurnsCount: number
  averageFeedbackRating: number
}

// ============================================================
// СИНГЛТОН
// ============================================================

export const AIMemory = new AIMemoryImpl()
