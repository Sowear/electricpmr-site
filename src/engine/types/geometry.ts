// ============================================================
// ElectricPMR Core Types — Geometry (walls, rooms, doors, windows)
// ============================================================

import type { Point, UUID, Timestamped } from "./common"

// --- Walls ---

export interface Wall extends Timestamped {
  id: UUID
  points: [Point, Point]     // start, end
  thickness: number           // мм (100, 150, 200, 300, 500)
  height: number              // мм (обычно = высота потолка)
  material: WallMaterial
  isExternal: boolean
  floor: number
}

export type WallMaterial =
  | "brick"
  | "concrete"
  | "wood"
  | "drywall"
  | "glass"
  | "stone"
  | "aerated_concrete"
  | "other"

// --- Rooms ---

export interface Room extends Timestamped {
  id: UUID
  name: string
  type: RoomType
  polygon: Point[]
  floor: number
  ceilingHeight: number       // мм
  area: number                // м² (авто)
  perimeter: number           // м (авто)
  volume: number              // м³ (авто)
}

export type RoomType =
  | "living"
  | "bedroom"
  | "kitchen"
  | "bathroom"
  | "hall"
  | "corridor"
  | "garage"
  | "basement"
  | "storage"
  | "office"
  | "server_room"
  | "custom"

// --- Doors ---

export interface Door extends Timestamped {
  id: UUID
  wallId: UUID
  position: number            // позиция на стене (0-1)
  width: number               // мм (600, 700, 800, 900, 1200)
  height: number              // мм (2000, 2100)
  type: DoorType
  swing: "left" | "right" | "sliding" | "none"
  rooms: [UUID, UUID]         // комнаты, которые соединяет
}

export type DoorType =
  | "single"
  | "double"
  | "sliding"
  | "entrance"
  | "fire"
  | "bathroom"

// --- Windows ---

export interface Window extends Timestamped {
  id: UUID
  wallId: UUID
  position: number
  width: number               // мм
  height: number              // мм
  sillHeight: number          // мм от пола
  type: WindowType
}

export type WindowType =
  | "standard"
  | "balcony"
  | "bay"
  | "skylight"
  | "fixed"

// --- Furniture / Objects on plan ---

export interface GeometryObject extends Timestamped {
  id: UUID
  type: string
  name: string
  position: Point
  rotation: number            // градусы
  width: number               // мм
  height: number              // мм
  roomId?: UUID
  floor: number
  metadata?: Record<string, unknown>
}

// --- Scene ---

export interface GeometryScene {
  id: UUID
  name: string
  floors: Floor[]
  walls: Wall[]
  rooms: Room[]
  doors: Door[]
  windows: Window[]
  objects: GeometryObject[]
}

export interface Floor {
  level: number
  name: string
  ceilingHeight: number
  rooms: UUID[]               // IDs комнат на этом этаже
  walls: UUID[]
  doors: UUID[]
  windows: UUID[]
}
