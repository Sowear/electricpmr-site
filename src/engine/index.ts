// ============================================================
// ElectricPMR Engine — единая точка входа
// ============================================================

// Типы
export * from "./types"

// Ядра
export { EventBus } from "./events"
export { EngineeringEngine } from "./core"
export { GeometryEngine } from "./geometry"
export { RuleEngine } from "./rules"

// Команды
export { CommandManager } from "./commands"
export {
  CreateWallCommand, MoveWallCommand, DeleteWallCommand,
  CreateDoorCommand, CreateWindowCommand,
  CreateElectricalPointCommand, MoveElectricalPointCommand, DeleteElectricalPointCommand,
  CreateCircuitCommand, AssignBreakerCommand, CreatePanelCommand,
} from "./commands/concrete"

// Библиотека
export { ObjectLibrary, searchLibrary, getLibraryByCategory, getLibraryItem, LIBRARY_CATEGORIES } from "./library"

// Выделение
export { SelectionEngine } from "./selection"

// Свойства
export { getObjectProperties } from "./properties"

// Auto Layout
export { initAutoLayout, updateAutoLayoutData } from "./core/autoLayout"

// ============================================================
// P0.7 — Core Infrastructure
// ============================================================

// ECS Core
export {
  ComponentStore,
  EntityBuilder,
  type ComponentMap,
  type ComponentName,
  type IdentityData,
  type GeometryData,
  type ElectricalData,
  type VisualData,
  type MetadataData,
  type RelationshipsData,
  type CapabilityData,
  type ValidationData,
  type LifecycleData,
  type EntityWithComponents,
  type EntityWithData,
  type ComponentStoreEvent,
  type ComponentStoreStats,
  type ComponentStoreSnapshot,
} from "./core/ecs"

// Transaction Engine
export {
  TransactionEngine,
  type Transaction,
  type TransactionStatus,
  type TransactionCommand,
  type TransactionSnapshot,
  type TransactionResult,
  type TransactionEvent,
} from "./core/transactionEngine"

// Project Serializer
export {
  ProjectSerializer,
  type ProjectData,
  type SerializedProject,
} from "./core/projectSerializer"

// Audit Log
export {
  AuditLog,
  type AuditEntry,
  type AuditSource,
  type AuditStats,
} from "./core/auditLog"

// Health API
export {
  HealthApi,
  type HealthReport,
  type SystemMetrics,
} from "./core/healthApi"

// ============================================================
// P0.9 — Engine Facade
// ============================================================

export {
  EngineFacade,
  type ValidationReport,
} from "./facade/engineFacade"

// ============================================================
// P1 — Natural Language Layer
// ============================================================

export {
  IntentDetector,
  GoalEngine,
  type Intent,
  type IntentCategory,
  type Goal,
} from "./ai/intentLayer"

export {
  KnowledgeBase,
  ROOM_KNOWLEDGE,
  DESIGN_PATTERNS,
  type RoomTemplate,
  type DesignPattern,
} from "./ai/knowledgeBase"

export {
  AIMemory,
  type UserPreferences,
  type ConversationTurn,
} from "./ai/aiMemory"

export {
  NaturalLanguageLayer,
  type NLResponse,
} from "./ai/naturalLanguageLayer"

// ============================================================
// P1.5 — Design Intelligence Layer
// ============================================================

export {
  ConstraintEngine,
  type Constraint,
  type ConstraintCategory,
  type EngineeringDecision,
  type ConstraintValidation,
} from "./ai/constraintEngine"

export {
  OptimizationEngine,
  type OptimizationCriteria,
  type OptimizationResult,
} from "./ai/optimizationEngine"

export {
  ReviewEngine,
  type ReviewResult,
  type StageResult,
} from "./ai/reviewEngine"

export {
  DecisionTree,
  type DecisionCategory,
  type DecisionResult,
  type DecisionFactor,
  type NormativeReference,
} from "./ai/decisionTree"

// ============================================================
// P2 — Engineering Model
// ============================================================

export {
  TopologyEngine,
  type TopologyNode,
  type TopologyEdge,
  type TopologyTree,
} from "./ai/topologyEngine"

export {
  ScenarioEngine,
  type Scenario,
  type ScenarioImpact,
} from "./ai/scenarioEngine"

export {
  AlternativeEngine,
  type AlternativeSolution,
  type ComparisonTable,
} from "./ai/alternativeEngine"

export {
  VariantEngine,
  type ProjectVariant,
  type VariantComparison,
} from "./ai/variantEngine"

// ============================================================
// P2.5 — Workflow & Coaching
// ============================================================

export {
  WorkflowEngine,
  type WorkflowStage,
  type ProjectWorkflow,
  type StageId,
  type StageStatus,
  type ReadinessReport,
  type ConfidenceMap,
} from "./ai/workflowEngine"

export {
  CompletenessEngine,
  type CompletenessReport,
  type RoomCompleteness,
  type MissingItem,
} from "./ai/completenessEngine"

export {
  ProjectHealth,
  type ProjectHealthReport,
  type HealthScores,
  type ScoreFactor,
  type Improvement,
} from "./ai/projectHealth"

export {
  ProjectCoach,
  type CoachMessage,
  type MessageType,
  type CoachAction,
} from "./ai/projectCoach"

export {
  SuccessMetrics,
  type TaskMetrics,
  type ProjectMetrics,
  type EfficiencyMetrics,
  type BenchmarkComparison,
} from "./ai/successMetrics"
