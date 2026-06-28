// ============================================================
// ElectricPMR — DXF Export
// ============================================================
//
// Экспорт схемы в формат DXF (AutoCAD).
// Слои: WROOMS, WALLS, DOORS, WINDOWS, ELECTRICAL, CABLES, TEXT
// ============================================================

import type { Wall, Room, Door, Window, Point } from "../types/geometry"
import type { ElectricalPoint, CableRoute } from "../types/electrical"

// ============================================================
// DXF GENERATOR
// ============================================================

interface DxfExportOptions {
  projectName?: string
  scale?: number       // mm per unit (default 1 = 1mm)
  includeRooms?: boolean
  includeWalls?: boolean
  includeDoors?: boolean
  includeWindows?: boolean
  includeElectrical?: boolean
  includeCables?: boolean
  includeLabels?: boolean
}

const DEFAULT_OPTIONS: DxfExportOptions = {
  projectName: "ElectricPMR Export",
  scale: 1,
  includeRooms: true,
  includeWalls: true,
  includeDoors: true,
  includeWindows: true,
  includeElectrical: true,
  includeCables: true,
  includeLabels: true,
}

// ============================================================
// DXF PRIMITIVES
// ============================================================

let handleCounter = 100

function nextHandle(): string {
  return (handleCounter++).toString(16).toUpperCase()
}

function dxfLine(
  x1: number, y1: number, x2: number, y2: number,
  layer: string, color?: number,
): string {
  const h = nextHandle()
  return [
    `  0`, `LINE`,
    `  5`, h,
    `  8`, layer,
    color !== undefined ? `  62` : null, color?.toString() ?? null,
    ` 10`, x1.toFixed(3),
    ` 20`, y1.toFixed(3),
    ` 30`, `0.0`,
    ` 11`, x2.toFixed(3),
    ` 21`, y2.toFixed(3),
    ` 31`, `0.0`,
  ].filter(Boolean).join("\n")
}

function dxfCircle(
  cx: number, cy: number, r: number,
  layer: string, color?: number,
): string {
  const h = nextHandle()
  return [
    `  0`, `CIRCLE`,
    `  5`, h,
    `  8`, layer,
    color !== undefined ? `  62` : null, color?.toString() ?? null,
    ` 10`, cx.toFixed(3),
    ` 20`, cy.toFixed(3),
    ` 30`, `0.0`,
    ` 40`, r.toFixed(3),
  ].filter(Boolean).join("\n")
}

function dxfText(
  x: number, y: number, text: string,
  layer: string, height: number = 100, color?: number,
): string {
  const h = nextHandle()
  return [
    `  0`, `TEXT`,
    `  5`, h,
    `  8`, layer,
    color !== undefined ? `  62` : null, color?.toString() ?? null,
    ` 10`, x.toFixed(3),
    ` 20`, y.toFixed(3),
    ` 30`, `0.0`,
    ` 40`, height.toFixed(1),
    `  1`, text,
    ` 72`, `0`,
  ].filter(Boolean).join("\n")
}

function dxfPolyline(
  points: Point[], layer: string, closed: boolean = false, color?: number,
): string {
  if (points.length < 2) return ""
  const h = nextHandle()
  const lines: string[] = [
    `  0`, `POLYLINE`,
    `  5`, h,
    `  8`, layer,
    color !== undefined ? `  62` : null, color?.toString() ?? null,
    ` 66`, `1`,
    ` 70`, closed ? `1` : `0`,
  ]

  for (const p of points) {
    lines.push(
      `  0`, `VERTEX`,
      `  5`, nextHandle(),
      `  8`, layer,
      ` 10`, p.x.toFixed(3),
      ` 20`, p.y.toFixed(3),
      ` 30`, `0.0`,
    )
  }

  lines.push(`  0`, `SEQEND`)
  return lines.filter(Boolean).join("\n")
}

function dxfArc(
  cx: number, cy: number, r: number,
  startAngle: number, endAngle: number,
  layer: string, color?: number,
): string {
  const h = nextHandle()
  return [
    `  0`, `ARC`,
    `  5`, h,
    `  8`, layer,
    color !== undefined ? `  62` : null, color?.toString() ?? null,
    ` 10`, cx.toFixed(3),
    ` 20`, cy.toFixed(3),
    ` 30`, `0.0`,
    ` 40`, r.toFixed(3),
    ` 50`, startAngle.toFixed(1),
    ` 51`, endAngle.toFixed(1),
  ].filter(Boolean).join("\n")
}

// ============================================================
// POINT TYPE → DXF COLOR MAPPING
// ============================================================

const POINT_COLORS: Record<string, number> = {
  outlet: 5,              // blue
  outlet_waterproof: 4,   // cyan
  outlet_triple: 5,       // blue
  switch: 2,              // yellow
  switch_pass_through: 2, // yellow
  dimmer: 2,              // yellow
  light_ceiling: 1,       // red
  light_wall: 1,          // red
  light_spot: 1,          // red
  light_strip: 1,         // red
  sensor_motion: 6,       // magenta
  sensor_smoke: 6,        // magenta
  sensor_leak: 4,         // cyan
  thermostat: 3,          // green
  panel: 7,               // white
  junction_box: 7,        // white
  appliance_stove: 6,
  appliance_boiler: 4,
  appliance_ac: 4,
  appliance_washing_machine: 5,
  appliance_floor_heating: 6,
  appliance_kettle: 2,
  appliance_dishwasher: 5,
  appliance_oven: 6,
  appliance_fridge: 3,
}

// ============================================================
// LABEL MAP
// ============================================================

const POINT_LABELS: Record<string, string> = {
  outlet: "Р", outlet_waterproof: "IP", outlet_triple: "3Р",
  switch: "В", switch_pass_through: "ПВ", dimmer: "Д",
  light_ceiling: "Л", light_wall: "Б", light_spot: "Т", light_strip: "LED",
  sensor_motion: "ДД", sensor_smoke: "ДМ", sensor_leak: "ДП",
  thermostat: "Тр", panel: "Щ", junction_box: "К",
  appliance_stove: "ПЛ", appliance_boiler: "Б", appliance_ac: "Кн",
  appliance_washing_machine: "СМ", appliance_floor_heating: "ТП",
  appliance_kettle: "Ч", appliance_dishwasher: "ПМ",
  appliance_oven: "Дх", appliance_fridge: "Х",
}

// ============================================================
// MAIN EXPORT FUNCTION
// ============================================================

export function generateDXF(
  walls: Wall[],
  rooms: Room[],
  doors: Door[],
  windows: Window[],
  points: ElectricalPoint[],
  cables: CableRoute[],
  options: DxfExportOptions = {},
): string {
  const opts = { ...DEFAULT_OPTIONS, ...options }
  handleCounter = 100
  const entities: string[] = []

  // --- ROOMS (filled polygons) ---
  if (opts.includeRooms && rooms.length > 0) {
    for (const room of rooms) {
      entities.push(dxfPolyline(room.polygon, "ROOMS", true, 8)) // color 8 = dark gray
      if (opts.includeLabels) {
        const center = room.polygon.reduce(
          (acc, p) => ({ x: acc.x + p.x, y: acc.y + p.y }),
          { x: 0, y: 0 }
        )
        entities.push(dxfText(
          center.x / room.polygon.length,
          center.y / room.polygon.length,
          `${room.name}\n${room.area.toFixed(1)}м²`,
          "ROOMS", 120, 8,
        ))
      }
    }
  }

  // --- WALLS ---
  if (opts.includeWalls && walls.length > 0) {
    for (const wall of walls) {
      entities.push(dxfLine(
        wall.points[0].x, wall.points[0].y,
        wall.points[1].x, wall.points[1].y,
        "WALLS", 7,
      ))
    }
  }

  // --- DOORS (arc + line) ---
  if (opts.includeDoors && doors.length > 0) {
    for (const door of doors) {
      const a = door.points[0]
      const b = door.points[1]
      entities.push(dxfLine(a.x, a.y, b.x, b.y, "DOORS", 3))
      // swing arc
      const mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }
      const r = Math.sqrt((b.x - a.x) ** 2 + (b.y - a.y) ** 2) / 2
      const angle = Math.atan2(b.y - a.y, b.x - a.x) * 180 / Math.PI
      entities.push(dxfArc(mid.x, mid.y, r, angle, angle + 90, "DOORS", 3))
    }
  }

  // --- WINDOWS ---
  if (opts.includeWindows && windows.length > 0) {
    for (const win of windows) {
      const a = win.points[0]
      const b = win.points[1]
      entities.push(dxfLine(a.x, a.y, b.x, b.y, "WINDOWS", 4))
      // window sill lines
      const dx = b.x - a.x
      const dy = b.y - a.y
      const nx = -dy * 0.15
      const ny = dx * 0.15
      entities.push(dxfLine(a.x + nx, a.y + ny, b.x + nx, b.y + ny, "WINDOWS", 4))
      entities.push(dxfLine(a.x - nx, a.y - ny, b.x - nx, b.y - ny, "WINDOWS", 4))
    }
  }

  // --- ELECTRICAL POINTS ---
  if (opts.includeElectrical && points.length > 0) {
    for (const point of points) {
      const color = POINT_COLORS[point.type] ?? 7
      const r = point.type === "panel" ? 200 : 80
      entities.push(dxfCircle(point.position.x, point.position.y, r, "ELECTRICAL", color))

      if (opts.includeLabels) {
        const label = POINT_LABELS[point.type] ?? "?"
        entities.push(dxfText(
          point.position.x + r + 30,
          point.position.y + 30,
          label,
          "ELECTRICAL", 80, color,
        ))
      }
    }
  }

  // --- CABLE ROUTES ---
  if (opts.includeCables && cables.length > 0) {
    for (const cable of cables) {
      const allPoints: Point[] = [cable.waypoints[0] ?? { x: 0, y: 0 }, ...cable.waypoints.slice(1)]
      if (allPoints.length >= 2) {
        entities.push(dxfPolyline(allPoints, "CABLES", false, 2))
      }
    }
  }

  // --- HEADER ---
  const header = [
    `  0`, `SECTION`,
    `  2`, `HEADER`,
    `  9`, `$ACADVER`, `  1`, `AC1009`,
    `  9`, `$INSBASE`, ` 10`, `0.0`, ` 20`, `0.0`, ` 30`, `0.0`,
    `  9`, `$EXTMIN`, ` 10`, `-1000`, ` 20`, `-1000`,
    `  9`, `$EXTMAX`, ` 10`, `10000`, ` 20`, `10000`,
    `  0`, `ENDSEC`,
  ].join("\n")

  // --- TABLES ---
  const allLayers: Array<[string, boolean]> = [
    ["ROOMS", !!opts.includeRooms],
    ["WALLS", !!opts.includeWalls],
    ["DOORS", !!opts.includeDoors],
    ["WINDOWS", !!opts.includeWindows],
    ["ELECTRICAL", !!opts.includeElectrical],
    ["CABLES", !!opts.includeCables],
    ["TEXT", !!opts.includeLabels],
  ]
  const layers = allLayers.filter(([, enabled]) => enabled).map(([name]) => name)
  const tables = [
    `  0`, `SECTION`, `  2`, `TABLES`,
    `  0`, `TABLE`, `  2`, `LAYER`, ` 70`, `${layers.length}`,
    ...layers.flatMap((name, i) => [
      `  0`, `LAYER`,
      `  2`, name,
      ` 70`, `0`,
      ` 62`, `${i + 1}`,
      ` 6`, `CONTINUOUS`,
    ]),
    `  0`, `ENDTAB`,
    `  0`, `ENDSEC`,
  ].join("\n")

  // --- ENTITIES ---
  const entitiesSection = [
    `  0`, `SECTION`,
    `  2`, `ENTITIES`,
    ...entities,
    `  0`, `ENDSEC`,
  ].join("\n")

  // --- EOF ---
  return [
    header,
    tables,
    entitiesSection,
    `  0`, `EOF`,
  ].join("\n")
}

export function downloadDXF(dxfContent: string, filename: string = "project.dxf"): void {
  const blob = new Blob([dxfContent], { type: "application/dxf" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
