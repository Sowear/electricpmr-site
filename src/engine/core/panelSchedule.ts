// ============================================================
// ElectricPMR — Panel Schedule Generator
// ============================================================
//
// Генерирует табличную схему щита (однолинейная + спецификация).
// ============================================================

import type { CircuitGroup, LoadCalculation } from "../types/electrical"
import type { ElectricalPoint } from "../types/electrical"

// ============================================================
// TYPES
// ============================================================

export interface CircuitScheduleRow {
  circuitNumber: number
  circuitName: string
  circuitType: string
  breakerModel: string
  breakerRating: number
  cableType: string
  phase: 1 | 2 | 3
  power: number        // Вт
  current: number      // А
  loadPercent: number  // % от номинала автомата
  rooms: string[]
  pointCount: number
}

export interface PanelSchedule {
  panelName: string
  mainBreaker: {
    model: string
    rating: number
  }
  circuits: CircuitScheduleRow[]
  summary: {
    totalPower: number
    totalCurrent: number
    phase1Power: number
    phase2Power: number
    phase3Power: number
    phaseBalance: number    // max deviation %
    totalModules: number
    utilizationPercent: number
  }
}

// ============================================================
// BREAKER LABEL MAP
// ============================================================

const BREAKER_MODELS: Record<string, string> = {
  "brk_1p_c6": "ABB SH200L C6",
  "brk_1p_c10": "ABB SH200L C10",
  "brk_1p_c16": "ABB SH200L C16",
  "brk_1p_c20": "ABB SH200L C20",
  "brk_1p_c25": "ABB SH200L C25",
  "brk_1p_c32": "ABB SH200L C32",
  "brk_1p_c40": "ABB SH200L C40",
  "brk_1p_c50": "ABB SH200L C50",
  "brk_2p_c16": "ABB SH202L C16",
  "brk_2p_c25": "ABB SH202L C25",
  "brk_2p_c32": "ABB SH202L C32",
}

const BREAKER_RATINGS: Record<string, number> = {
  "brk_1p_c6": 6, "brk_1p_c10": 10, "brk_1p_c16": 16,
  "brk_1p_c20": 20, "brk_1p_c25": 25, "brk_1p_c32": 32,
  "brk_1p_c40": 40, "brk_1p_c50": 50,
  "brk_2p_c16": 16, "brk_2p_c25": 25, "brk_2p_c32": 32,
}

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
// GENERATOR
// ============================================================

export function generatePanelSchedule(
  circuits: CircuitGroup[],
  points: ElectricalPoint[],
  panelName: string = "ЩЭ",
): PanelSchedule {
  const rows: CircuitScheduleRow[] = circuits
    .filter(c => c.type !== "panel")
    .sort((a, b) => a.phase - b.phase || a.name.localeCompare(b.name))
    .map((circuit, index) => {
      const breakerModel = circuit.breakerId ? BREAKER_MODELS[circuit.breakerId] ?? circuit.breakerId : "—"
      const breakerRating = circuit.breakerId ? BREAKER_RATINGS[circuit.breakerId] ?? 0 : 0
      const cableType = circuit.cableId ? CABLE_LABELS[circuit.cableId] ?? circuit.cableId : "—"

      const circuitPoints = points.filter(p => circuit.points.includes(p.id))
      const roomIds = [...new Set(circuitPoints.map(p => p.roomId).filter(Boolean))]

      const loadPercent = breakerRating > 0
        ? Math.round((circuit.load.effectiveCurrent / breakerRating) * 100)
        : 0

      return {
        circuitNumber: index + 1,
        circuitName: circuit.name,
        circuitType: circuit.type,
        breakerModel,
        breakerRating,
        cableType,
        phase: circuit.phase,
        power: circuit.load.effectivePower,
        current: circuit.load.effectiveCurrent,
        loadPercent,
        rooms: roomIds as string[],
        pointCount: circuit.points.length,
      }
    })

  const totalPower = rows.reduce((sum, r) => sum + r.power, 0)
  const totalCurrent = rows.reduce((sum, r) => sum + r.current, 0)

  const phase1 = rows.filter(r => r.phase === 1).reduce((sum, r) => sum + r.power, 0)
  const phase2 = rows.filter(r => r.phase === 2).reduce((sum, r) => sum + r.power, 0)
  const phase3 = rows.filter(r => r.phase === 3).reduce((sum, r) => sum + r.power, 0)

  const avgPhase = totalPower / 3
  const maxDeviation = avgPhase > 0
    ? Math.max(
        Math.abs(phase1 - avgPhase),
        Math.abs(phase2 - avgPhase),
        Math.abs(phase3 - avgPhase),
      ) / avgPhase * 100
    : 0

  const totalModules = rows.reduce((sum, r) => {
    const rating = r.breakerRating
    if (rating <= 25) return sum + 1
    if (rating <= 32) return sum + 2
    return sum + 2
  }, 0)

  const mainBreakerRating = 50
  const utilizationPercent = totalCurrent > 0
    ? Math.round((totalCurrent / mainBreakerRating) * 100)
    : 0

  return {
    panelName,
    mainBreaker: {
      model: "ABB SH200L C50",
      rating: mainBreakerRating,
    },
    circuits: rows,
    summary: {
      totalPower,
      totalCurrent,
      phase1Power: phase1,
      phase2Power: phase2,
      phase3Power: phase3,
      phaseBalance: Math.round(maxDeviation),
      totalModules,
      utilizationPercent,
    },
  }
}
