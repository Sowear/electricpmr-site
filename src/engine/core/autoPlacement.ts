// ============================================================
// ElectricPMR — Auto-Placement Engine
// ============================================================
//
// Автоматическая расстановка розеток и выключателей
// по нормам ПУЭ 7.1.36-38 с учётом геометрии стен.
// ============================================================

import type { Room, RoomType, Point, Wall, Door, Window } from "../types/geometry"
import type { ElectricalPoint, ElectricalPointType } from "../types/electrical"

// ============================================================
// PLACEMENT RULES PER ROOM TYPE
// ============================================================

interface OutletRule {
  type: ElectricalPoint["type"]
  count: "per_wall" | "fixed"
  fixedCount?: number
  spacing?: number       // мм между розетками на стене (для per_wall)
  heightFromFloor?: number // мм (ПУЭ 7.1.36 = 300)
  namePrefix: string
  power: number
  distanceFromCorner?: number // мм от угла стены
}

interface RoomPlacementRules {
  outlets: OutletRule[]
  switch?: {
    type: ElectricalPoint["type"]
    heightFromFloor: number  // ПУЭ: 800-900мм
    namePrefix: string
  }
  light?: {
    type: ElectricalPoint["type"]
    power: number
    namePrefix: string
  }
}

const ROOM_RULES: Record<RoomType, RoomPlacementRules> = {
  living: {
    outlets: [
      { type: "outlet", count: "per_wall", spacing: 1800, heightFromFloor: 300, namePrefix: "Розетка", power: 0, distanceFromCorner: 200 },
    ],
    switch: { type: "switch", heightFromFloor: 850, namePrefix: "Выключатель" },
    light: { type: "light_ceiling", power: 80, namePrefix: "Свет" },
  },
  bedroom: {
    outlets: [
      { type: "outlet", count: "per_wall", spacing: 1800, heightFromFloor: 300, namePrefix: "Розетка", power: 0, distanceFromCorner: 200 },
    ],
    switch: { type: "switch", heightFromFloor: 850, namePrefix: "Выключатель" },
    light: { type: "light_ceiling", power: 80, namePrefix: "Свет" },
  },
  kitchen: {
    outlets: [
      { type: "outlet_triple", count: "per_wall", spacing: 1200, heightFromFloor: 300, namePrefix: "Розетка рабочая зона", power: 1800, distanceFromCorner: 300 },
      { type: "appliance_stove", count: "fixed", fixedCount: 1, heightFromFloor: 300, namePrefix: "Электроплита", power: 7000 },
    ],
    switch: { type: "switch", heightFromFloor: 850, namePrefix: "Выключатель" },
    light: { type: "light_ceiling", power: 80, namePrefix: "Свет" },
  },
  bathroom: {
    outlets: [
      { type: "outlet_waterproof", count: "fixed", fixedCount: 1, heightFromFloor: 300, namePrefix: "Розетка IP44", power: 700 },
    ],
    light: { type: "light_ceiling", power: 80, namePrefix: "Свет" },
  },
  hall: {
    outlets: [
      { type: "outlet", count: "per_wall", spacing: 2000, heightFromFloor: 300, namePrefix: "Розетка", power: 0, distanceFromCorner: 200 },
    ],
    switch: { type: "switch", heightFromFloor: 850, namePrefix: "Выключатель" },
    light: { type: "light_ceiling", power: 60, namePrefix: "Свет" },
  },
  corridor: {
    outlets: [],
    switch: { type: "switch", heightFromFloor: 850, namePrefix: "Выключатель" },
    light: { type: "light_ceiling", power: 60, namePrefix: "Свет" },
  },
  garage: {
    outlets: [
      { type: "outlet", count: "per_wall", spacing: 2000, heightFromFloor: 300, namePrefix: "Розетка", power: 0, distanceFromCorner: 200 },
    ],
    switch: { type: "switch", heightFromFloor: 850, namePrefix: "Выключатель" },
    light: { type: "light_ceiling", power: 80, namePrefix: "Свет" },
  },
  basement: {
    outlets: [
      { type: "outlet", count: "per_wall", spacing: 2000, heightFromFloor: 300, namePrefix: "Розетка", power: 0, distanceFromCorner: 200 },
    ],
    switch: { type: "switch", heightFromFloor: 850, namePrefix: "Выключатель" },
    light: { type: "light_ceiling", power: 60, namePrefix: "Свет" },
  },
  storage: {
    outlets: [
      { type: "outlet", count: "fixed", fixedCount: 1, heightFromFloor: 300, namePrefix: "Розетка", power: 0 },
    ],
    light: { type: "light_ceiling", power: 40, namePrefix: "Свет" },
  },
  office: {
    outlets: [
      { type: "outlet_triple", count: "per_wall", spacing: 1500, heightFromFloor: 300, namePrefix: "Розетка рабочая зона", power: 1500, distanceFromCorner: 300 },
    ],
    switch: { type: "switch", heightFromFloor: 850, namePrefix: "Выключатель" },
    light: { type: "light_ceiling", power: 80, namePrefix: "Свет" },
  },
  server_room: {
    outlets: [
      { type: "outlet_triple", count: "per_wall", spacing: 1000, heightFromFloor: 300, namePrefix: "Розетка сервер", power: 2000, distanceFromCorner: 200 },
    ],
    light: { type: "light_ceiling", power: 80, namePrefix: "Свет" },
  },
  custom: {
    outlets: [
      { type: "outlet", count: "per_wall", spacing: 1800, heightFromFloor: 300, namePrefix: "Розетка", power: 0, distanceFromCorner: 200 },
    ],
    switch: { type: "switch", heightFromFloor: 850, namePrefix: "Выключатель" },
    light: { type: "light_ceiling", power: 80, namePrefix: "Свет" },
  },
}

// ============================================================
// GEOMETRY HELPERS
// ============================================================

function wallLength(a: Point, b: Point): number {
  return Math.sqrt((b.x - a.x) ** 2 + (b.y - a.y) ** 2)
}

function midpoint(a: Point, b: Point): Point {
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }
}

function interpolate(a: Point, b: Point, t: number): Point {
  return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t }
}

function distanceToSegment(point: Point, a: Point, b: Point): number {
  const dx = b.x - a.x
  const dy = b.y - a.y
  const lenSq = dx * dx + dy * dy
  if (lenSq === 0) return wallLength(point, a)
  let t = ((point.x - a.x) * dx + (point.y - a.y) * dy) / lenSq
  t = Math.max(0, Math.min(1, t))
  return wallLength(point, interpolate(a, b, t))
}

function pointNearAnyDoor(point: Point, doors: Door[], threshold: number): boolean {
  return doors.some(door => {
    const doorMid = midpoint(door.points[0], door.points[1])
    return wallLength(point, doorMid) < threshold
  })
}

function pointNearAnyWindow(point: Point, windows: Window[], threshold: number): boolean {
  return windows.some(win => {
    const winMid = midpoint(win.points[0], win.points[1])
    return wallLength(point, winMid) < threshold
  })
}

// ============================================================
// PLACEMENT ALGORITHM
// ============================================================

export interface PlacementResult {
  points: Array<{
    type: ElectricalPoint["type"]
    name: string
    position: Point
    power: number
    roomId: string
  }>
  summary: {
    totalOutlets: number
    totalSwitches: number
    totalLights: number
    roomBreakdown: Array<{ roomName: string; roomType: RoomType; outlets: number; switches: number; lights: number }>
  }
}

function getRoomWalls(room: Room): Array<[Point, Point]> {
  const walls: Array<[Point, Point]> = []
  for (let i = 0; i < room.polygon.length; i++) {
    const a = room.polygon[i]
    const b = room.polygon[(i + 1) % room.polygon.length]
    if (wallLength(a, b) > 200) { // skip tiny edges
      walls.push([a, b])
    }
  }
  return walls
}

function placeOutletsOnWall(
  wallStart: Point,
  wallEnd: Point,
  rule: OutletRule,
  existingPoints: ElectricalPoint[],
  doors: Door[],
  windows: Window[],
): Array<{ type: ElectricalPoint["type"]; name: string; position: Point; power: number }> {
  const results: Array<{ type: ElectricalPoint["type"]; name: string; position: Point; power: number }> = []
  const len = wallLength(wallStart, wallEnd)

  if (rule.count === "fixed") {
    const count = rule.fixedCount ?? 1
    for (let i = 0; i < count; i++) {
      const t = (i + 1) / (count + 1)
      const pos = interpolate(wallStart, wallEnd, t)
      const distFromCorner = rule.distanceFromCorner ?? 200
      if (len > distFromCorner * 2) {
        const adjusted = interpolate(wallStart, wallEnd, (distFromCorner + t * (len - 2 * distFromCorner)) / len)
        if (!pointNearAnyDoor(adjusted, doors, 500) && !pointNearAnyWindow(adjusted, windows, 300)) {
          results.push({ type: rule.type, name: rule.namePrefix, position: adjusted, power: rule.power })
        }
      }
    }
    return results
  }

  // per_wall: place outlets spaced by rule.spacing
  const spacing = rule.spacing ?? 1800
  const distFromCorner = rule.distanceFromCorner ?? 200
  const usableLen = Math.max(0, len - 2 * distFromCorner)
  if (usableLen < spacing * 0.5) {
    // Wall too short for even one outlet — place in middle
    const mid = midpoint(wallStart, wallEnd)
    if (!pointNearAnyDoor(mid, doors, 500) && !pointNearAnyWindow(mid, windows, 300)) {
      results.push({ type: rule.type, name: rule.namePrefix, position: mid, power: rule.power })
    }
    return results
  }

  const count = Math.max(1, Math.floor(usableLen / spacing) + 1)
  for (let i = 0; i < count; i++) {
    const t = (distFromCorner + i * spacing) / len
    if (t > 1) break
    const pos = interpolate(wallStart, wallEnd, t)
    if (!pointNearAnyDoor(pos, doors, 500) && !pointNearAnyWindow(pos, windows, 300)) {
      results.push({ type: rule.type, name: rule.namePrefix, position: pos, power: rule.power })
    }
  }

  return results
}

// ============================================================
// PUBLIC API
// ============================================================

export function autoPlaceInRoom(
  room: Room,
  doors: Door[],
  windows: Window[],
  existingPoints: ElectricalPoint[],
  _allRooms: Room[],
): PlacementResult["points"] {
  const rules = ROOM_RULES[room.type] ?? ROOM_RULES.custom
  const points: PlacementResult["points"] = []
  const walls = getRoomWalls(room)

  // Place outlets along walls
  for (const rule of rules.outlets) {
    if (rule.count === "per_wall") {
      for (const [wallStart, wallEnd] of walls) {
        const placed = placeOutletsOnWall(wallStart, wallEnd, rule, existingPoints, doors, windows)
        for (const p of placed) {
          if (!existingPoints.some(ep => wallLength(ep.position, p.position) < 300)) {
            points.push({ ...p, roomId: room.id })
          }
        }
      }
    } else {
      // Fixed count — place on longest wall
      if (walls.length > 0) {
        const longestWall = walls.reduce((best, w) => {
          const len = wallLength(w[0], w[1])
          return len > wallLength(best[0], best[1]) ? w : best
        }, walls[0])
        const placed = placeOutletsOnWall(longestWall[0], longestWall[1], rule, existingPoints, doors, windows)
        for (const p of placed) {
          if (!existingPoints.some(ep => wallLength(ep.position, p.position) < 300)) {
            points.push({ ...p, roomId: room.id })
          }
        }
      }
    }
  }

  // Place switch near door
  if (rules.switch) {
    const door = doors.find(d => {
      const doorMid = midpoint(d.points[0], d.points[1])
      return walls.some(([a, b]) => distanceToSegment(doorMid, a, b) < 500)
    })
    if (door) {
      const doorMid = midpoint(door.points[0], door.points[1])
      const switchPos = { x: doorMid.x + 200, y: doorMid.y }
      if (!existingPoints.some(ep => wallLength(ep.position, switchPos) < 300)) {
        points.push({
          type: rules.switch.type,
          name: rules.switch.namePrefix,
          position: switchPos,
          power: 0,
          roomId: room.id,
        })
      }
    }
  }

  // Place light at center
  if (rules.light) {
    const center = room.polygon.reduce(
      (acc, p) => ({ x: acc.x + p.x, y: acc.y + p.y }),
      { x: 0, y: 0 }
    )
    const lightPos = { x: center.x / room.polygon.length, y: center.y / room.polygon.length }
    if (!existingPoints.some(ep => ep.type.startsWith("light") && wallLength(ep.position, lightPos) < 300)) {
      points.push({
        type: rules.light.type,
        name: rules.light.namePrefix,
        position: lightPos,
        power: rules.light.power,
        roomId: room.id,
      })
    }
  }

  return points
}

export function autoPlaceAll(
  rooms: Room[],
  walls: Wall[],
  doors: Door[],
  windows: Window[],
  existingPoints: ElectricalPoint[],
): PlacementResult {
  const allPoints: PlacementResult["points"] = []
  const roomBreakdown: PlacementResult["summary"]["roomBreakdown"] = []

  for (const room of rooms) {
    const roomPoints = autoPlaceInRoom(room, doors, windows, [...existingPoints, ...allPoints], rooms)
    allPoints.push(...roomPoints)

    const outlets = roomPoints.filter(p => p.type.startsWith("outlet") || p.type.startsWith("appliance")).length
    const switches = roomPoints.filter(p => p.type.startsWith("switch")).length
    const lights = roomPoints.filter(p => p.type.startsWith("light")).length

    roomBreakdown.push({
      roomName: room.name,
      roomType: room.type,
      outlets,
      switches,
      lights,
    })
  }

  return {
    points: allPoints,
    summary: {
      totalOutlets: allPoints.filter(p => p.type.startsWith("outlet") || p.type.startsWith("appliance")).length,
      totalSwitches: allPoints.filter(p => p.type.startsWith("switch")).length,
      totalLights: allPoints.filter(p => p.type.startsWith("light")).length,
      roomBreakdown,
    },
  }
}
