import type { ElectricalPoint } from "../types"
import type { CableRoute } from "../types/electrical"
import type { Point } from "../types/common"
import type { Wall } from "../types/geometry"

function manhattanLength(points: Point[]): number {
  let lengthPx = 0
  for (let i = 1; i < points.length; i++) {
    lengthPx += Math.abs(points[i].x - points[i - 1].x) + Math.abs(points[i].y - points[i - 1].y)
  }
  return Math.round((lengthPx / 100) * 1.15 * 10) / 10
}

function nearestPointOnWall(point: Point, walls: Wall[]): { wall: Wall; projected: Point; t: number; distance: number } | null {
  let best: { wall: Wall; projected: Point; t: number; distance: number } | null = null

  for (const wall of walls) {
    const [a, b] = wall.points
    const dx = b.x - a.x
    const dy = b.y - a.y
    const lenSq = dx * dx + dy * dy
    if (lenSq === 0) continue
    const rawT = ((point.x - a.x) * dx + (point.y - a.y) * dy) / lenSq
    const t = Math.max(0, Math.min(1, rawT))
    const projected = { x: a.x + dx * t, y: a.y + dy * t }
    const distance = Math.hypot(point.x - projected.x, point.y - projected.y)
    if (!best || distance < best.distance) {
      best = { wall, projected, t, distance }
    }
  }

  return best
}

function buildLRoute(from: Point, to: Point): Point[] {
  return [
    { x: from.x, y: from.y },
    { x: to.x, y: from.y },
    { x: to.x, y: to.y },
  ]
}

function deduplicatePoints(points: Point[]): Point[] {
  if (points.length <= 2) return points
  const result: Point[] = [points[0]]
  for (let i = 1; i < points.length; i++) {
    const prev = result[result.length - 1]
    if (Math.abs(points[i].x - prev.x) > 0.5 || Math.abs(points[i].y - prev.y) > 0.5) {
      result.push(points[i])
    }
  }
  return result
}

export class RoutingEngine {
  static createPanelRoutes(panel: ElectricalPoint, points: ElectricalPoint[], walls: Wall[] = []): CableRoute[] {
    const ceilingMargin = 60

    return points.map((point, index) => {
      const waypoints: Point[] = []

      if (walls.length > 0) {
        const fromWall = nearestPointOnWall(point, walls)
        const toWall = nearestPointOnWall(panel, walls)

        if (fromWall && fromWall.distance < 400 && toWall && toWall.distance < 400) {
          const wallTopY = Math.min(fromWall.projected.y, toWall.projected.y) - ceilingMargin
          waypoints.push({ x: point.position.x, y: fromWall.projected.y })
          waypoints.push({ x: point.position.x, y: wallTopY })

          if (Math.abs(fromWall.projected.x - toWall.projected.x) > 10) {
            const midY = wallTopY
            waypoints.push({ x: toWall.projected.x, y: midY })
          }

          waypoints.push({ x: panel.position.x, y: wallTopY })
          waypoints.push({ x: panel.position.x, y: panel.position.y })
        } else {
          const ceilingY = Math.min(point.position.y, panel.position.y) - ceilingMargin
          waypoints.push({ x: point.position.x, y: ceilingY })
          if (Math.abs(point.position.x - panel.position.x) > 10) {
            waypoints.push({ x: panel.position.x, y: ceilingY })
          }
        }
      } else {
        const ceilingY = Math.min(point.position.y, panel.position.y) - ceilingMargin
        waypoints.push({ x: point.position.x, y: ceilingY })
        if (Math.abs(point.position.x - panel.position.x) > 10) {
          waypoints.push({ x: panel.position.x, y: ceilingY })
        }
      }

      const allPoints = deduplicatePoints([
        panel.position,
        ...waypoints,
        point.position,
      ])

      const method = walls.length > 0 ? "in_wall" as const : "cable_channel" as const

      return {
        id: `route_${Date.now()}_${index}`,
        cableId: `cable_virtual_${index}`,
        from: panel.id,
        to: point.id,
        waypoints: allPoints.slice(1, -1),
        length: manhattanLength(allPoints),
        method,
        conduitType: walls.length > 0 ? "pipe" as const : "cable_channel" as const,
        conduitSize: 20,
        viaJunctionBoxes: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      }
    })
  }
}
