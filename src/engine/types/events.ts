// ============================================================
// ElectricPMR Core Types — Events (all system events)
// ============================================================

import type { UUID } from "./common"
import type { Wall, Room, Door, Window, GeometryObject } from "./geometry"
import type {
  ElectricalPoint, CircuitGroup, CableSpec, CableRoute,
  BreakerSpec, RCDSpec, Panel, PanelEquipment, LoadCalculation,
  PhaseBalance, VoltageDrop
} from "./electrical"
import type { ValidationIssue } from "./common"
import type { UserTask, TaskResult } from "./ai"

// ============================================================
// GEOMETRY EVENTS
// ============================================================

export type GeometryEvent =
  | { type: "geometry.wall.created"; wall: Wall }
  | { type: "geometry.wall.moved"; wallId: string; from: [number, number]; to: [number, number] }
  | { type: "geometry.wall.deleted"; wallId: string }
  | { type: "geometry.wall.split"; wallId: string; newWalls: [string, string] }
  | { type: "geometry.room.detected"; room: Room }
  | { type: "geometry.room.renamed"; roomId: string; name: string }
  | { type: "geometry.room.area.changed"; roomId: string; area: number }
  | { type: "geometry.door.added"; door: Door }
  | { type: "geometry.door.removed"; doorId: string }
  | { type: "geometry.window.added"; window: Window }
  | { type: "geometry.window.removed"; windowId: string }
  | { type: "geometry.object.placed"; object: GeometryObject }
  | { type: "geometry.object.moved"; objectId: string; from: [number, number]; to: [number, number] }
  | { type: "geometry.object.removed"; objectId: string }
  | { type: "geometry.scene.imported"; source: string; objectCount: number }

// ============================================================
// ELECTRICAL EVENTS
// ============================================================

export type ElectricalEvent =
  | { type: "electrical.point.added"; point: ElectricalPoint }
  | { type: "electrical.point.moved"; pointId: string; from: [number, number]; to: [number, number] }
  | { type: "electrical.point.removed"; pointId: string }
  | { type: "electrical.point.type.changed"; pointId: string; from: string; to: string }
  | { type: "electrical.circuit.created"; circuit: CircuitGroup }
  | { type: "electrical.circuit.updated"; circuitId: string; changes: Partial<CircuitGroup> }
  | { type: "electrical.circuit.merged"; circuitIds: string[]; result: CircuitGroup }
  | { type: "electrical.circuit.split"; circuitId: string; results: CircuitGroup[] }
  | { type: "electrical.cable.assigned"; route: CableRoute }
  | { type: "electrical.cable.length.changed"; cableId: string; from: number; to: number }
  | { type: "electrical.breaker.assigned"; circuitId: string; breaker: BreakerSpec }
  | { type: "electrical.rcd.assigned"; panelId: string; rcd: RCDSpec }
  | { type: "electrical.panel.created"; panel: Panel }
  | { type: "electrical.panel.equipment.added"; panelId: string; equipment: PanelEquipment }
  | { type: "electrical.panel.equipment.moved"; panelId: string; equipmentId: string; from: number; to: number }
  | { type: "electrical.panel.layout.changed"; panelId: string }

// ============================================================
// CALCULATION EVENTS
// ============================================================

export type CalculationEvent =
  | { type: "calculation.load.updated"; scope: string; load: LoadCalculation }
  | { type: "calculation.phase.imbalanced"; balance: PhaseBalance }
  | { type: "calculation.voltage.drop.exceeded"; drop: VoltageDrop }
  | { type: "calculation.all.updated"; totalLoad: LoadCalculation; balance: PhaseBalance }

// ============================================================
// VALIDATION EVENTS
// ============================================================

export type ValidationEvent =
  | { type: "validation.error.found"; issue: ValidationIssue }
  | { type: "validation.warning.found"; issue: ValidationIssue }
  | { type: "validation.cleared"; scope: string }
  | { type: "validation.project.checked"; result: { errors: number; warnings: number; infos: number } }

// ============================================================
// LIFECYCLE EVENTS
// ============================================================

export type LifecycleEvent =
  | { type: "project.phase.changed"; from: string; to: string }
  | { type: "project.status.changed"; status: string }
  | { type: "project.approved"; by: string }
  | { type: "project.version.created"; version: string }

// ============================================================
// AI EVENTS
// ============================================================

export type AIEvent =
  | { type: "ai.task.started"; task: UserTask }
  | { type: "ai.task.completed"; result: TaskResult }
  | { type: "ai.task.failed"; taskId: string; error: string }
  | { type: "ai.recommendation.created"; recommendation: string; scope: string }

// ============================================================
// PROCUREMENT EVENTS
// ============================================================

export type ProcurementEvent =
  | { type: "procurement.item.added"; itemId: string; name: string; quantity: number; price: number }
  | { type: "procurement.item.removed"; itemId: string }
  | { type: "procurement.item.ordered"; itemId: string }
  | { type: "procurement.item.delivered"; itemId: string }
  | { type: "procurement.total.changed"; total: number }

// ============================================================
// INSTALLATION EVENTS
// ============================================================

export type InstallationEvent =
  | { type: "installation.task.created"; taskId: string; description: string }
  | { type: "installation.task.completed"; taskId: string; by: string }
  | { type: "installation.photo.added"; taskId: string; photoUrl: string }

// ============================================================
// UNION TYPE
// ============================================================

export type SystemEvent =
  | GeometryEvent
  | ElectricalEvent
  | CalculationEvent
  | ValidationEvent
  | LifecycleEvent
  | AIEvent
  | ProcurementEvent
  | InstallationEvent

export type EventType = SystemEvent["type"]
