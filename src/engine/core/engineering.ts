// ============================================================
// ElectricPMR — Engineering Engine (ядро инженерных расчётов)
// ============================================================
//
// Философия:
//   Детерминированный. При одинаковых входных данных
//   всегда даёт одинаковый результат. AI не участвует в расчётах.
//
//   ПУЭ 7-е издание — основной источник.
// ============================================================

import type {
  ElectricalPoint, CircuitGroup, CableSpec, CableRoute,
  BreakerSpec, LoadCalculation, PhaseBalance, VoltageDrop,
  Panel, PanelEquipment, InstallMethod, CableType
} from "../types/electrical"
import type { ValidationResult, UUID } from "../types/common"
import { EventBus } from "../events/eventBus"
import { getPointDefaultPower } from "@/engine/pointCatalog"

// ============================================================
// КАТАЛОГ КАБЕЛЕЙ (базовый для ПМР, 220/380В)
// ============================================================

const CABLE_CATALOG: CableSpec[] = [
  {
    id: "cable_cu_2x1.5",
    type: "VVGng",
    cores: 2,
    crossSection: 1.5,
    material: "copper",
    insulation: "PVC",
    jacket: "PVC",
    fireRating: "ng",
    voltageRating: 300,
    currentCapacity: 16.5,
    resistance: 12.1,
    reactance: 0.08,
    weight: 0.041,
    pricePerMeter: 35,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "cable_cu_3x1.5",
    type: "VVGng",
    cores: 3,
    crossSection: 1.5,
    material: "copper",
    insulation: "PVC",
    jacket: "PVC",
    fireRating: "ng",
    voltageRating: 300,
    currentCapacity: 15.5,
    resistance: 12.1,
    reactance: 0.08,
    weight: 0.059,
    pricePerMeter: 52,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "cable_cu_3x2.5",
    type: "VVGng",
    cores: 3,
    crossSection: 2.5,
    material: "copper",
    insulation: "PVC",
    jacket: "PVC",
    fireRating: "ng",
    voltageRating: 300,
    currentCapacity: 21,
    resistance: 7.26,
    reactance: 0.08,
    weight: 0.088,
    pricePerMeter: 82,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "cable_cu_3x4",
    type: "VVGng",
    cores: 3,
    crossSection: 4,
    material: "copper",
    insulation: "PVC",
    jacket: "PVC",
    fireRating: "ng",
    voltageRating: 300,
    currentCapacity: 27,
    resistance: 4.54,
    reactance: 0.07,
    weight: 0.135,
    pricePerMeter: 125,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "cable_cu_3x6",
    type: "VVGng",
    cores: 3,
    crossSection: 6,
    material: "copper",
    insulation: "PVC",
    jacket: "PVC",
    fireRating: "ng",
    voltageRating: 300,
    currentCapacity: 34,
    resistance: 3.02,
    reactance: 0.07,
    weight: 0.195,
    pricePerMeter: 185,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "cable_cu_3x10",
    type: "VVGng",
    cores: 3,
    crossSection: 10,
    material: "copper",
    insulation: "PVC",
    jacket: "PVC",
    fireRating: "ng",
    voltageRating: 300,
    currentCapacity: 50,
    resistance: 1.81,
    reactance: 0.07,
    weight: 0.31,
    pricePerMeter: 310,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "cable_cu_3x16",
    type: "VVGng",
    cores: 3,
    crossSection: 16,
    material: "copper",
    insulation: "PVC",
    jacket: "PVC",
    fireRating: "ng",
    voltageRating: 300,
    currentCapacity: 60,
    resistance: 1.13,
    reactance: 0.07,
    weight: 0.485,
    pricePerMeter: 500,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
]

// ============================================================
// КАТАЛОГ АВТОМАТОВ (базовый)
// ============================================================

const BREAKER_CATALOG: BreakerSpec[] = [
  { id: "brk_1p_c6", manufacturer: "ABB", model: "SH200L C6", poles: 1, rating: 6, curve: "C", breakingCapacity: 6, voltage: 230, modules: 1, price: 350, characteristic: { points: [] }, createdAt: new Date(), updatedAt: new Date() },
  { id: "brk_1p_c10", manufacturer: "ABB", model: "SH200L C10", poles: 1, rating: 10, curve: "C", breakingCapacity: 6, voltage: 230, modules: 1, price: 350, characteristic: { points: [] }, createdAt: new Date(), updatedAt: new Date() },
  { id: "brk_1p_c16", manufacturer: "ABB", model: "SH200L C16", poles: 1, rating: 16, curve: "C", breakingCapacity: 6, voltage: 230, modules: 1, price: 350, characteristic: { points: [] }, createdAt: new Date(), updatedAt: new Date() },
  { id: "brk_1p_c20", manufacturer: "ABB", model: "SH200L C20", poles: 1, rating: 20, curve: "C", breakingCapacity: 6, voltage: 230, modules: 1, price: 380, characteristic: { points: [] }, createdAt: new Date(), updatedAt: new Date() },
  { id: "brk_1p_c25", manufacturer: "ABB", model: "SH200L C25", poles: 1, rating: 25, curve: "C", breakingCapacity: 6, voltage: 230, modules: 1, price: 380, characteristic: { points: [] }, createdAt: new Date(), updatedAt: new Date() },
  { id: "brk_1p_c32", manufacturer: "ABB", model: "SH200L C32", poles: 1, rating: 32, curve: "C", breakingCapacity: 6, voltage: 230, modules: 1, price: 420, characteristic: { points: [] }, createdAt: new Date(), updatedAt: new Date() },
  { id: "brk_1p_c40", manufacturer: "ABB", model: "SH200L C40", poles: 1, rating: 40, curve: "C", breakingCapacity: 6, voltage: 230, modules: 1, price: 480, characteristic: { points: [] }, createdAt: new Date(), updatedAt: new Date() },
  { id: "brk_1p_c50", manufacturer: "ABB", model: "SH200L C50", poles: 1, rating: 50, curve: "C", breakingCapacity: 6, voltage: 230, modules: 1, price: 520, characteristic: { points: [] }, createdAt: new Date(), updatedAt: new Date() },
  // 2-полюсные
  { id: "brk_2p_c16", manufacturer: "ABB", model: "SH202L C16", poles: 2, rating: 16, curve: "C", breakingCapacity: 6, voltage: 400, modules: 2, price: 720, characteristic: { points: [] }, createdAt: new Date(), updatedAt: new Date() },
  { id: "brk_2p_c25", manufacturer: "ABB", model: "SH202L C25", poles: 2, rating: 25, curve: "C", breakingCapacity: 6, voltage: 400, modules: 2, price: 780, characteristic: { points: [] }, createdAt: new Date(), updatedAt: new Date() },
  { id: "brk_2p_c32", manufacturer: "ABB", model: "SH202L C32", poles: 2, rating: 32, curve: "C", breakingCapacity: 6, voltage: 400, modules: 2, price: 850, characteristic: { points: [] }, createdAt: new Date(), updatedAt: new Date() },
]

// ============================================================
// КАТАЛОГ УЗО
// ============================================================

const RCD_CATALOG = [
  { id: "rcd_2p_25a_30ma", manufacturer: "ABB", model: "F202 AC-25/0.03", poles: 2 as const, rating: 25, sensitivity: 30 as const, type: "AC" as const, breakingCapacity: 10, modules: 2, price: 1850, createdAt: new Date(), updatedAt: new Date() },
  { id: "rcd_2p_40a_30ma", manufacturer: "ABB", model: "F202 AC-40/0.03", poles: 2 as const, rating: 40, sensitivity: 30 as const, type: "AC" as const, breakingCapacity: 10, modules: 2, price: 2100, createdAt: new Date(), updatedAt: new Date() },
]

// ============================================================
// КОЭФФИЦИЕНТЫ СПРОСА (ПУЭ)
// ============================================================

const DEMAND_FACTORS: Record<string, number> = {
  residential: 0.6,
  kitchen: 0.7,
  bathroom: 0.6,
  lighting: 0.8,
  outlets_general: 0.6,
  power_heavy: 0.8,
  office: 0.7,
  industrial: 0.8,
}

// ============================================================
// КОЭФФИЦИЕНТЫ ОДНОВРЕМЕННОСТИ
// ============================================================

const SIMULTANEOUS_FACTORS: Record<string, number> = {
  residential_small: 0.5,      // до 10 групп
  residential_large: 0.4,      // более 10 групп
  office: 0.6,
  industrial: 0.7,
}

// ============================================================
// КОЭФФИЦИЕНТЫ ПОПРАВКИ НА ТЕМПЕРАТУРУ (ПУЭ табл. 1.3.4)
// ============================================================

function getTemperatureFactor(ambientTemp: number): number {
  if (ambientTemp <= 15) return 1.12
  if (ambientTemp <= 20) return 1.06
  if (ambientTemp <= 25) return 1.0
  if (ambientTemp <= 30) return 0.94
  if (ambientTemp <= 35) return 0.87
  if (ambientTemp <= 40) return 0.79
  return 0.71
}

// ============================================================
// КОЭФФИЦИЕНТЫ СПОСОБА ПРОКЛАДКИ (ПУЭ табл. 1.3.4)
// ============================================================

function getInstallMethodFactor(method: InstallMethod): number {
  const factors: Record<InstallMethod, number> = {
    in_wall: 0.75,          // замурован в стену (хуже теплоотвод)
    in_pipe: 0.7,
    on_surface: 1.0,        // на поверхности (лучше всего)
    in_tray: 0.85,
    in_cable_channel: 0.8,
    under_floor: 0.8,
    in_ceiling: 0.85,
    buried: 0.7,
  }
  return factors[method]
}

// ============================================================
// КОЭФФИЦИЕНТ ГРУППЫ КАБЕЛЕЙ (ПУЭ табл. 1.3.6)
// ============================================================

function getGroupingFactor(count: number): number {
  if (count <= 1) return 1.0
  if (count <= 2) return 0.85
  if (count <= 3) return 0.75
  if (count <= 4) return 0.68
  if (count <= 6) return 0.6
  if (count <= 8) return 0.53
  if (count <= 10) return 0.48
  if (count <= 15) return 0.43
  return 0.38
}

// ============================================================
// ENGINEERING ENGINE
// ============================================================

class EngineeringEngineImpl {

  // --- Расчёт нагрузки ---

  calculateLoad(points: ElectricalPoint[]): LoadCalculation {
    const powers = points.map(p => this.getObjectPower(p))
    const totalPower = powers.reduce((sum, p) => sum + p, 0)
    const voltage = 220
    const totalCurrent = totalPower / voltage

    const demandFactor = 0.7
    const simultaneousFactor = 0.6

    return {
      totalPower,
      totalCurrent,
      demandFactor,
      simultaneousFactor,
      effectivePower: totalPower * demandFactor * simultaneousFactor,
      effectiveCurrent: totalCurrent * demandFactor * simultaneousFactor,
    }
  }

  calculateGroupLoad(group: CircuitGroup, allGroups: CircuitGroup[], pointResolver?: (ids: string[]) => ElectricalPoint[]): LoadCalculation {
    const points = pointResolver ? pointResolver(group.points) : []
    const groupLoad = this.calculateLoad(points)

    // Коэффициент одновременности зависит от количества групп
    const simultaneousFactor = allGroups.length <= 10
      ? SIMULTANEOUS_FACTORS.residential_small
      : SIMULTANEOUS_FACTORS.residential_large

    return {
      ...groupLoad,
      simultaneousFactor,
      effectivePower: groupLoad.totalPower * groupLoad.demandFactor * simultaneousFactor,
      effectiveCurrent: groupLoad.totalCurrent * groupLoad.demandFactor * simultaneousFactor,
    }
  }

  calculatePhaseBalance(groups: CircuitGroup[]): PhaseBalance {
    const phaseLoads: LoadCalculation[] = [
      { totalPower: 0, totalCurrent: 0, demandFactor: 1, simultaneousFactor: 1, effectivePower: 0, effectiveCurrent: 0 },
      { totalPower: 0, totalCurrent: 0, demandFactor: 1, simultaneousFactor: 1, effectivePower: 0, effectiveCurrent: 0 },
      { totalPower: 0, totalCurrent: 0, demandFactor: 1, simultaneousFactor: 1, effectivePower: 0, effectiveCurrent: 0 },
    ]

    for (const group of groups) {
      const phaseIndex = group.phase - 1
      if (phaseIndex >= 0 && phaseIndex < 3) {
        phaseLoads[phaseIndex].totalPower += group.load.totalPower
        phaseLoads[phaseIndex].totalCurrent += group.load.totalCurrent
        phaseLoads[phaseIndex].effectivePower += group.load.effectivePower
        phaseLoads[phaseIndex].effectiveCurrent += group.load.effectiveCurrent
      }
    }

    const maxPower = Math.max(...phaseLoads.map(l => l.effectivePower))
    const minPower = Math.min(...phaseLoads.map(l => l.effectivePower))
    const avgPower = (phaseLoads[0].effectivePower + phaseLoads[1].effectivePower + phaseLoads[2].effectivePower) / 3
    const deviation = avgPower > 0 ? ((maxPower - minPower) / avgPower) * 100 : 0

    return {
      L1: phaseLoads[0],
      L2: phaseLoads[1],
      L3: phaseLoads[2],
      maxDeviation: deviation,
      isBalanced: deviation <= 15,
      recommendation: deviation > 15
        ? `Небаланс фаз: ${deviation.toFixed(1)}%. Рекомендуется распределить нагрузку.`
        : undefined,
    }
  }

  // --- Выбор кабеля ---

  selectCable(
    current: number,
    length: number,
    method: InstallMethod,
    ambientTemp: number,
    groupingCount: number,
    voltage: number = 220,
    cores: number = 3
  ): CableSpec | null {
    // 1. Поправочные коэффициенты
    const tempFactor = getTemperatureFactor(ambientTemp)
    const methodFactor = getInstallMethodFactor(method)
    const groupFactor = getGroupingFactor(groupingCount)

    // Нагрузка с поправками
    const adjustedCurrent = current / (tempFactor * methodFactor * groupFactor)

    // 2. Ищем кабель с достаточной допустимой нагрузкой
    const suitableCables = CABLE_CATALOG
      .filter(c => c.cores >= cores && c.material === "copper")
      .filter(c => c.currentCapacity >= adjustedCurrent)
      .sort((a, b) => a.crossSection - b.crossSection)

    if (suitableCables.length === 0) return null

    const cable = suitableCables[0]

    // 3. Проверяем падение напряжения
    const voltageDrop = this.calculateVoltageDrop(cable, current, length, voltage)
    if (voltageDrop.percentage <= 5) {
      return cable
    }

    // Если не проходит — ищем кабель большего сечения
    for (const candidate of suitableCables) {
      const vd = this.calculateVoltageDrop(candidate, current, length, voltage)
      if (vd.percentage <= 5) {
        return candidate
      }
    }

    return cable
  }

  // --- Падение напряжения ---

  calculateVoltageDrop(
    cable: CableSpec,
    current: number,
    length: number,
    voltage: number = 220
  ): VoltageDrop {
    // dU = (2 × I × L × R) / 1000
    // где R = сопротивление на 1 км (Ом/км)
    const absoluteDrop = (2 * current * length * cable.resistance) / 1000
    const percentage = (absoluteDrop / voltage) * 100

    return {
      percentage: Math.round(percentage * 100) / 100,
      absolute: Math.round(absoluteDrop * 100) / 100,
      isAcceptable: percentage <= 5,
      limit: 5,
      cableId: cable.id,
    }
  }

  // --- Выбор автомата ---

  selectBreaker(
    load: LoadCalculation,
    cable: CableSpec
  ): BreakerSpec | null {
    const current = load.effectiveCurrent

    // Автомат должен быть:
    // 1. ≥ номинального тока нагрузки
    // 2. ≤ допустимого тока кабеля
    // 3. С запасом 1.25× от нагрузки (ПУЭ)

    const requiredRating = Math.ceil(current * 1.25 / 1) * 1 // округляем вверх до целых
    const maxByCable = cable.currentCapacity

    // Ищем подходящий автомат
    const suitable = BREAKER_CATALOG
      .filter(b => b.poles === 1) // для жилых — 1-полюсные
      .filter(b => b.rating >= requiredRating && b.rating <= maxByCable)
      .sort((a, b) => a.rating - b.rating)

    if (suitable.length === 0) return null
    return suitable[0]
  }

  // --- Проверка селективности ---

  checkSelectivity(upstream: BreakerSpec, downstream: BreakerSpec): boolean {
    // Верхний автомат должен иметь номинал ≥ 2× нижнего
    return upstream.rating >= downstream.rating * 2
  }

  // --- Проверка защиты кабеля ---

  checkCableProtection(breaker: BreakerSpec, cable: CableSpec): boolean {
    // Номинал автомата должен быть ≤ допустимого тока кабеля
    return breaker.rating <= cable.currentCapacity
  }

  // --- Компоновка щита ---

  calculatePanelSize(equipment: PanelEquipment[]): { totalModules: number; rows: number; width: number } {
    const totalModules = equipment.reduce((sum, e) => sum + e.modules, 0)
    const modulesPerRow = 24  // стандартная DIN-рейка
    const rows = Math.ceil(totalModules / modulesPerRow)
    const width = modulesPerRow * 18 // мм

    return { totalModules, rows, width }
  }

  // --- Валидация проекта ---

  validateCircuit(circuit: CircuitGroup, allCircuits: CircuitGroup[]): ValidationResult {
    const issues: ValidationResult["errors" | "warnings" | "infos"] = []

    // Проверка: группа не пуста
    if (circuit.points.length === 0) {
      issues.push({
        id: `val_empty_${circuit.id}`,
        ruleId: "ENGINEERING.EMPTY_CIRCUIT",
        source: "engineering",
        severity: "warning",
        message: `Группа "${circuit.name}" не содержит потребителей`,
      })
    }

    // Проверка: нагрузка не превышает автомат
    if (circuit.breakerId) {
      const breaker = BREAKER_CATALOG.find(b => b.id === circuit.breakerId)
      if (breaker && circuit.load.effectiveCurrent > breaker.rating) {
        issues.push({
          id: `val_overload_${circuit.id}`,
          ruleId: "ENGINEERING.OVERLOAD_BREAKER",
          source: "engineering",
          severity: "error",
          message: `Группа "${circuit.name}": ток ${circuit.load.effectiveCurrent.toFixed(1)}А превышает автомат ${breaker.rating}А`,
        })
      }
    }

    // Проверка: нет двух групп на одной фазе с перегрузкой
    const samePhaseCircuits = allCircuits.filter(c => c.phase === circuit.phase && c.id !== circuit.id)
    const totalPhaseCurrent = samePhaseCircuits.reduce((sum, c) => sum + c.load.effectiveCurrent, 0) + circuit.load.effectiveCurrent
    if (totalPhaseCurrent > 40) {
      issues.push({
        id: `val_phase_${circuit.id}_${circuit.phase}`,
        ruleId: "ENGINEERING.PHASE_OVERLOAD",
        source: "engineering",
        severity: "warning",
        message: `Фаза L${circuit.phase}: суммарный ток ${totalPhaseCurrent.toFixed(1)}А`,
      })
    }

    return {
      errors: issues.filter(i => i.severity === "error"),
      warnings: issues.filter(i => i.severity === "warning"),
      infos: issues.filter(i => i.severity === "info"),
      isValid: !issues.some(i => i.severity === "error"),
      checkedAt: new Date(),
    }
  }

  // --- Утилита: мощность объекта ---

  private getObjectPower(point: ElectricalPoint): number {
    return getPointDefaultPower(point.type)
  }

  // --- Доступ к каталогам ---

  getCableCatalog(): CableSpec[] {
    return [...CABLE_CATALOG]
  }

  getBreakerCatalog(): BreakerSpec[] {
    return [...BREAKER_CATALOG]
  }

  getRCDCatalog() {
    return [...RCD_CATALOG]
  }

  getDemandFactor(buildingType: string): number {
    return DEMAND_FACTORS[buildingType] ?? 0.6
  }
}

// Синглтон
export const EngineeringEngine = new EngineeringEngineImpl()
