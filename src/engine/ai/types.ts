// ============================================================
// ElectricPMR — AI Execution Platform Types
// ============================================================
//
// Философия:
//   LLM никогда не меняет проект напрямую.
//   LLM → Planner → Tool Registry → Command Queue →
//   Engineering Engine → Validation → Preview → Commit
// ============================================================

import type { UUID } from "../types/common"

// ============================================================
// AI PROVIDER ABSTRACTION
// ============================================================

export interface AIProvider {
  readonly id: string
  readonly name: string
  generate(request: AIGenerateRequest): Promise<AIGenerateResponse>
  stream?(request: AIGenerateRequest): AsyncGenerator<AIGenerateChunk>
  toolCall?(request: AIToolCallRequest): Promise<AIToolCallResponse>
}

export interface AIGenerateRequest {
  messages: AIMessage[]
  tools?: AIToolDefinition[]
  temperature?: number
  maxTokens?: number
  systemPrompt?: string
}

export interface AIGenerateResponse {
  content: string
  toolCalls?: AIToolCall[]
  usage: { promptTokens: number; completionTokens: number }
  model: string
}

export interface AIGenerateChunk {
  type: "text" | "tool_call" | "done"
  content?: string
  toolCall?: AIToolCall
}

export interface AIToolCallRequest {
  toolName: string
  parameters: Record<string, unknown>
}

export interface AIToolCallResponse {
  result: unknown
  success: boolean
  error?: string
}

export interface AIMessage {
  role: "system" | "user" | "assistant" | "tool"
  content: string
  toolCalls?: AIToolCall[]
  toolCallId?: string
  timestamp: Date
}

export interface AIToolCall {
  id: UUID
  name: string
  arguments: Record<string, unknown>
}

// ============================================================
// TOOL DEFINITION (для LLM)
// ============================================================

export interface AIToolDefinition {
  name: string
  description: string
  parameters: AIToolParameter[]
  category: "geometry" | "electrical" | "calculation" | "validation" | "document" | "search"
}

export interface AIToolParameter {
  name: string
  type: "string" | "number" | "boolean" | "array" | "object"
  description: string
  required: boolean
  enum?: string[]
  default?: unknown
}

// ============================================================
// TOOL RESULT
// ============================================================

export interface AIToolResult {
  success: boolean
  data?: unknown
  error?: string
  warnings?: string[]
  sideEffects?: ToolSideEffect[]
}

export interface ToolSideEffect {
  type: "created" | "modified" | "removed" | "assigned"
  targetType: string
  targetId: UUID
  description: string
}

// ============================================================
// PLANNER
// ============================================================

export interface AIPlan {
  id: UUID
  goal: string
  steps: AIPlanStep[]
  estimatedConfidence: number
  estimatedChanges: number
  requiresConfirmation: boolean
}

export interface AIPlanStep {
  order: number
  toolName: string
  parameters: Record<string, unknown>
  description: string
  dependencies: number[]     // номера шагов, от которых зависит
  estimatedImpact: "low" | "medium" | "high"
}

// ============================================================
// DRY RUN
// ============================================================

export interface DryRunResult {
  planId: UUID
  wouldChange: DryRunChange[]
  totalCostImpact: number
  totalCableAdded: number
  validationBefore: ValidationResultSummary
  validationAfter: ValidationResultSummary
  newErrors: string[]
  resolvedErrors: string[]
}

export interface DryRunChange {
  type: "created" | "modified" | "removed"
  targetType: string
  targetName: string
  description: string
  costDelta: number
}

export interface ValidationResultSummary {
  errors: number
  warnings: number
  isValid: boolean
}

// ============================================================
// CONFIDENCE
// ============================================================

export interface AIConfidence {
  score: number               // 0-1
  level: "high" | "medium" | "low"
  reasons: string[]
  requiresConfirmation: boolean
}

// ============================================================
// EXPLANATION
// ============================================================

export interface AIExplanation {
  decision: string
  reasoning: string
  alternatives?: AIAlternative[]
  normatives?: NormativeRef[]
  confidence: AIConfidence
}

export interface AIAlternative {
  id: UUID
  description: string
  pros: string[]
  cons: string[]
  estimatedCost: number
}

export interface NormativeRef {
  source: string              // "ПУЭ 7.1.36"
  section: string
  text: string
}

// ============================================================
// SANDBOX
// ============================================================

export interface AISandbox {
  id: UUID
  projectSnapshot: unknown     // deep clone проекта
  createdAt: Date
  status: "draft" | "validated" | "applied" | "rejected"
  changes: DryRunChange[]
  validation: ValidationResultSummary
}

// ============================================================
// CONVERSATION STATE
// ============================================================

export interface AIConversationState {
  id: UUID
  messages: AIMessage[]
  currentPlan: AIPlan | null
  pendingConfirmation: boolean
  lastAction: Date
  context: AIContext
}

export interface AIContext {
  selectedObjectId?: UUID
  activeRoom?: UUID
  activeFloor: number
  recentChanges: string[]
  userPreferences: AIUserPreferences
}

export interface AIUserPreferences {
  preferredManufacturer: string
  preferredCableType: string
  autoOptimize: boolean
  confirmationRequired: "always" | "high_impact" | "never"
}

// ============================================================
// AI RUNTIME STATE
// ============================================================

export interface AIRuntimeState {
  provider: AIProvider | null
  conversation: AIConversationState
  sandbox: AISandbox | null
  isProcessing: boolean
  lastError: string | null
}
