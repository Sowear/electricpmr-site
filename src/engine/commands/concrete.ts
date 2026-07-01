// ============================================================
// ElectricPMR — Concrete Command implementations
// ============================================================

import type { Command, CommandResult, CommandChange } from "./command"
import { generateCommandId } from "./command"
import type { UUID, Point } from "../types/common"
import type { Wall, Room, Door, Window, GeometryObject } from "../types/geometry"
import type { ElectricalPoint, CircuitGroup, CableRoute, BreakerSpec, RCDSpec, Panel, PanelEquipment } from "../types/electrical"
import { EventBus } from "../events/eventBus"
import { getDefaultMountingHeight } from "@/engine/pointCatalog"

// ============================================================
// КОМАНДЫ ГЕОМЕТРИИ
// ============================================================

// --- CreateWall ---

interface CreateWallParams {
  points: [Point, Point]
  thickness?: number
  height?: number
  material?: "brick" | "concrete" | "wood" | "drywall" | "glass" | "stone" | "aerated_concrete" | "other"
  isExternal?: boolean
  floor?: number
}

export class CreateWallCommand implements Command {
  readonly id = generateCommandId()
  readonly type = "geometry.wall.create"
  readonly description = "Создать стену"
  readonly timestamp = new Date()

  private wall: Wall | null = null
  private params: CreateWallParams

  constructor(params: CreateWallParams) {
    this.params = params
  }

  execute(): CommandResult {
    this.wall = {
      id: generateCommandId(),
      points: this.params.points,
      thickness: this.params.thickness ?? 200,
      height: this.params.height ?? 2700,
      material: this.params.material ?? "brick",
      isExternal: this.params.isExternal ?? false,
      floor: this.params.floor ?? 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    EventBus.emit({ type: "geometry.wall.created", wall: this.wall })
    return { success: true, data: this.wall }
  }

  undo(): CommandResult {
    if (this.wall) {
      EventBus.emit({ type: "geometry.wall.deleted", wallId: this.wall.id })
    }
    return { success: true }
  }

  redo(): CommandResult {
    if (this.wall) {
      EventBus.emit({ type: "geometry.wall.created", wall: this.wall })
    }
    return { success: true }
  }

  getChanges(): CommandChange[] {
    return this.wall ? [{
      action: "created",
      targetType: "wall",
      targetId: this.wall.id,
      description: this.description,
      after: this.wall,
    }] : []
  }
}

// --- MoveWall ---

export class MoveWallCommand implements Command {
  readonly id = generateCommandId()
  readonly type = "geometry.wall.move"
  readonly description = "Переместить стену"
  readonly timestamp = new Date()

  private wallId: UUID
  private delta: Point
  private wallSnapshot?: { points: [Point, Point] }

  constructor(wallId: UUID, delta: Point, wallCurrentPoints?: [Point, Point]) {
    this.wallId = wallId
    this.delta = delta
    this.wallSnapshot = wallCurrentPoints ? { points: [...wallCurrentPoints] } : undefined
  }

  execute(): CommandResult {
    EventBus.emit({
      type: "geometry.wall.moved",
      wallId: this.wallId,
      from: [0, 0],
      to: [this.delta.x, this.delta.y],
    })
    return { success: true }
  }

  undo(): CommandResult {
    EventBus.emit({
      type: "geometry.wall.moved",
      wallId: this.wallId,
      from: [this.delta.x, this.delta.y],
      to: [0, 0],
    })
    return { success: true }
  }

  redo(): CommandResult { return this.execute() }

  getChanges(): CommandChange[] {
    return [{
      action: "modified",
      targetType: "wall",
      targetId: this.wallId,
      description: this.description,
      before: this.wallSnapshot,
      after: { delta: this.delta },
    }]
  }
}

// --- DeleteWall ---

export class DeleteWallCommand implements Command {
  readonly id = generateCommandId()
  readonly type = "geometry.wall.delete"
  readonly description = "Удалить стену"
  readonly timestamp = new Date()

  private wallId: UUID
  private wallData?: Wall

  constructor(wallId: UUID, wallData?: Wall) {
    this.wallId = wallId
    this.wallData = wallData
  }

  execute(): CommandResult {
    EventBus.emit({ type: "geometry.wall.deleted", wallId: this.wallId })
    return { success: true }
  }

  undo(): CommandResult {
    if (this.wallData) {
      EventBus.emit({ type: "geometry.wall.created", wall: this.wallData })
    }
    return { success: true }
  }

  redo(): CommandResult { return this.execute() }

  getChanges(): CommandChange[] {
    return [{
      action: "removed",
      targetType: "wall",
      targetId: this.wallId,
      description: this.description,
      before: this.wallData,
    }]
  }
}

// --- CreateDoor ---

interface CreateDoorParams {
  wallId: UUID
  position: number
  width?: number
  height?: number
  type?: "single" | "double" | "sliding" | "entrance" | "fire" | "bathroom"
  swing?: "left" | "right" | "sliding" | "none"
}

export class CreateDoorCommand implements Command {
  readonly id = generateCommandId()
  readonly type = "geometry.door.create"
  readonly description = "Добавить дверь"
  readonly timestamp = new Date()

  private door: Door | null = null
  private params: CreateDoorParams

  constructor(params: CreateDoorParams) {
    this.params = params
  }

  execute(): CommandResult {
    this.door = {
      id: generateCommandId(),
      wallId: this.params.wallId,
      position: this.params.position,
      width: this.params.width ?? 800,
      height: this.params.height ?? 2100,
      type: this.params.type ?? "single",
      swing: this.params.swing ?? "left",
      rooms: ["", ""],
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    EventBus.emit({ type: "geometry.door.added", door: this.door })
    return { success: true, data: this.door }
  }

  undo(): CommandResult {
    if (this.door) {
      EventBus.emit({ type: "geometry.door.removed", doorId: this.door.id })
    }
    return { success: true }
  }

  redo(): CommandResult { return this.execute() }

  getChanges(): CommandChange[] {
    return this.door ? [{
      action: "created",
      targetType: "door",
      targetId: this.door.id,
      description: this.description,
      after: this.door,
    }] : []
  }
}

// --- CreateWindow ---

interface CreateWindowParams {
  wallId: UUID
  position: number
  width?: number
  height?: number
  sillHeight?: number
  type?: "standard" | "balcony" | "bay" | "skylight" | "fixed"
}

export class CreateWindowCommand implements Command {
  readonly id = generateCommandId()
  readonly type = "geometry.window.create"
  readonly description = "Добавить окно"
  readonly timestamp = new Date()

  private window: Window | null = null
  private params: CreateWindowParams

  constructor(params: CreateWindowParams) {
    this.params = params
  }

  execute(): CommandResult {
    this.window = {
      id: generateCommandId(),
      wallId: this.params.wallId,
      position: this.params.position,
      width: this.params.width ?? 1200,
      height: this.params.height ?? 1400,
      sillHeight: this.params.sillHeight ?? 900,
      type: this.params.type ?? "standard",
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    EventBus.emit({ type: "geometry.window.added", window: this.window })
    return { success: true, data: this.window }
  }

  undo(): CommandResult {
    if (this.window) {
      EventBus.emit({ type: "geometry.window.removed", windowId: this.window.id })
    }
    return { success: true }
  }

  redo(): CommandResult { return this.execute() }

  getChanges(): CommandChange[] {
    return this.window ? [{
      action: "created",
      targetType: "window",
      targetId: this.window.id,
      description: this.description,
      after: this.window,
    }] : []
  }
}

// ============================================================
// КОМАНДЫ ЭЛЕКТРИКИ
// ============================================================

// --- CreateElectricalPoint ---

interface CreateElectricalPointParams {
  type: ElectricalPoint["type"]
  name: string
  position: Point
  rotation?: number
  floor?: number
  roomId?: UUID
  mountingHeight?: number
  mountingMethod?: "flush" | "surface" | "recessed"
  parameters?: Record<string, unknown>
}

export class CreateElectricalPointCommand implements Command {
  readonly id = generateCommandId()
  readonly type = "electrical.point.create"
  readonly description = "Добавить электроточку"
  readonly timestamp = new Date()

  private point: ElectricalPoint | null = null
  private params: CreateElectricalPointParams

  constructor(params: CreateElectricalPointParams) {
    this.params = params
  }

  execute(): CommandResult {
    this.point = {
      id: generateCommandId(),
      type: this.params.type,
      subtype: this.params.type,
      name: this.params.name,
      position: this.params.position,
      rotation: this.params.rotation ?? 0,
      floor: this.params.floor ?? 1,
      roomId: this.params.roomId,
      mountingHeight: this.params.mountingHeight ?? this.getDefaultHeight(),
      mountingMethod: this.params.mountingMethod ?? "flush",
      connectedTo: [],
      parameters: this.params.parameters ?? {},
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    EventBus.emit({ type: "electrical.point.added", point: this.point })
    return { success: true, data: this.point }
  }

  undo(): CommandResult {
    if (this.point) {
      EventBus.emit({ type: "electrical.point.removed", pointId: this.point.id })
    }
    return { success: true }
  }

  redo(): CommandResult { return this.execute() }

  getChanges(): CommandChange[] {
    return this.point ? [{
      action: "created",
      targetType: "electrical_point",
      targetId: this.point.id,
      description: this.description,
      after: this.point,
    }] : []
  }

  private getDefaultHeight(): number {
    return getDefaultMountingHeight(this.params.type)
  }
}

// --- MoveElectricalPoint ---

export class MoveElectricalPointCommand implements Command {
  readonly id = generateCommandId()
  readonly type = "electrical.point.move"
  readonly description = "Переместить электроточку"
  readonly timestamp = new Date()

  private pointId: UUID
  private from: Point
  private to: Point

  constructor(pointId: UUID, from: Point, to: Point) {
    this.pointId = pointId
    this.from = { ...from }
    this.to = { ...to }
  }

  execute(): CommandResult {
    EventBus.emit({
      type: "electrical.point.moved",
      pointId: this.pointId,
      from: [this.from.x, this.from.y],
      to: [this.to.x, this.to.y],
    })
    return { success: true }
  }

  undo(): CommandResult {
    EventBus.emit({
      type: "electrical.point.moved",
      pointId: this.pointId,
      from: [this.to.x, this.to.y],
      to: [this.from.x, this.from.y],
    })
    return { success: true }
  }

  redo(): CommandResult { return this.execute() }

  getChanges(): CommandChange[] {
    return [{
      action: "modified",
      targetType: "electrical_point",
      targetId: this.pointId,
      description: this.description,
      before: this.from,
      after: this.to,
    }]
  }
}

// --- DeleteElectricalPoint ---

export class DeleteElectricalPointCommand implements Command {
  readonly id = generateCommandId()
  readonly type = "electrical.point.delete"
  readonly description = "Удалить электроточку"
  readonly timestamp = new Date()

  private pointId: UUID
  private pointData?: ElectricalPoint

  constructor(pointId: UUID, pointData?: ElectricalPoint) {
    this.pointId = pointId
    this.pointData = pointData
  }

  execute(): CommandResult {
    EventBus.emit({ type: "electrical.point.removed", pointId: this.pointId })
    return { success: true }
  }

  undo(): CommandResult {
    if (this.pointData) {
      EventBus.emit({ type: "electrical.point.added", point: this.pointData })
    }
    return { success: true }
  }

  redo(): CommandResult { return this.execute() }

  getChanges(): CommandChange[] {
    return [{
      action: "removed",
      targetType: "electrical_point",
      targetId: this.pointId,
      description: this.description,
      before: this.pointData,
    }]
  }
}

// --- CreateCircuit ---

interface CreateCircuitParams {
  name: string
  type: CircuitGroup["type"]
  roomId?: UUID
  floor?: number
  phase?: 1 | 2 | 3
}

export class CreateCircuitCommand implements Command {
  readonly id = generateCommandId()
  readonly type = "electrical.circuit.create"
  readonly description = "Создать группу"
  readonly timestamp = new Date()

  private circuit: CircuitGroup | null = null
  private params: CreateCircuitParams

  constructor(params: CreateCircuitParams) {
    this.params = params
  }

  execute(): CommandResult {
    this.circuit = {
      id: generateCommandId(),
      name: this.params.name,
      type: this.params.type,
      roomId: this.params.roomId,
      floor: this.params.floor ?? 1,
      points: [],
      load: { totalPower: 0, totalCurrent: 0, demandFactor: 1, simultaneousFactor: 1, effectivePower: 0, effectiveCurrent: 0 },
      phase: this.params.phase ?? 1,
      color: this.getPhaseColor(this.params.phase ?? 1),
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    EventBus.emit({ type: "electrical.circuit.created", circuit: this.circuit })
    return { success: true, data: this.circuit }
  }

  undo(): CommandResult {
    if (this.circuit) {
      // Удаление группы — через событие
      EventBus.emit({ type: "electrical.circuit.updated", circuitId: this.circuit.id, changes: {} })
    }
    return { success: true }
  }

  redo(): CommandResult { return this.execute() }

  getChanges(): CommandChange[] {
    return this.circuit ? [{
      action: "created",
      targetType: "circuit",
      targetId: this.circuit.id,
      description: this.description,
      after: this.circuit,
    }] : []
  }

  private getPhaseColor(phase: number): string {
    return phase === 1 ? "#3b82f6" : phase === 2 ? "#ef4444" : "#22c55e"
  }
}

// --- AssignBreaker ---

interface AssignBreakerParams {
  circuitId: UUID
  breaker: BreakerSpec
}

export class AssignBreakerCommand implements Command {
  readonly id = generateCommandId()
  readonly type = "electrical.breaker.assign"
  readonly description = "Назначить автомат"
  readonly timestamp = new Date()

  private params: AssignBreakerParams
  private previousBreakerId?: UUID

  constructor(params: AssignBreakerParams) {
    this.params = params
  }

  execute(): CommandResult {
    EventBus.emit({
      type: "electrical.breaker.assigned",
      circuitId: this.params.circuitId,
      breaker: this.params.breaker,
    })
    return { success: true }
  }

  undo(): CommandResult {
    // Восстановление предыдущего автомата
    return { success: true }
  }

  redo(): CommandResult { return this.execute() }

  getChanges(): CommandChange[] {
    return [{
      action: "assigned",
      targetType: "breaker",
      targetId: this.params.breaker.id,
      description: this.description,
      after: this.params.breaker,
    }]
  }
}

// --- CreatePanel ---

interface CreatePanelParams {
  name: string
  position?: Point
  floor?: number
}

export class CreatePanelCommand implements Command {
  readonly id = generateCommandId()
  readonly type = "electrical.panel.create"
  readonly description = "Создать щит"
  readonly timestamp = new Date()

  private panel: Panel | null = null
  private params: CreatePanelParams

  constructor(params: CreatePanelParams) {
    this.params = params
  }

  execute(): CommandResult {
    this.panel = {
      id: generateCommandId(),
      name: this.params.name,
      position: this.params.position,
      floor: this.params.floor ?? 1,
      equipment: [],
      rails: [],
      busbars: [],
      totalWidth: 0,
      totalHeight: 0,
      rows: 0,
      ipRating: "IP31",
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    EventBus.emit({ type: "electrical.panel.created", panel: this.panel })
    return { success: true, data: this.panel }
  }

  undo(): CommandResult {
    return { success: true }
  }

  redo(): CommandResult { return this.execute() }

  getChanges(): CommandChange[] {
    return this.panel ? [{
      action: "created",
      targetType: "panel",
      targetId: this.panel.id,
      description: this.description,
      after: this.panel,
    }] : []
  }
}

// ============================================================
// УТИЛИТА: Создание команды по типу
// ============================================================

export function createCommand(type: string, params: Record<string, unknown>): Command | null {
  switch (type) {
    case "geometry.wall.create":
      return new CreateWallCommand(params as CreateWallParams)
    case "geometry.wall.move":
      return new MoveWallCommand(
        params.wallId as UUID,
        params.delta as Point,
        params.currentPoints as [Point, Point]
      )
    case "geometry.wall.delete":
      return new DeleteWallCommand(params.wallId as UUID, params.wallData as Wall)
    case "geometry.door.create":
      return new CreateDoorCommand(params as CreateDoorParams)
    case "geometry.window.create":
      return new CreateWindowCommand(params as CreateWindowParams)
    case "electrical.point.create":
      return new CreateElectricalPointCommand(params as CreateElectricalPointParams)
    case "electrical.point.move":
      return new MoveElectricalPointCommand(
        params.pointId as UUID,
        params.from as Point,
        params.to as Point
      )
    case "electrical.point.delete":
      return new DeleteElectricalPointCommand(params.pointId as UUID, params.pointData as ElectricalPoint)
    case "electrical.circuit.create":
      return new CreateCircuitCommand(params as CreateCircuitParams)
    case "electrical.breaker.assign":
      return new AssignBreakerCommand(params as AssignBreakerParams)
    case "electrical.panel.create":
      return new CreatePanelCommand(params as CreatePanelParams)
    default:
      return null
  }
}
