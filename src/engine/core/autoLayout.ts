// ============================================================
// ElectricPMR — Auto Layout (Event-driven пересчёт)
// ============================================================

import { EventBus } from "../events/eventBus"
import { EngineeringEngine } from "./engineering"
import type { ElectricalPoint, CircuitGroup } from "../types/electrical"
import type { SystemEvent } from "../types/events"

let recalculationTimer: ReturnType<typeof setTimeout> | null = null
let currentPoints: ElectricalPoint[] = []
let currentCircuits: CircuitGroup[] = []

export function initAutoLayout(): void {
  EventBus.on("*", handleEvent)
}

export function updateAutoLayoutData(points: ElectricalPoint[], circuits: CircuitGroup[]): void {
  currentPoints = points
  currentCircuits = circuits
}

function handleEvent(event: SystemEvent): void {
  const triggers = [
    "electrical.point.added", "electrical.point.moved", "electrical.point.removed",
    "electrical.circuit.created", "electrical.circuit.updated",
    "electrical.cable.assigned", "electrical.breaker.assigned",
    "geometry.wall.created", "geometry.wall.moved", "geometry.wall.deleted",
  ]

  if (triggers.includes(event.type)) {
    scheduleRecalculation()
  }
}

function scheduleRecalculation(): void {
  if (recalculationTimer) clearTimeout(recalculationTimer)
  recalculationTimer = setTimeout(performRecalculation, 100)
}

function performRecalculation(): void {
  const totalLoad = EngineeringEngine.calculateLoad(currentPoints)

  const updatedCircuits = currentCircuits.map(circuit => {
    const circuitPoints = currentPoints.filter(p => circuit.points.includes(p.id))
    const load = EngineeringEngine.calculateLoad(circuitPoints)
    return { ...circuit, load }
  })

  const phaseBalance = EngineeringEngine.calculatePhaseBalance(updatedCircuits)

  EventBus.emit({ type: "calculation.all.updated", totalLoad, balance: phaseBalance })
  EventBus.emit({ type: "calculation.load.updated", scope: "project", load: totalLoad })

  if (!phaseBalance.isBalanced) {
    EventBus.emit({ type: "calculation.phase.imbalanced", balance: phaseBalance })
  }
}

export function updateConnectedObjects(pointId: string, points: ElectricalPoint[]): void {
  const point = points.find(p => p.id === pointId)
  if (!point) return

  const panel = points.find(p => p.type === "panel" && p.floor === point.floor)
  if (!panel) return

  const dx = panel.position.x - point.position.x
  const dy = panel.position.y - point.position.y
  const distance = Math.round(Math.sqrt(dx * dx + dy * dy))
  const cableLength = Math.round(distance * 1.15)
  void cableLength
}
