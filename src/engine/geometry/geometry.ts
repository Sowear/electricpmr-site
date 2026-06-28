// ============================================================
// ElectricPMR — Geometry Engine (стены, комнаты, 2D-геометрия)
// ============================================================

import type {
  Wall, Room, Door, Window, GeometryObject,
  GeometryScene, Floor, RoomType, WallMaterial
} from "../types/geometry"
import type { Point, UUID, ValidationResult } from "../types/common"
import { EventBus } from "../events/eventBus"

// ============================================================
// УТИЛИТЫ
// ============================================================

function generateId(): UUID {
  return `${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
}

function distance(a: Point, b: Point): number {
  return Math.sqrt((b.x - a.x) ** 2 + (b.y - a.y) ** 2)
}

function uniqueSorted(values: number[]): number[] {
  return Array.from(new Set(values.map(value => Math.round(value)))).sort((a, b) => a - b)
}

function hasHorizontalWall(walls: Wall[], y: number, x1: number, x2: number): boolean {
  return walls.some(wall => {
    const [a, b] = wall.points
    if (Math.abs(a.y - b.y) > 1 || Math.abs(a.y - y) > 1) return false
    const left = Math.min(a.x, b.x)
    const right = Math.max(a.x, b.x)
    return left <= x1 + 1 && right >= x2 - 1
  })
}

function hasVerticalWall(walls: Wall[], x: number, y1: number, y2: number): boolean {
  return walls.some(wall => {
    const [a, b] = wall.points
    if (Math.abs(a.x - b.x) > 1 || Math.abs(a.x - x) > 1) return false
    const top = Math.min(a.y, b.y)
    const bottom = Math.max(a.y, b.y)
    return top <= y1 + 1 && bottom >= y2 - 1
  })
}

function inferRoomType(area: number): RoomType {
  if (area < 2) return "storage"
  if (area < 5) return "bathroom"
  if (area < 8) return "corridor"
  return "living"
}

// ============================================================
// GEOMETRY ENGINE
// ============================================================

class GeometryEngineImpl {

  // --- Стены ---

  createWall(
    points: [Point, Point],
    thickness: number = 200,
    height: number = 2700,
    material: WallMaterial = "brick",
    isExternal: boolean = false,
    floor: number = 1
  ): Wall {
    const wall: Wall = {
      id: generateId(),
      points,
      thickness,
      height,
      material,
      isExternal,
      floor,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    EventBus.emit({ type: "geometry.wall.created", wall })
    return wall
  }

  moveWall(wallId: string, delta: Point, walls: Wall[]): Wall | null {
    const wall = walls.find(w => w.id === wallId)
    if (!wall) return null

    const from = [wall.points[0].x, wall.points[0].y] as [number, number]
    const moved: Wall = {
      ...wall,
      points: [
        { x: wall.points[0].x + delta.x, y: wall.points[0].y + delta.y },
        { x: wall.points[1].x + delta.x, y: wall.points[1].y + delta.y },
      ],
      updatedAt: new Date(),
    }

    const to = [moved.points[0].x, moved.points[0].y] as [number, number]
    EventBus.emit({ type: "geometry.wall.moved", wallId, from, to })
    return moved
  }

  deleteWall(wallId: string): void {
    EventBus.emit({ type: "geometry.wall.deleted", wallId })
  }

  // --- Помещения (авто-определение по замкнутым контурам стен) ---

  detectRooms(walls: Wall[], floor: number = 1): Room[] {
    // Упрощённый алгоритм: ищем замкнутые контуры
    // В реальном продукте здесь будет полигон-флуд-филл
    const rooms: Room[] = []

    // Группируем стены по этажу
    const floorWalls = walls.filter(w => w.floor === floor)

    if (floorWalls.length < 3) return rooms

    const axisWalls = floorWalls.filter(w => {
      const [a, b] = w.points
      return Math.abs(a.x - b.x) < 1 || Math.abs(a.y - b.y) < 1
    })
    const xs = uniqueSorted(axisWalls.flatMap(w => w.points.map(point => point.x)))
    const ys = uniqueSorted(axisWalls.flatMap(w => w.points.map(point => point.y)))

    if (xs.length >= 2 && ys.length >= 2) {
      for (let xi = 0; xi < xs.length - 1; xi++) {
        for (let yi = 0; yi < ys.length - 1; yi++) {
          const left = xs[xi]
          const right = xs[xi + 1]
          const top = ys[yi]
          const bottom = ys[yi + 1]
          if (right - left < 80 || bottom - top < 80) continue

          const hasTop = hasHorizontalWall(axisWalls, top, left, right)
          const hasBottom = hasHorizontalWall(axisWalls, bottom, left, right)
          const hasLeft = hasVerticalWall(axisWalls, left, top, bottom)
          const hasRight = hasVerticalWall(axisWalls, right, top, bottom)
          if (!hasTop || !hasBottom || !hasLeft || !hasRight) continue

          const polygon: Point[] = [
            { x: left, y: top },
            { x: right, y: top },
            { x: right, y: bottom },
            { x: left, y: bottom },
          ]
          const area = this.calculatePolygonArea(polygon)
          if (area < 0.05) continue

          const perimeter = this.calculatePolygonPerimeter(polygon)
          const room: Room = {
            id: generateId(),
            name: `Помещение ${rooms.length + 1}`,
            type: inferRoomType(area),
            polygon,
            floor,
            ceilingHeight: 2700,
            area: Math.round(area * 100) / 100,
            perimeter: Math.round(perimeter * 100) / 100,
            volume: Math.round(area * 2.7 * 100) / 100,
            createdAt: new Date(),
            updatedAt: new Date(),
          }

          rooms.push(room)
          EventBus.emit({ type: "geometry.room.detected", room })
        }
      }

      if (rooms.length > 0) return rooms
    }

    // Простая эвристика: создаём комнату поBounding Box всех стен
    const allPoints = floorWalls.flatMap(w => w.points)
    const minX = Math.min(...allPoints.map(p => p.x))
    const maxX = Math.max(...allPoints.map(p => p.x))
    const minY = Math.min(...allPoints.map(p => p.y))
    const maxY = Math.max(...allPoints.map(p => p.y))

    // Пока создаём одну "помещение по умолчанию"
    const polygon: Point[] = [
      { x: minX, y: minY },
      { x: maxX, y: minY },
      { x: maxX, y: maxY },
      { x: minX, y: maxY },
    ]

    const area = this.calculatePolygonArea(polygon)
    const perimeter = this.calculatePolygonPerimeter(polygon)

    const room: Room = {
      id: generateId(),
      name: "Помещение",
      type: "living",
      polygon,
      floor,
      ceilingHeight: 2700,
      area: Math.round(area * 100) / 100,
      perimeter: Math.round(perimeter * 100) / 100,
      volume: Math.round(area * 2.7 * 100) / 100,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    rooms.push(room)
    EventBus.emit({ type: "geometry.room.detected", room })
    return rooms
  }

  calculatePolygonArea(polygon: Point[]): number {
    if (polygon.length < 3) return 0
    // Формула площади Гаусса (Shoelace formula)
    let area = 0
    const n = polygon.length
    for (let i = 0; i < n; i++) {
      const j = (i + 1) % n
      area += polygon[i].x * polygon[j].y
      area -= polygon[j].x * polygon[i].y
    }
    return Math.abs(area / 2) / 1_000_000 // мм² → м²
  }

  calculatePolygonPerimeter(polygon: Point[]): number {
    if (polygon.length < 2) return 0
    let perimeter = 0
    for (let i = 0; i < polygon.length; i++) {
      const j = (i + 1) % polygon.length
      perimeter += distance(polygon[i], polygon[j])
    }
    return perimeter / 1000 // мм → м
  }

  // --- Двери ---

  addDoor(
    wallId: string,
    position: number,
    width: number = 800,
    height: number = 2100,
    type: Door["type"] = "single",
    swing: Door["swing"] = "left"
  ): Door {
    const door: Door = {
      id: generateId(),
      wallId,
      position: Math.max(0, Math.min(1, position)),
      width,
      height,
      type,
      swing,
      rooms: ["", ""], // заполняется при определении комнат
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    EventBus.emit({ type: "geometry.door.added", door })
    return door
  }

  // --- Окна ---

  addWindow(
    wallId: string,
    position: number,
    width: number = 1200,
    height: number = 1400,
    sillHeight: number = 900,
    type: Window["type"] = "standard"
  ): Window {
    const window: Window = {
      id: generateId(),
      wallId,
      position: Math.max(0, Math.min(1, position)),
      width,
      height,
      sillHeight,
      type,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    EventBus.emit({ type: "geometry.window.added", window })
    return window
  }

  // --- Объекты на плане ---

  placeObject(
    type: string,
    name: string,
    position: Point,
    rotation: number = 0,
    width: number = 300,
    height: number = 300,
    roomId?: UUID,
    floor: number = 1
  ): GeometryObject {
    const object: GeometryObject = {
      id: generateId(),
      type,
      name,
      position,
      rotation,
      width,
      height,
      roomId,
      floor,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    EventBus.emit({ type: "geometry.object.placed", object })
    return object
  }

  // --- Валидация ---

  pointInRoom(point: Point, room: Room): boolean {
    const { polygon } = room
    let inside = false
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      const xi = polygon[i].x, yi = polygon[i].y
      const xj = polygon[j].x, yj = polygon[j].y
      const intersect = ((yi > point.y) !== (yj > point.y)) &&
        (point.x < (xj - xi) * (point.y - yi) / (yj - yi) + xi)
      if (intersect) inside = !inside
    }
    return inside
  }

  findRoomAtPoint(point: Point, rooms: Room[]): Room | null {
    for (const room of rooms) {
      if (this.pointInRoom(point, room)) return room
    }
    return null
  }

  validateScene(scene: GeometryScene): ValidationResult {
    const issues: ValidationResult["errors" | "warnings" | "infos"] = []

    // Проверка: есть стены
    if (scene.walls.length === 0) {
      issues.push({
        id: "val_no_walls",
        ruleId: "GEOMETRY.NO_WALLS",
        source: "geometry",
        severity: "error",
        message: "План не содержит стен",
      })
    }

    // Проверка: есть помещения
    if (scene.rooms.length === 0 && scene.walls.length >= 3) {
      issues.push({
        id: "val_no_rooms",
        ruleId: "GEOMETRY.NO_ROOMS",
        source: "geometry",
        severity: "warning",
        message: "Стены нарисованы, но не определены помещения",
      })
    }

    // Проверка: площадь помещений
    for (const room of scene.rooms) {
      if (room.area < 5) {
        issues.push({
          id: `val_small_room_${room.id}`,
          ruleId: "GEOMETRY.SMALL_ROOM",
          source: "geometry",
          severity: "warning",
          message: `Помещение "${room.name}" очень маленькое: ${room.area}м²`,
        })
      }
    }

    return {
      errors: issues.filter(i => i.severity === "error"),
      warnings: issues.filter(i => i.severity === "warning"),
      infos: issues.filter(i => i.severity === "info"),
      isValid: !issues.some(i => i.severity === "error"),
      checkedAt: new Date(),
    }
  }
}

export const GeometryEngine = new GeometryEngineImpl()
