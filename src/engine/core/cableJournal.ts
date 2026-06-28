// ============================================================
// ElectricPMR — Cable Journal Generator
// ============================================================
//
// Подробный расчёт кабелей: длины, сечения, потери напряжения,
// проверка по номинальным токам и нагреву.
// ============================================================

import type { CircuitGroup, CableRoute, CableSpec } from "../types/electrical"
import type { ElectricalPoint } from "../types/electrical"
import { EngineeringEngine } from "./engineering"

// ============================================================
// CABLE CATALOG (read-only reference)
// ============================================================

const CABLE_CATALOG: CableSpec[] = [
  { id: "cable_cu_2x1.5", type: "VVGng", cores: 2, crossSection: 1.5, material: "copper", insulation: "PVC", jacket: "PVC", fireRating: "ng", voltageRating: 300, currentCapacity: 16.5, resistance: 12.1, reactance: 0.08, weight: 0.041, pricePerMeter: 35, createdAt: new Date(), updatedAt: new Date() },
  { id: "cable_cu_3x1.5", type: "VVGng", cores: 3, crossSection: 1.5, material: "copper", insulation: "PVC", jacket: "PVC", fireRating: "ng", voltageRating: 300, currentCapacity: 16.5, resistance: 12.1, reactance: 0.08, weight: 0.041, pricePerMeter: 45, createdAt: new Date(), updatedAt: new Date() },
  { id: "cable_cu_3x2.5", type: "VVGng", cores: 3, crossSection: 2.5, material: "copper", insulation: "PVC", jacket: "PVC", fireRating: "ng", voltageRating: 300, currentCapacity: 25, resistance: 7.42, reactance: 0.08, weight: 0.062, pricePerMeter: 65, createdAt: new Date(), updatedAt: new Date() },
  { id: "cable_cu_3x4", type: "VVGng", cores: 3, crossSection: 4, material: "copper", insulation: "PVC", jacket: "PVC", fireRating: "ng", voltageRating: 300, currentCapacity: 34, resistance: 4.64, reactance: 0.08, weight: 0.092, pricePerMeter: 95, createdAt: new Date(), updatedAt: new Date() },
  { id: "cable_cu_3x6", type: "VVGng", cores: 3, crossSection: 6, material: "copper", insulation: "PVC", jacket: "PVC", fireRating: "ng", voltageRating: 300, currentCapacity: 42, resistance: 3.09, reactance: 0.08, weight: 0.132, pricePerMeter: 140, createdAt: new Date(), updatedAt: new Date() },
  { id: "cable_cu_3x10", type: "VVGng", cores: 3, crossSection: 10, material: "copper", insulation: "PVC", jacket: "PVC", fireRating: "ng", voltageRating: 300, currentCapacity: 60, resistance: 1.85, reactance: 0.08, weight: 0.214, pricePerMeter: 230, createdAt: new Date(), updatedAt: new Date() },
  { id: "cable_cu_3x16", type: "VVGng", cores: 3, crossSection: 16, material: "copper", insulation: "PVC", jacket: "PVC", fireRating: "ng", voltageRating: 300, currentCapacity: 75, resistance: 1.16, reactance: 0.08, weight: 0.332, pricePerMeter: 370, createdAt: new Date(), updatedAt: new Date() },
]

const CABLE_LABELS: Record<string, string> = {
  "cable_cu_2x1.5": "ВВГнг-LS 2×1.5",
  "cable_cu_3x1.5": "ВВГнг-LS 3×1.5",
  "cable_cu_3x2.5": "ВВГнг-LS 3×2.5",
  "cable_cu_3x4": "ВВГнг-LS 3×4",
  "cable_cu_3x6": "ВВГнг-LS 3×6",
  "cable_cu_3x10": "ВВГнг-LS 3×10",
  "cable_cu_3x16": "ВВГнг-LS 3×16",
}

// ============================================================
// TYPES
// ============================================================

export interface CableJournalRow {
  circuitNumber: number
  circuitName: string
  cableType: string
  cableLabel: string
  crossSection: number     // мм²
  cores: number
  length: number           // м (с запасом 15%)
  lengthWithReserve: number
  current: number          // А (нагрузка)
  currentCapacity: number  // А (допустимый ток кабеля)
  utilizationPercent: number
  voltageDrop: number      // %
  voltageDropOk: boolean
  resistance: number       // Ом/км
  pricePerMeter: number    // руб/м
  totalPrice: number       // руб
  method: string
}

export interface CableJournal {
  rows: CableJournalRow[]
  summary: {
    totalLength: number         // м
    totalLengthWithReserve: number
    totalCost: number           // руб
    averageUtilization: number  // %
    maxVoltageDrop: number      // %
    cablesOverloaded: number
    cablesOverVoltageDrop: number
  }
}

// ============================================================
// GENERATOR
// ============================================================

export function generateCableJournal(
  circuits: CircuitGroup[],
  cables: CableRoute[],
  points: ElectricalPoint[],
): CableJournal {
  const rows: CableJournalRow[] = circuits
    .filter(c => c.type !== "panel")
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((circuit, index) => {
      const cable = CABLE_CATALOG.find(c => c.id === circuit.cableId)
      const route = cables.find(r => r.from === circuit.points[0] || r.to === circuit.points[0])

      const length = route?.length ?? estimateCircuitLength(circuit, points)
      const lengthWithReserve = Math.ceil(length * 1.15) // 15% запас

      const current = circuit.load.effectiveCurrent
      const currentCapacity = cable?.currentCapacity ?? 0
      const utilizationPercent = currentCapacity > 0
        ? Math.round((current / currentCapacity) * 100)
        : 0

      const voltageDropResult = cable
        ? EngineeringEngine.calculateVoltageDrop(cable, current, lengthWithReserve)
        : { percentage: 0, isAcceptable: true }

      const pricePerMeter = cable?.pricePerMeter ?? 0

      return {
        circuitNumber: index + 1,
        circuitName: circuit.name,
        cableType: circuit.cableId ?? "—",
        cableLabel: circuit.cableId ? CABLE_LABELS[circuit.cableId] ?? circuit.cableId : "—",
        crossSection: cable?.crossSection ?? 0,
        cores: cable?.cores ?? 0,
        length,
        lengthWithReserve,
        current: Math.round(current * 100) / 100,
        currentCapacity,
        utilizationPercent,
        voltageDrop: voltageDropResult.percentage,
        voltageDropOk: voltageDropResult.isAcceptable,
        resistance: cable?.resistance ?? 0,
        pricePerMeter,
        totalPrice: pricePerMeter * lengthWithReserve,
        method: route?.method ?? "in_wall",
      }
    })

  const totalLength = rows.reduce((sum, r) => sum + r.length, 0)
  const totalLengthWithReserve = rows.reduce((sum, r) => sum + r.lengthWithReserve, 0)
  const totalCost = rows.reduce((sum, r) => sum + r.totalPrice, 0)
  const averageUtilization = rows.length > 0
    ? Math.round(rows.reduce((sum, r) => sum + r.utilizationPercent, 0) / rows.length)
    : 0
  const maxVoltageDrop = Math.max(...rows.map(r => r.voltageDrop), 0)
  const cablesOverloaded = rows.filter(r => r.utilizationPercent > 100).length
  const cablesOverVoltageDrop = rows.filter(r => !r.voltageDropOk).length

  return {
    rows,
    summary: {
      totalLength,
      totalLengthWithReserve,
      totalCost,
      averageUtilization,
      maxVoltageDrop: Math.round(maxVoltageDrop * 100) / 100,
      cablesOverloaded,
      cablesOverVoltageDrop,
    },
  }
}

function estimateCircuitLength(circuit: CircuitGroup, points: ElectricalPoint[]): number {
  const circuitPoints = points.filter(p => circuit.points.includes(p.id))
  if (circuitPoints.length === 0) return 3

  // Простая оценка: расстояние от центра группы до самой удалённой точки + 2м к щиту
  const center = circuitPoints.reduce(
    (acc, p) => ({ x: acc.x + p.position.x, y: acc.y + p.position.y }),
    { x: 0, y: 0 }
  )
  center.x /= circuitPoints.length
  center.y /= circuitPoints.length

  const maxDist = Math.max(
    ...circuitPoints.map(p =>
      Math.sqrt((p.position.x - center.x) ** 2 + (p.position.y - center.y) ** 2)
    ),
    0
  )

  // расстояние в мм → м, + 2м до щита, + 15% запас
  return Math.round((maxDist / 1000 + 2) * 1.15)
}
