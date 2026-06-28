// ============================================================
// ElectricPMR Core Types — Common primitives
// ============================================================

export interface Point {
  x: number
  y: number
  z?: number
}

export interface Rect {
  x: number
  y: number
  width: number
  height: number
}

export type UUID = string

export interface Timestamped {
  createdAt: Date
  updatedAt: Date
}

export interface WithId {
  id: UUID
}

export type Phase =
  | "init"
  | "design"
  | "calculate"
  | "approve"
  | "purchase"
  | "install"
  | "accept"
  | "service"
  | "retrofit"

export type ProjectStatus =
  | "draft"
  | "in_progress"
  | "pending_approval"
  | "approved"
  | "ordered"
  | "in_installation"
  | "completed"
  | "in_service"

export type ProjectType =
  | "apartment"
  | "house"
  | "office"
  | "commercial"
  | "industrial"

export interface ValidationIssue {
  id: UUID
  ruleId: string
  source: string
  severity: "error" | "warning" | "info"
  message: string
  path?: string
  autoFix?: () => void
}

export interface ValidationResult {
  errors: ValidationIssue[]
  warnings: ValidationIssue[]
  infos: ValidationIssue[]
  isValid: boolean
  checkedAt: Date
}

export type InstallMethod =
  | "in_wall"
  | "in_pipe"
  | "on_surface"
  | "in_tray"
  | "in_cable_channel"
  | "under_floor"
  | "in_ceiling"
  | "buried"

export type CableRouteType =
  | "direct"
  | "along_walls"
  | "through_junction_boxes"
  | "through_trays"
  | "optimal"
