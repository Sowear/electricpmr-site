// ============================================================
// ElectricPMR — Universal Object Model
// ============================================================
//
// Единый источник истины для всех объектов проекта.
// Объекты создаются комбинацией компонентов, а не наследованием.
// ============================================================

import type { UUID } from "../types/common"

// ============================================================
// COMPONENT INTERFACES
// ============================================================

// --- Identity Component ---
// Уникальный идентификатор и базовая информация

export interface IdentityComponent {
  id: UUID
  name: string
  type: ObjectType
  version: number
  createdAt: Date
  modifiedAt: Date
}

// --- Geometry Component ---
// Пространственная позиция и форма

export interface GeometryComponent {
  position: { x: number; y: number }
  rotation: number // градусы
  size: { width: number; height: number }
  points?: Array<{ x: number; y: number }> // для стен, полигонов
  zLevel?: number // для многоуровневых объектов
}

// --- Electrical Component ---
// Электрические параметры

export interface ElectricalComponent {
  power?: number // Вт
  voltage?: number // В
  current?: number // А
  phase?: 1 | 2 | 3
  circuitId?: UUID
  panelId?: UUID
  breakerType?: string
  breakerRating?: number // А
  rcdType?: "none" | "AC" | "A" | "B"
  rcdRating?: number // мА
}

// --- Visual Component ---
// Визуальное представление для Canvas

export interface VisualComponent {
  shape: "rect" | "circle" | "polygon" | "line" | "path"
  fill: string
  stroke: string
  strokeWidth: number
  opacity: number
  layer: VisualLayer
  icon?: string // SVG path или имя иконки
  label?: string
  labelOffset?: { x: number; y: number }
  dimensions?: {
    width: number
    height: number
    minWidth?: number
    minHeight?: number
  }
}

export type VisualLayer =
  | "background"
  | "floor"
  | "walls"
  | "electrical"
  | "furniture"
  | "overlay"
  | "selection"

// --- Metadata Component ---
// Произвольные данные

export interface MetadataComponent {
  tags: string[]
  custom: Record<string, unknown>
  manufacturer?: string
  model?: string
  articleNumber?: string
  price?: number
  currency?: string
}

// --- Relationships Component ---
// Связи с другими объектами

export interface RelationshipsComponent {
  parent?: UUID
  children: UUID[]
  containedIn?: UUID // комната
  connectedTo: UUID[] // электрические соединения
  mountedOn?: UUID // стена, потолок
  belongsTo?: UUID // группа, щит
  referencedBy: UUID[] // обратные ссылки
}

// --- Capability Component ---
// Что умеет делать объект

export interface CapabilityComponent {
  canRotate: boolean
  canResize: boolean
  canMove: boolean
  canDelete: boolean
  canConnectCable: boolean
  canContainObjects: boolean
  canCarryLoad: boolean
  canMountOnWall: boolean
  canMountOnCeiling: boolean
  canSplitCircuit: boolean
  canGenerateDocument: boolean
  canBeGrouped: boolean
  canBeCopied: boolean
  hasTerminals: boolean
  supportsPhase: boolean
  supportsRCD: boolean
  requiresRoom: boolean
}

// --- Validation Component ---
// Правила валидации

export interface ValidationComponent {
  rules: ValidationRule[]
  lastValidated?: Date
  lastResult?: ValidationResult
}

export interface ValidationRule {
  id: string
  name: string
  description: string
  severity: "error" | "warning" | "info"
  check: (obj: UniversalObject, context: ValidationContext) => ValidationCheckResult
}

export interface ValidationCheckResult {
  valid: boolean
  message?: string
  fix?: string
}

export interface ValidationResult {
  valid: boolean
  errors: string[]
  warnings: string[]
  infos: string[]
}

export interface ValidationContext {
  allObjects: UniversalObject[]
  room?: UniversalObject
  circuit?: UniversalObject
  panel?: UniversalObject
}

// --- Lifecycle Component ---
// Состояние жизненного цикла

export interface LifecycleComponent {
  status: LifecycleStatus
  phase: ProjectPhase
  assignedTo?: string
  dueDate?: Date
  completedAt?: Date
  approvedBy?: string
  approvedAt?: Date
}

export type LifecycleStatus =
  | "draft"
  | "in_progress"
  | "pending_review"
  | "approved"
  | "rejected"
  | "installed"
  | "active"
  | "maintenance"
  | "decommissioned"

export type ProjectPhase =
  | "design"
  | "review"
  | "procurement"
  | "installation"
  | "commissioning"
  | "operation"
  | "maintenance"
  | "retrofit"

// ============================================================
// UNIVERSAL OBJECT
// ============================================================

export interface UniversalObject {
  identity: IdentityComponent
  geometry?: GeometryComponent
  electrical?: ElectricalComponent
  visual?: VisualComponent
  metadata?: MetadataComponent
  relationships?: RelationshipsComponent
  capabilities?: CapabilityComponent
  validation?: ValidationComponent
  lifecycle?: LifecycleComponent
}

// ============================================================
// OBJECT TYPES
// ============================================================

export type ObjectType =
  // Архитектура
  | "wall"
  | "door"
  | "window"
  | "room"
  | "floor"
  | "ceiling"
  | "opening"
  // Электрика
  | "outlet"
  | "outlet_waterproof"
  | "outlet_triple"
  | "outlet_industrial"
  | "switch"
  | "switch_pass_through"
  | "switch_motion"
  | "switch_voice"
  | "dimmer"
  | "light_ceiling"
  | "light_wall"
  | "light_spot"
  | "light_strip"
  | "light_outdoor"
  | "sensor_smoke"
  | "sensor_motion"
  | "sensor_temp"
  | "sensor_leak"
  | "sensor_gas"
  | "jbox"
  | "junction_box"
  | "cable_tray"
  | "conduit"
  | "cable"
  // Щиты и оборудование
  | "panel"
  | "breaker"
  | "rcd"
  | "rcbo"
  | "contactor"
  | "relay"
  | "transformer"
  | "ups"
  | "generator"
  // Устройства
  | "appliance"
  | "socket_group"
  | "light_group"
  // Контейнеры
  | "group"
  | "floor_plan"
  | "project"

// ============================================================
// COMPONENT PRESETS
// ============================================================

// Шаблоны компонентов для типичных объектов

export const ComponentPresets: Record<ObjectType, Partial<Record<keyof UniversalObject, unknown>>> = {
  wall: {
    geometry: {
      position: { x: 0, y: 0 },
      rotation: 0,
      size: { width: 4000, height: 200 },
      points: [],
    },
    visual: {
      shape: "rect",
      fill: "#E8E4DE",
      stroke: "#8B7355",
      strokeWidth: 2,
      opacity: 1,
      layer: "walls",
    },
    metadata: {
      tags: ["wall", "structure"],
      custom: { material: "brick", thickness: 200 },
    },
    capabilities: {
      canRotate: true,
      canResize: true,
      canMove: true,
      canDelete: true,
      canConnectCable: false,
      canContainObjects: false,
      canCarryLoad: true,
      canMountOnWall: false,
      canMountOnCeiling: false,
      canSplitCircuit: false,
      canGenerateDocument: false,
      canBeGrouped: true,
      canBeCopied: true,
      hasTerminals: false,
      supportsPhase: false,
      supportsRCD: false,
      requiresRoom: false,
    },
  },

  outlet: {
    geometry: {
      position: { x: 0, y: 0 },
      rotation: 0,
      size: { width: 72, height: 72 },
    },
    electrical: {
      power: 0,
      voltage: 220,
      current: 16,
    },
    visual: {
      shape: "circle",
      fill: "#FFFFFF",
      stroke: "#2563EB",
      strokeWidth: 2,
      opacity: 1,
      layer: "electrical",
      icon: "outlet",
      dimensions: { width: 72, height: 72, minWidth: 36, minHeight: 36 },
    },
    metadata: {
      tags: ["electrical", "outlet"],
      custom: { mountingHeight: 300 },
    },
    relationships: {
      children: [],
      connectedTo: [],
      referencedBy: [],
    },
    capabilities: {
      canRotate: true,
      canResize: false,
      canMove: true,
      canDelete: true,
      canConnectCable: true,
      canContainObjects: false,
      canCarryLoad: false,
      canMountOnWall: true,
      canMountOnCeiling: false,
      canSplitCircuit: false,
      canGenerateDocument: true,
      canBeGrouped: true,
      canBeCopied: true,
      hasTerminals: true,
      supportsPhase: false,
      supportsRCD: false,
      requiresRoom: true,
    },
    validation: {
      rules: [
        {
          id: "outlet_min_height",
          name: "Минимальная высота розетки",
          description: "Розетки должны быть на высоте ≥300мм от пола",
          severity: "warning",
          check: (obj, ctx) => ({
            valid: (obj.metadata?.custom.mountingHeight ?? 0) >= 300,
            message: "Розетка ниже 300мм от пола",
          }),
        },
      ],
    },
  },

  switch: {
    geometry: {
      position: { x: 0, y: 0 },
      rotation: 0,
      size: { width: 72, height: 72 },
    },
    electrical: {},
    visual: {
      shape: "circle",
      fill: "#FFFFFF",
      stroke: "#F59E0B",
      strokeWidth: 2,
      opacity: 1,
      layer: "electrical",
      icon: "switch",
      dimensions: { width: 72, height: 72, minWidth: 36, minHeight: 36 },
    },
    metadata: {
      tags: ["electrical", "switch"],
      custom: { mountingHeight: 900, switchType: "single" },
    },
    relationships: {
      children: [],
      connectedTo: [],
      referencedBy: [],
    },
    capabilities: {
      canRotate: true,
      canResize: false,
      canMove: true,
      canDelete: true,
      canConnectCable: true,
      canContainObjects: false,
      canCarryLoad: false,
      canMountOnWall: true,
      canMountOnCeiling: false,
      canSplitCircuit: false,
      canGenerateDocument: true,
      canBeGrouped: true,
      canBeCopied: true,
      hasTerminals: true,
      supportsPhase: false,
      supportsRCD: false,
      requiresRoom: true,
    },
  },

  light_ceiling: {
    geometry: {
      position: { x: 0, y: 0 },
      rotation: 0,
      size: { width: 120, height: 120 },
    },
    electrical: {
      power: 60,
      voltage: 220,
      current: 0.27,
    },
    visual: {
      shape: "circle",
      fill: "#FEF3C7",
      stroke: "#D97706",
      strokeWidth: 2,
      opacity: 1,
      layer: "electrical",
      icon: "light",
      dimensions: { width: 120, height: 120, minWidth: 60, minHeight: 60 },
    },
    metadata: {
      tags: ["electrical", "light", "ceiling"],
      custom: { lumens: 800, colorTemp: 4000 },
    },
    relationships: {
      children: [],
      connectedTo: [],
      referencedBy: [],
    },
    capabilities: {
      canRotate: false,
      canResize: false,
      canMove: true,
      canDelete: true,
      canConnectCable: true,
      canContainObjects: false,
      canCarryLoad: false,
      canMountOnWall: false,
      canMountOnCeiling: true,
      canSplitCircuit: false,
      canGenerateDocument: true,
      canBeGrouped: true,
      canBeCopied: true,
      hasTerminals: true,
      supportsPhase: false,
      supportsRCD: false,
      requiresRoom: true,
    },
  },

  panel: {
    geometry: {
      position: { x: 0, y: 0 },
      rotation: 0,
      size: { width: 400, height: 600 },
    },
    electrical: {
      voltage: 220,
    },
    visual: {
      shape: "rect",
      fill: "#F3F4F6",
      stroke: "#374151",
      strokeWidth: 2,
      opacity: 1,
      layer: "electrical",
      icon: "panel",
      dimensions: { width: 400, height: 600, minWidth: 200, minHeight: 300 },
    },
    metadata: {
      tags: ["electrical", "panel", "distribution"],
      custom: { maxModules: 36, mountingType: "wall" },
    },
    relationships: {
      children: [],
      connectedTo: [],
      referencedBy: [],
    },
    capabilities: {
      canRotate: false,
      canResize: false,
      canMove: true,
      canDelete: true,
      canConnectCable: true,
      canContainObjects: true,
      canCarryLoad: false,
      canMountOnWall: true,
      canMountOnCeiling: false,
      canSplitCircuit: true,
      canGenerateDocument: true,
      canBeGrouped: false,
      canBeCopied: true,
      hasTerminals: true,
      supportsPhase: true,
      supportsRCD: true,
      requiresRoom: false,
    },
  },

  breaker: {
    geometry: {
      position: { x: 0, y: 0 },
      rotation: 0,
      size: { width: 18, height: 80 },
    },
    electrical: {
      current: 16,
      breakerType: "C",
      breakerRating: 16,
    },
    visual: {
      shape: "rect",
      fill: "#FFFFFF",
      stroke: "#1F2937",
      strokeWidth: 1,
      opacity: 1,
      layer: "electrical",
      icon: "breaker",
      dimensions: { width: 18, height: 80, minWidth: 18, minHeight: 80 },
    },
    metadata: {
      tags: ["electrical", "protection", "breaker"],
      custom: { curve: "C", poles: 1 },
    },
    relationships: {
      children: [],
      connectedTo: [],
      referencedBy: [],
    },
    capabilities: {
      canRotate: false,
      canResize: false,
      canMove: true,
      canDelete: true,
      canConnectCable: false,
      canContainObjects: false,
      canCarryLoad: true,
      canMountOnWall: false,
      canMountOnCeiling: false,
      canSplitCircuit: true,
      canGenerateDocument: true,
      canBeGrouped: false,
      canBeCopied: true,
      hasTerminals: true,
      supportsPhase: true,
      supportsRCD: false,
      requiresRoom: false,
    },
    validation: {
      rules: [
        {
          id: "breaker_rating_valid",
          name: "Корректный номинал автомата",
          description: "Номинал автомата должен соответствовать допустимым значениям",
          severity: "error",
          check: (obj, ctx) => {
            const rating = obj.electrical?.breakerRating ?? 0
            const validRatings = [6, 10, 16, 20, 25, 32, 40, 50, 63]
            return {
              valid: validRatings.includes(rating),
              message: `Номинал ${rating}А не является стандартным`,
            }
          },
        },
      ],
    },
  },

  rcd: {
    geometry: {
      position: { x: 0, y: 0 },
      rotation: 0,
      size: { width: 36, height: 80 },
    },
    electrical: {
      current: 25,
      rcdType: "AC",
      rcdRating: 30,
    },
    visual: {
      shape: "rect",
      fill: "#FFFFFF",
      stroke: "#059669",
      strokeWidth: 2,
      opacity: 1,
      layer: "electrical",
      icon: "rcd",
      dimensions: { width: 36, height: 80, minWidth: 36, minHeight: 80 },
    },
    metadata: {
      tags: ["electrical", "protection", "rcd"],
      custom: { type: "AC", ratingMA: 30 },
    },
    relationships: {
      children: [],
      connectedTo: [],
      referencedBy: [],
    },
    capabilities: {
      canRotate: false,
      canResize: false,
      canMove: true,
      canDelete: true,
      canConnectCable: false,
      canContainObjects: false,
      canCarryLoad: true,
      canMountOnWall: false,
      canMountOnCeiling: false,
      canSplitCircuit: true,
      canGenerateDocument: true,
      canBeGrouped: false,
      canBeCopied: true,
      hasTerminals: true,
      supportsPhase: true,
      supportsRCD: false,
      requiresRoom: false,
    },
  },

  room: {
    geometry: {
      position: { x: 0, y: 0 },
      rotation: 0,
      size: { width: 4000, height: 3000 },
      points: [],
    },
    visual: {
      shape: "polygon",
      fill: "#F8FAFC",
      stroke: "#CBD5E1",
      strokeWidth: 1,
      opacity: 0.5,
      layer: "floor",
    },
    metadata: {
      tags: ["room"],
      custom: { roomType: "living", area: 12 },
    },
    relationships: {
      children: [],
      connectedTo: [],
      referencedBy: [],
    },
    capabilities: {
      canRotate: false,
      canResize: true,
      canMove: false,
      canDelete: true,
      canConnectCable: false,
      canContainObjects: true,
      canCarryLoad: false,
      canMountOnWall: false,
      canMountOnCeiling: false,
      canSplitCircuit: false,
      canGenerateDocument: true,
      canBeGrouped: false,
      canBeCopied: false,
      hasTerminals: false,
      supportsPhase: false,
      supportsRCD: false,
      requiresRoom: false,
    },
  },

  door: {
    geometry: {
      position: { x: 0, y: 0 },
      rotation: 0,
      size: { width: 900, height: 100 },
    },
    visual: {
      shape: "rect",
      fill: "#D4A574",
      stroke: "#8B6914",
      strokeWidth: 2,
      opacity: 1,
      layer: "walls",
    },
    metadata: {
      tags: ["architecture", "door"],
      custom: { doorType: "single", openingType: "swing_left" },
    },
    capabilities: {
      canRotate: true,
      canResize: true,
      canMove: true,
      canDelete: true,
      canConnectCable: false,
      canContainObjects: false,
      canCarryLoad: false,
      canMountOnWall: true,
      canMountOnCeiling: false,
      canSplitCircuit: false,
      canGenerateDocument: true,
      canBeGrouped: true,
      canBeCopied: true,
      hasTerminals: false,
      supportsPhase: false,
      supportsRCD: false,
      requiresRoom: false,
    },
  },

  window: {
    geometry: {
      position: { x: 0, y: 0 },
      rotation: 0,
      size: { width: 1200, height: 100 },
    },
    visual: {
      shape: "rect",
      fill: "#BFDBFE",
      stroke: "#1D4ED8",
      strokeWidth: 1,
      opacity: 0.8,
      layer: "walls",
    },
    metadata: {
      tags: ["architecture", "window"],
      custom: { windowType: "single", sillHeight: 900 },
    },
    capabilities: {
      canRotate: false,
      canResize: true,
      canMove: true,
      canDelete: true,
      canConnectCable: false,
      canContainObjects: false,
      canCarryLoad: false,
      canMountOnWall: true,
      canMountOnCeiling: false,
      canSplitCircuit: false,
      canGenerateDocument: true,
      canBeGrouped: true,
      canBeCopied: true,
      hasTerminals: false,
      supportsPhase: false,
      supportsRCD: false,
      requiresRoom: false,
    },
  },

  sensor_smoke: {
    geometry: {
      position: { x: 0, y: 0 },
      rotation: 0,
      size: { width: 60, height: 60 },
    },
    electrical: {
      power: 0.5,
      voltage: 220,
      current: 0.002,
    },
    visual: {
      shape: "circle",
      fill: "#FFFFFF",
      stroke: "#DC2626",
      strokeWidth: 2,
      opacity: 1,
      layer: "electrical",
      icon: "sensor_smoke",
      dimensions: { width: 60, height: 60 },
    },
    metadata: {
      tags: ["electrical", "sensor", "safety", "smoke"],
      custom: { sensorType: "smoke", sensitivity: "medium" },
    },
    relationships: {
      children: [],
      connectedTo: [],
      referencedBy: [],
    },
    capabilities: {
      canRotate: false,
      canResize: false,
      canMove: true,
      canDelete: true,
      canConnectCable: true,
      canContainObjects: false,
      canCarryLoad: false,
      canMountOnWall: false,
      canMountOnCeiling: true,
      canSplitCircuit: false,
      canGenerateDocument: true,
      canBeGrouped: false,
      canBeCopied: true,
      hasTerminals: true,
      supportsPhase: false,
      supportsRCD: false,
      requiresRoom: true,
    },
  },

  appliance: {
    geometry: {
      position: { x: 0, y: 0 },
      rotation: 0,
      size: { width: 600, height: 600 },
    },
    electrical: {
      power: 2000,
      voltage: 220,
      current: 9.1,
    },
    visual: {
      shape: "rect",
      fill: "#E5E7EB",
      stroke: "#6B7280",
      strokeWidth: 1,
      opacity: 0.8,
      layer: "furniture",
      icon: "appliance",
    },
    metadata: {
      tags: ["appliance"],
      custom: { applianceType: "dishwasher" },
    },
    relationships: {
      children: [],
      connectedTo: [],
      referencedBy: [],
    },
    capabilities: {
      canRotate: true,
      canResize: false,
      canMove: true,
      canDelete: true,
      canConnectCable: false,
      canContainObjects: false,
      canCarryLoad: false,
      canMountOnWall: false,
      canMountOnCeiling: false,
      canSplitCircuit: false,
      canGenerateDocument: true,
      canBeGrouped: false,
      canBeCopied: false,
      hasTerminals: false,
      supportsPhase: false,
      supportsRCD: false,
      requiresRoom: true,
    },
  },

  group: {
    geometry: {
      position: { x: 0, y: 0 },
      rotation: 0,
      size: { width: 0, height: 0 },
    },
    visual: {
      shape: "rect",
      fill: "transparent",
      stroke: "#9333EA",
      strokeWidth: 2,
      opacity: 0.5,
      layer: "overlay",
    },
    metadata: {
      tags: ["group"],
      custom: {},
    },
    relationships: {
      children: [],
      connectedTo: [],
      referencedBy: [],
    },
    capabilities: {
      canRotate: true,
      canResize: true,
      canMove: true,
      canDelete: true,
      canConnectCable: false,
      canContainObjects: true,
      canCarryLoad: false,
      canMountOnWall: false,
      canMountOnCeiling: false,
      canSplitCircuit: false,
      canGenerateDocument: false,
      canBeGrouped: false,
      canBeCopied: true,
      hasTerminals: false,
      supportsPhase: false,
      supportsRCD: false,
      requiresRoom: false,
    },
  },

  // Заглушки для остальных типов
  cable: { metadata: { tags: ["electrical", "cable"], custom: {} }, capabilities: { canRotate: true, canResize: true, canMove: true, canDelete: true, canConnectCable: true, canContainObjects: false, canCarryLoad: false, canMountOnWall: false, canMountOnCeiling: false, canSplitCircuit: false, canGenerateDocument: true, canBeGrouped: false, canBeCopied: true, hasTerminals: true, supportsPhase: true, supportsRCD: false, requiresRoom: false } },
  conduit: { metadata: { tags: ["electrical", "conduit"], custom: {} }, capabilities: { canRotate: true, canResize: true, canMove: true, canDelete: true, canConnectCable: true, canContainObjects: false, canCarryLoad: false, canMountOnWall: true, canMountOnCeiling: true, canSplitCircuit: false, canGenerateDocument: true, canBeGrouped: false, canBeCopied: true, hasTerminals: false, supportsPhase: false, supportsRCD: false, requiresRoom: false } },
  cable_tray: { metadata: { tags: ["electrical", "cable_tray"], custom: {} }, capabilities: { canRotate: true, canResize: true, canMove: true, canDelete: true, canConnectCable: true, canContainObjects: false, canCarryLoad: true, canMountOnWall: true, canMountOnCeiling: true, canSplitCircuit: false, canGenerateDocument: true, canBeGrouped: false, canBeCopied: true, hasTerminals: false, supportsPhase: false, supportsRCD: false, requiresRoom: false } },
  jbox: { metadata: { tags: ["electrical", "junction"], custom: {} }, capabilities: { canRotate: true, canResize: false, canMove: true, canDelete: true, canConnectCable: true, canContainObjects: false, canCarryLoad: false, canMountOnWall: true, canMountOnCeiling: true, canSplitCircuit: false, canGenerateDocument: true, canBeGrouped: false, canBeCopied: true, hasTerminals: true, supportsPhase: false, supportsRCD: false, requiresRoom: false } },
  junction_box: { metadata: { tags: ["electrical", "junction"], custom: {} }, capabilities: { canRotate: true, canResize: false, canMove: true, canDelete: true, canConnectCable: true, canContainObjects: false, canCarryLoad: false, canMountOnWall: true, canMountOnCeiling: true, canSplitCircuit: false, canGenerateDocument: true, canBeGrouped: false, canBeCopied: true, hasTerminals: true, supportsPhase: false, supportsRCD: false, requiresRoom: false } },
  outlet_waterproof: { metadata: { tags: ["electrical", "outlet", "waterproof"], custom: { ipRating: "IP44" } }, capabilities: { canRotate: true, canResize: false, canMove: true, canDelete: true, canConnectCable: true, canContainObjects: false, canCarryLoad: false, canMountOnWall: true, canMountOnCeiling: false, canSplitCircuit: false, canGenerateDocument: true, canBeGrouped: true, canBeCopied: true, hasTerminals: true, supportsPhase: false, supportsRCD: false, requiresRoom: true } },
  outlet_triple: { metadata: { tags: ["electrical", "outlet", "triple"], custom: { gang: 3 } }, capabilities: { canRotate: true, canResize: false, canMove: true, canDelete: true, canConnectCable: true, canContainObjects: false, canCarryLoad: false, canMountOnWall: true, canMountOnCeiling: false, canSplitCircuit: false, canGenerateDocument: true, canBeGrouped: true, canBeCopied: true, hasTerminals: true, supportsPhase: false, supportsRCD: false, requiresRoom: true } },
  outlet_industrial: { metadata: { tags: ["electrical", "outlet", "industrial"], custom: { ipRating: "IP67" } }, capabilities: { canRotate: true, canResize: false, canMove: true, canDelete: true, canConnectCable: true, canContainObjects: false, canCarryLoad: false, canMountOnWall: true, canMountOnCeiling: false, canSplitCircuit: false, canGenerateDocument: true, canBeGrouped: true, canBeCopied: true, hasTerminals: true, supportsPhase: true, supportsRCD: false, requiresRoom: true } },
  switch_pass_through: { metadata: { tags: ["electrical", "switch", "pass_through"], custom: {} }, capabilities: { canRotate: true, canResize: false, canMove: true, canDelete: true, canConnectCable: true, canContainObjects: false, canCarryLoad: false, canMountOnWall: true, canMountOnCeiling: false, canSplitCircuit: false, canGenerateDocument: true, canBeGrouped: true, canBeCopied: true, hasTerminals: true, supportsPhase: false, supportsRCD: false, requiresRoom: true } },
  switch_motion: { metadata: { tags: ["electrical", "switch", "motion"], custom: {} }, capabilities: { canRotate: true, canResize: false, canMove: true, canDelete: true, canConnectCable: true, canContainObjects: false, canCarryLoad: false, canMountOnWall: true, canMountOnCeiling: false, canSplitCircuit: false, canGenerateDocument: true, canBeGrouped: true, canBeCopied: true, hasTerminals: true, supportsPhase: false, supportsRCD: false, requiresRoom: true } },
  switch_voice: { metadata: { tags: ["electrical", "switch", "voice"], custom: {} }, capabilities: { canRotate: true, canResize: false, canMove: true, canDelete: true, canConnectCable: true, canContainObjects: false, canCarryLoad: false, canMountOnWall: true, canMountOnCeiling: false, canSplitCircuit: false, canGenerateDocument: true, canBeGrouped: true, canBeCopied: true, hasTerminals: true, supportsPhase: false, supportsRCD: false, requiresRoom: true } },
  dimmer: { metadata: { tags: ["electrical", "dimmer"], custom: {} }, capabilities: { canRotate: true, canResize: false, canMove: true, canDelete: true, canConnectCable: true, canContainObjects: false, canCarryLoad: false, canMountOnWall: true, canMountOnCeiling: false, canSplitCircuit: false, canGenerateDocument: true, canBeGrouped: true, canBeCopied: true, hasTerminals: true, supportsPhase: false, supportsRCD: false, requiresRoom: true } },
  light_wall: { metadata: { tags: ["electrical", "light", "wall"], custom: {} }, capabilities: { canRotate: true, canResize: false, canMove: true, canDelete: true, canConnectCable: true, canContainObjects: false, canCarryLoad: false, canMountOnWall: true, canMountOnCeiling: false, canSplitCircuit: false, canGenerateDocument: true, canBeGrouped: true, canBeCopied: true, hasTerminals: true, supportsPhase: false, supportsRCD: false, requiresRoom: true } },
  light_spot: { metadata: { tags: ["electrical", "light", "spot"], custom: {} }, capabilities: { canRotate: true, canResize: false, canMove: true, canDelete: true, canConnectCable: true, canContainObjects: false, canCarryLoad: false, canMountOnWall: false, canMountOnCeiling: true, canSplitCircuit: false, canGenerateDocument: true, canBeGrouped: true, canBeCopied: true, hasTerminals: true, supportsPhase: false, supportsRCD: false, requiresRoom: true } },
  light_strip: { metadata: { tags: ["electrical", "light", "strip"], custom: {} }, capabilities: { canRotate: true, canResize: true, canMove: true, canDelete: true, canConnectCable: true, canContainObjects: false, canCarryLoad: false, canMountOnWall: true, canMountOnCeiling: true, canSplitCircuit: false, canGenerateDocument: true, canBeGrouped: true, canBeCopied: true, hasTerminals: true, supportsPhase: false, supportsRCD: false, requiresRoom: true } },
  light_outdoor: { metadata: { tags: ["electrical", "light", "outdoor"], custom: { ipRating: "IP65" } }, capabilities: { canRotate: true, canResize: false, canMove: true, canDelete: true, canConnectCable: true, canContainObjects: false, canCarryLoad: false, canMountOnWall: true, canMountOnCeiling: false, canSplitCircuit: false, canGenerateDocument: true, canBeGrouped: true, canBeCopied: true, hasTerminals: true, supportsPhase: false, supportsRCD: false, requiresRoom: false } },
  sensor_motion: { metadata: { tags: ["electrical", "sensor", "motion"], custom: {} }, capabilities: { canRotate: true, canResize: false, canMove: true, canDelete: true, canConnectCable: true, canContainObjects: false, canCarryLoad: false, canMountOnWall: true, canMountOnCeiling: true, canSplitCircuit: false, canGenerateDocument: true, canBeGrouped: false, canBeCopied: true, hasTerminals: true, supportsPhase: false, supportsRCD: false, requiresRoom: true } },
  sensor_temp: { metadata: { tags: ["electrical", "sensor", "temperature"], custom: {} }, capabilities: { canRotate: true, canResize: false, canMove: true, canDelete: true, canConnectCable: true, canContainObjects: false, canCarryLoad: false, canMountOnWall: true, canMountOnCeiling: false, canSplitCircuit: false, canGenerateDocument: true, canBeGrouped: false, canBeCopied: true, hasTerminals: true, supportsPhase: false, supportsRCD: false, requiresRoom: true } },
  sensor_leak: { metadata: { tags: ["electrical", "sensor", "leak"], custom: {} }, capabilities: { canRotate: false, canResize: false, canMove: true, canDelete: true, canConnectCable: true, canContainObjects: false, canCarryLoad: false, canMountOnWall: false, canMountOnCeiling: false, canSplitCircuit: false, canGenerateDocument: true, canBeGrouped: false, canBeCopied: true, hasTerminals: true, supportsPhase: false, supportsRCD: false, requiresRoom: true } },
  sensor_gas: { metadata: { tags: ["electrical", "sensor", "gas"], custom: {} }, capabilities: { canRotate: false, canResize: false, canMove: true, canDelete: true, canConnectCable: true, canContainObjects: false, canCarryLoad: false, canMountOnWall: true, canMountOnCeiling: false, canSplitCircuit: false, canGenerateDocument: true, canBeGrouped: false, canBeCopied: true, hasTerminals: true, supportsPhase: false, supportsRCD: false, requiresRoom: true } },
  contactor: { metadata: { tags: ["electrical", "contactor"], custom: {} }, capabilities: { canRotate: false, canResize: false, canMove: true, canDelete: true, canConnectCable: false, canContainObjects: false, canCarryLoad: true, canMountOnWall: false, canMountOnCeiling: false, canSplitCircuit: false, canGenerateDocument: true, canBeGrouped: false, canBeCopied: true, hasTerminals: true, supportsPhase: true, supportsRCD: false, requiresRoom: false } },
  relay: { metadata: { tags: ["electrical", "relay"], custom: {} }, capabilities: { canRotate: false, canResize: false, canMove: true, canDelete: true, canConnectCable: false, canContainObjects: false, canCarryLoad: false, canMountOnWall: false, canMountOnCeiling: false, canSplitCircuit: false, canGenerateDocument: true, canBeGrouped: false, canBeCopied: true, hasTerminals: true, supportsPhase: false, supportsRCD: false, requiresRoom: false } },
  transformer: { metadata: { tags: ["electrical", "transformer"], custom: {} }, capabilities: { canRotate: false, canResize: false, canMove: true, canDelete: true, canConnectCable: false, canContainObjects: false, canCarryLoad: true, canMountOnWall: false, canMountOnCeiling: false, canSplitCircuit: false, canGenerateDocument: true, canBeGrouped: false, canBeCopied: true, hasTerminals: true, supportsPhase: true, supportsRCD: false, requiresRoom: false } },
  ups: { metadata: { tags: ["electrical", "ups"], custom: {} }, capabilities: { canRotate: false, canResize: false, canMove: true, canDelete: true, canConnectCable: false, canContainObjects: false, canCarryLoad: true, canMountOnWall: false, canMountOnCeiling: false, canSplitCircuit: false, canGenerateDocument: true, canBeGrouped: false, canBeCopied: true, hasTerminals: true, supportsPhase: false, supportsRCD: false, requiresRoom: false } },
  generator: { metadata: { tags: ["electrical", "generator"], custom: {} }, capabilities: { canRotate: false, canResize: false, canMove: true, canDelete: true, canConnectCable: false, canContainObjects: false, canCarryLoad: true, canMountOnWall: false, canMountOnCeiling: false, canSplitCircuit: false, canGenerateDocument: true, canBeGrouped: false, canBeCopied: true, hasTerminals: true, supportsPhase: true, supportsRCD: false, requiresRoom: false } },
  socket_group: { metadata: { tags: ["electrical", "outlet", "group"], custom: {} }, capabilities: { canRotate: true, canResize: false, canMove: true, canDelete: true, canConnectCable: true, canContainObjects: true, canCarryLoad: false, canMountOnWall: true, canMountOnCeiling: false, canSplitCircuit: false, canGenerateDocument: true, canBeGrouped: false, canBeCopied: true, hasTerminals: true, supportsPhase: false, supportsRCD: false, requiresRoom: true } },
  light_group: { metadata: { tags: ["electrical", "light", "group"], custom: {} }, capabilities: { canRotate: true, canResize: false, canMove: true, canDelete: true, canConnectCable: true, canContainObjects: true, canCarryLoad: false, canMountOnWall: false, canMountOnCeiling: false, canSplitCircuit: false, canGenerateDocument: true, canBeGrouped: false, canBeCopied: true, hasTerminals: true, supportsPhase: false, supportsRCD: false, requiresRoom: true } },
  floor_plan: { metadata: { tags: ["project", "floor_plan"], custom: {} }, capabilities: { canRotate: false, canResize: false, canMove: false, canDelete: true, canConnectCable: false, canContainObjects: true, canCarryLoad: false, canMountOnWall: false, canMountOnCeiling: false, canSplitCircuit: false, canGenerateDocument: true, canBeGrouped: false, canBeCopied: false, hasTerminals: false, supportsPhase: false, supportsRCD: false, requiresRoom: false } },
  project: { metadata: { tags: ["project"], custom: {} }, capabilities: { canRotate: false, canResize: false, canMove: false, canDelete: true, canConnectCable: false, canContainObjects: true, canCarryLoad: false, canMountOnWall: false, canMountOnCeiling: false, canSplitCircuit: false, canGenerateDocument: true, canBeGrouped: false, canBeCopied: false, hasTerminals: false, supportsPhase: false, supportsRCD: false, requiresRoom: false } },
  floor: { metadata: { tags: ["architecture", "floor"], custom: {} }, capabilities: { canRotate: false, canResize: false, canMove: false, canDelete: true, canConnectCable: false, canContainObjects: false, canCarryLoad: true, canMountOnWall: false, canMountOnCeiling: false, canSplitCircuit: false, canGenerateDocument: true, canBeGrouped: false, canBeCopied: false, hasTerminals: false, supportsPhase: false, supportsRCD: false, requiresRoom: false } },
  ceiling: { metadata: { tags: ["architecture", "ceiling"], custom: {} }, capabilities: { canRotate: false, canResize: false, canMove: false, canDelete: true, canConnectCable: false, canContainObjects: false, canCarryLoad: false, canMountOnWall: false, canMountOnCeiling: false, canSplitCircuit: false, canGenerateDocument: true, canBeGrouped: false, canBeCopied: false, hasTerminals: false, supportsPhase: false, supportsRCD: false, requiresRoom: false } },
  opening: { metadata: { tags: ["architecture", "opening"], custom: {} }, capabilities: { canRotate: true, canResize: true, canMove: true, canDelete: true, canConnectCable: false, canContainObjects: false, canCarryLoad: false, canMountOnWall: true, canMountOnCeiling: false, canSplitCircuit: false, canGenerateDocument: true, canBeGrouped: true, canBeCopied: true, hasTerminals: false, supportsPhase: false, supportsRCD: false, requiresRoom: false } },
}

// ============================================================
// FACTORY
// ============================================================

class UniversalObjectFactory {

  create(type: ObjectType, overrides: Partial<UniversalObject> = {}): UniversalObject {
    const now = new Date()
    const id = `obj_${Date.now()}_${Math.random().toString(36).slice(2, 9)}` as UUID
    const preset = ComponentPresets[type] ?? {}

    return {
      identity: {
        id,
        name: this.getDefaultName(type),
        type,
        version: 1,
        createdAt: now,
        modifiedAt: now,
        ...(overrides.identity ?? {}),
      },
      ...(preset.geometry ? { geometry: preset.geometry as GeometryComponent } : {}),
      ...(preset.electrical ? { electrical: preset.electrical as ElectricalComponent } : {}),
      ...(preset.visual ? { visual: preset.visual as VisualComponent } : {}),
      ...(preset.metadata ? { metadata: preset.metadata as MetadataComponent } : {}),
      ...(preset.relationships ? { relationships: preset.relationships as RelationshipsComponent } : {}),
      ...(preset.capabilities ? { capabilities: preset.capabilities as CapabilityComponent } : {}),
      ...(preset.validation ? { validation: preset.validation as ValidationComponent } : {}),
      ...overrides,
      identity: {
        id,
        name: this.getDefaultName(type),
        type,
        version: 1,
        createdAt: now,
        modifiedAt: now,
        ...(overrides.identity ?? {}),
      },
    }
  }

  private getDefaultName(type: ObjectType): string {
    const names: Record<string, string> = {
      wall: "Стена",
      door: "Дверь",
      window: "Окно",
      room: "Комната",
      outlet: "Розетка",
      outlet_waterproof: "Розетка IP44",
      outlet_triple: "Блок розеток",
      outlet_industrial: "Розетка промышленная",
      switch: "Выключатель",
      switch_pass_through: "Проходной выключатель",
      switch_motion: "Датчик движения",
      switch_voice: "Голосовой выключатель",
      dimmer: "Диммер",
      light_ceiling: "Светильник потолочный",
      light_wall: "Светильник настенный",
      light_spot: "Спот",
      light_strip: "Светодиодная лента",
      light_outdoor: "Уличный светильник",
      sensor_smoke: "Датчик дыма",
      sensor_motion: "Датчик движения",
      sensor_temp: "Датчик температуры",
      sensor_leak: "Датчик протечки",
      sensor_gas: "Датчик газа",
      panel: "Щит",
      breaker: "Автомат",
      rcd: "УЗО",
      rbo: "АВДТ",
      contactor: "Контактор",
      relay: "Реле",
      transformer: "Трансформатор",
      ups: "ИБП",
      generator: "Генератор",
      appliance: "Прибор",
      group: "Группа",
      floor_plan: "План этажа",
      project: "Проект",
    }
    return names[type] ?? type
  }
}

export const UniversalObjectFactory = new UniversalObjectFactory()
