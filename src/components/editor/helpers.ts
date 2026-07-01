import { type ElementType } from "react"
import {
  AlertTriangle, DoorOpen, Layers, Lightbulb, PanelTop, Plug, Power, Square, Zap,
} from "lucide-react"
import { POINT_CATALOG, getPointNameRu, getPointDefaultPower } from "@/engine/pointCatalog"

export const BREAKER_LABELS: Record<string, string> = {
  "brk_1p_c6": "C6", "brk_1p_c10": "C10", "brk_1p_c16": "C16",
  "brk_1p_c20": "C20", "brk_1p_c25": "C25", "brk_1p_c32": "C32",
  "brk_1p_c40": "C40", "brk_1p_c50": "C50",
  "brk_2p_c16": "2P C16", "brk_2p_c25": "2P C25", "brk_2p_c32": "2P C32",
}

export const CABLE_LABELS: Record<string, string> = {
  "cable_cu_2x1.5": "ВВГнг-LS 2x1.5", "cable_cu_3x1.5": "ВВГнг-LS 3x1.5",
  "cable_cu_3x2.5": "ВВГнг-LS 3x2.5", "cable_cu_3x4": "ВВГнг-LS 3x4",
  "cable_cu_3x6": "ВВГнг-LS 3x6", "cable_cu_3x10": "ВВГнг-LS 3x10",
  "cable_cu_3x16": "ВВГнг-LS 3x16",
}

export function breakerLabel(id?: string): string {
  if (!id) return "AI"
  return BREAKER_LABELS[id] ?? id
}

export function cableLabel(id?: string): string {
  if (!id) return "AI"
  return CABLE_LABELS[id] ?? id
}

export const ROOM_TYPES = [
  ["living", "Гостиная"],
  ["bedroom", "Спальня"],
  ["kitchen", "Кухня"],
  ["bathroom", "Санузел"],
  ["corridor", "Коридор"],
  ["office", "Кабинет"],
  ["custom", "Другая"],
] as const

export const POINT_TYPES = Object.entries(POINT_CATALOG).map(([key, val]) => [key, val.nameRu] as const)

export function pointType(value: string): string {
  return getPointNameRu(value)
}

export function defaultPower(value: string): number {
  return getPointDefaultPower(value)
}

export type Tool = "select" | "wall" | "door" | "window" | "outlet" | "switch" | "light" | "sensor" | "panel"

export const TOOLS: Array<{ id: Tool; icon: ElementType; label: string; group: "plan" | "electrical" }> = [
  { id: "select", icon: Layers, label: "Выбор", group: "plan" },
  { id: "wall", icon: Square, label: "Стена", group: "plan" },
  { id: "door", icon: DoorOpen, label: "Дверь", group: "plan" },
  { id: "window", icon: PanelTop, label: "Окно", group: "plan" },
  { id: "outlet", icon: Plug, label: "Розетка", group: "electrical" },
  { id: "switch", icon: Zap, label: "Выключатель", group: "electrical" },
  { id: "light", icon: Lightbulb, label: "Свет", group: "electrical" },
  { id: "sensor", icon: AlertTriangle, label: "Датчик", group: "electrical" },
  { id: "panel", icon: Power, label: "Щит", group: "electrical" },
]
