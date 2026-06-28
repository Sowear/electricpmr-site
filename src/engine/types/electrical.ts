// ============================================================
// ElectricPMR Core Types — Electrical (points, circuits, cables, panels)
// ============================================================

import type { Point, UUID, Timestamped, InstallMethod } from "./common"

// --- Electrical Point (any device: outlet, light, switch, etc.) ---

export interface ElectricalPoint extends Timestamped {
  id: UUID
  type: ElectricalPointType
  subtype: string
  name: string
  position: Point
  rotation: number
  floor: number
  roomId?: UUID
  mountingHeight: number       // мм от пола
  mountingMethod: "flush" | "surface" | "recessed"
  connectedTo: UUID[]          // IDs связанных объектов
  circuitId?: UUID
  parameters: Record<string, unknown>
}

export type ElectricalPointType =
  | "outlet"
  | "outlet_waterproof"
  | "outlet_triple"
  | "switch"
  | "switch_pass_through"
  | "dimmer"
  | "light_ceiling"
  | "light_wall"
  | "light_spot"
  | "light_strip"
  | "sensor_motion"
  | "sensor_smoke"
  | "sensor_leak"
  | "thermostat"
  | "appliance_stove"
  | "appliance_boiler"
  | "appliance_ac"
  | "appliance_floor_heating"
  | "appliance_kettle"
  | "appliance_washing_machine"
  | "appliance_dishwasher"
  | "appliance_oven"
  | "appliance_fridge"
  | "panel"
  | "junction_box"
  | "cable_tray"
  | "cable_conduit"

// --- Circuit Group ---

export interface CircuitGroup extends Timestamped {
  id: UUID
  name: string
  type: CircuitType
  roomId?: UUID
  floor: number
  points: UUID[]               // IDs электроточек в группе
  breakerId?: UUID
  cableId?: UUID
  load: LoadCalculation
  phase: 1 | 2 | 3            // к какой фазе подключена
  color: string                // цвет для визуализации
}

export type CircuitType =
  | "lighting"
  | "outlets_general"
  | "outlets_kitchen"
  | "outlets_bathroom"
  | "power_ac"
  | "power_boiler"
  | "power_stove"
  | "power_floor_heating"
  | "power_washing_machine"
  | "power_other"
  | "fire_alarm"
  | "custom"

// --- Load Calculation ---

export interface LoadCalculation {
  totalPower: number           // Вт
  totalCurrent: number         // А (при 220В для 1-фаз, 380В для 3-фаз)
  demandFactor: number         // коэффициент спроса (0.5-1.0)
  simultaneousFactor: number   // коэффициент одновременности (0.5-1.0)
  effectivePower: number       // Вт × Kс × Kод
  effectiveCurrent: number     // А
}

// --- Cable ---

export interface CableSpec extends Timestamped {
  id: UUID
  type: CableType
  cores: number                // 2, 3, 4, 5
  crossSection: number         // мм² (1.5, 2.5, 4, 6, 10, 16, 25, 35, 50)
  material: "copper" | "aluminum"
  insulation: "PVC" | "XLPE" | "rubber"
  jacket: "PVC" | "LSZH" | "none"
  fireRating: "ng" | "ngd" | "LSZH"
  voltageRating: number        // 300/500, 600/1000
  currentCapacity: number      // А (при способе прокладки)
  resistance: number           // Ом/км
  reactance: number            // Ом/км
  weight: number               // кг/м
  pricePerMeter: number        // ₽/м
}

export type CableType =
  | "VVGng"
  | "VVGngd"
  | "NYM"
  | "PVS"
  | "VV"
  | "WBB"
  | "custom"

// --- Cable Route ---

export interface CableRoute extends Timestamped {
  id: UUID
  cableId: UUID
  from: UUID                   // от точки
  to: UUID                     // до щита/коробки
  waypoints: Point[]           // промежуточные точки
  length: number               // м (авто + запас 10-15%)
  method: InstallMethod
  conduitType?: "gofra" | "cable_channel" | "tray" | "pipe"
  conduitSize?: number         // мм
  viaJunctionBoxes: UUID[]     // через какие распределительные коробки
}

// --- Breaker ---

export interface BreakerSpec extends Timestamped {
  id: UUID
  manufacturer: string
  model: string
  poles: 1 | 2 | 3 | 4
  rating: number               // А (6, 10, 16, 20, 25, 32, 40, 50, 63)
  curve: "B" | "C" | "D" | "K" | "Z"
  breakingCapacity: number     // кА (4.5, 6, 10, 15, 25, 36)
  voltage: number              // V
  modules: number              // ширина в модулях (18мм)
  price: number                // ₽
  characteristic: TimeCurrentCurve
}

export interface TimeCurrentCurve {
  // Время-токовая характеристика для проверки селективности
  points: Array<{ multiple: number; time: number }> // multiple × In → time сек
}

// --- RCD (УЗО) ---

export interface RCDSpec extends Timestamped {
  id: UUID
  manufacturer: string
  model: string
  poles: 2 | 4
  rating: number               // А
  sensitivity: 10 | 30 | 100 | 300  // мА
  type: "AC" | "A" | "B" | "B+"
  breakingCapacity: number
  modules: number
  price: number
}

// --- Panel ---

export interface Panel extends Timestamped {
  id: UUID
  name: string
  position?: Point
  floor: number
  equipment: PanelEquipment[]
  rails: DINRail[]
  busbars: Busbar[]
  totalWidth: number           // мм
  totalHeight: number          // мм
  rows: number
  ipRating: string
  manufacturer?: string
  model?: string
}

export interface DINRail extends Timestamped {
  id: UUID
  row: number
  width: number                // мм (обычно 540 для 36 модулей)
  maxModules: number
  usedModules: number
  equipment: UUID[]            // IDs оборудования на рейке
}

export interface Busbar extends Timestamped {
  id: UUID
  type: "phase" | "neutral" | "ground"
  phases?: 1 | 2 | 3          // для фазных шин
  currentRating: number        // А
}

export type PanelEquipmentType =
  | "breaker"
  | "rcbo"                     // дифавтомат
  | "rccb"                     // УЗО
  | "rcd"                      // УЗО (general)
  | "contactor"
  | "timer"
  | "voltage_relay"
  | "current_monitor"
  | "meter"
  | "terminal"
  | "surge_protection"
  | "power_supply"

export interface PanelEquipment extends Timestamped {
  id: UUID
  type: PanelEquipmentType
  manufacturer: string
  model: string
  poles: 1 | 2 | 3 | 4
  rating?: number              // А
  curve?: string               // B, C, D
  sensitivity?: number         // мА (для УЗО)
  modules: number
  row: number
  position: number             // позиция на рейке (модуль)
  circuitId?: UUID             // какую группу защищает
  connectedBusbars: UUID[]
}

// --- Phase Balance ---

export interface PhaseBalance {
  L1: LoadCalculation
  L2: LoadCalculation
  L3: LoadCalculation
  maxDeviation: number         // %
  isBalanced: boolean
  recommendation?: string
}

// --- Voltage Drop ---

export interface VoltageDrop {
  percentage: number           // %
  absolute: number             // В
  isAcceptable: boolean
  limit: number                // % (обычно 5% для освещения, 3% для силовых)
  cableId: UUID
}

// --- Full Electrical Data ---

export interface ElectricalData {
  points: ElectricalPoint[]
  circuits: CircuitGroup[]
  cables: CableRoute[]
  panels: Panel[]
  breakers: BreakerSpec[]
  rcds: RCDSpec[]
  phaseBalance: PhaseBalance
  voltageDrops: VoltageDrop[]
  totalLoad: LoadCalculation
}
