import { useEffect, useRef, useState } from "react"
import * as fabric from "fabric"
import { useProjectStore } from "@/stores/projectStore"
import { Badge } from "@/components/ui/badge"
import { SelectionEngine } from "../selection"
import type { Point, UUID } from "../types/common"
import type { ElectricalPoint } from "../types"
import type { Door, GeometryObject, Room, Wall, Window } from "../types/geometry"
import { getPointColor, getPointLabel, getDefaultMountingHeight, getPointNameRu } from "@/engine/pointCatalog"

interface CanvasEngineProps {
  width?: number
  height?: number
}

const GRID_SIZE = 20

export function CanvasEngine({ width = 800, height = 600 }: CanvasEngineProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const fabricRef = useRef<fabric.Canvas | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [canvasSize, setCanvasSize] = useState({ width, height })

  const scene = useProjectStore(s => s.scene)
  const electrical = useProjectStore(s => s.electrical)
  const ui = useProjectStore(s => s.ui)
  const selectObject = useProjectStore(s => s.selectObject)
  const undo = useProjectStore(s => s.undo)
  const redo = useProjectStore(s => s.redo)
  const addWall = useProjectStore(s => s.addWall)
  const addDoor = useProjectStore(s => s.addDoor)
  const addWindow = useProjectStore(s => s.addWindow)
  const moveWall = useProjectStore(s => s.moveWall)
  const moveObject = useProjectStore(s => s.moveObject)
  const removeWall = useProjectStore(s => s.removeWall)
  const removeRoom = useProjectStore(s => s.removeRoom)
  const removeDoor = useProjectStore(s => s.removeDoor)
  const removeWindow = useProjectStore(s => s.removeWindow)
  const removeObject = useProjectStore(s => s.removeObject)
  const addElectricalPoint = useProjectStore(s => s.addElectricalPoint)
  const removeElectricalPoint = useProjectStore(s => s.removeElectricalPoint)
  const moveElectricalPoint = useProjectStore(s => s.moveElectricalPoint)

  useEffect(() => {
    if (!canvasRef.current || !containerRef.current) return

    const rect = containerRef.current.getBoundingClientRect()
    const canvas = new fabric.Canvas(canvasRef.current, {
      width: rect.width || width,
      height: rect.height || height,
      backgroundColor: "#f4f7fb",
      selection: true,
      selectionColor: "rgba(14, 116, 144, 0.12)",
      selectionBorderColor: "#0e7490",
      selectionLineWidth: 1,
      preserveObjectStacking: true,
    })

    fabricRef.current = canvas
    setCanvasSize({ width: rect.width || width, height: rect.height || height })

    let isPanning = false
    let lastPosX = 0
    let lastPosY = 0

    canvas.on("mouse:wheel", (opt) => {
      const delta = opt.e.deltaY
      const nextZoom = Math.min(5, Math.max(0.15, canvas.getZoom() * 0.999 ** delta))
      canvas.zoomToPoint(new fabric.Point(opt.e.offsetX, opt.e.offsetY), nextZoom)
      opt.e.preventDefault()
      opt.e.stopPropagation()
    })

    canvas.on("mouse:down", (opt) => {
      if (opt.e.button === 1 || opt.e.altKey) {
        isPanning = true
        lastPosX = opt.e.clientX
        lastPosY = opt.e.clientY
        canvas.selection = false
        return
      }

      if (!opt.target && (!useProjectStore.getState().ui.activeTool || useProjectStore.getState().ui.activeTool === "select")) {
        SelectionEngine.deselectAll()
        selectObject(null)
      }
    })

    canvas.on("mouse:move", (opt) => {
      if (!isPanning) return

      const vpt = canvas.viewportTransform
      if (vpt) {
        vpt[4] += opt.e.clientX - lastPosX
        vpt[5] += opt.e.clientY - lastPosY
        canvas.requestRenderAll()
      }
      lastPosX = opt.e.clientX
      lastPosY = opt.e.clientY
    })

    canvas.on("mouse:up", () => {
      isPanning = false
      canvas.selection = true
    })

    canvas.on("selection:created", () => selectActiveCanvasObject(canvas, selectObject))
    canvas.on("selection:updated", () => selectActiveCanvasObject(canvas, selectObject))
    canvas.on("selection:cleared", () => {
      SelectionEngine.deselectAll()
      selectObject(null)
    })

    const resizeObserver = new ResizeObserver(entries => {
      const entry = entries[0]
      if (!entry) return

      const { width: nextWidth, height: nextHeight } = entry.contentRect
      canvas.setDimensions({ width: nextWidth, height: nextHeight })
      setCanvasSize({ width: nextWidth, height: nextHeight })
    })
    resizeObserver.observe(containerRef.current)

    return () => {
      resizeObserver.disconnect()
      canvas.dispose()
      fabricRef.current = null
    }
  }, [height, selectObject, width])

  useEffect(() => {
    const canvas = fabricRef.current
    if (!canvas) return

    // Remove only data objects (with data.id), keep grid lines intact
    canvas.getObjects().forEach(obj => {
      if (obj.data?.id) canvas.remove(obj)
    })

    scene.rooms.forEach(room => {
      canvas.add(createRoomObject(room))
    })

    scene.walls.forEach(wall => {
      const line = new fabric.Line(
        [wall.points[0].x, wall.points[0].y, wall.points[1].x, wall.points[1].y],
        {
          stroke: "#172033",
          strokeWidth: Math.max(6, wall.thickness / 24),
          strokeLineCap: "round",
          selectable: true,
          hasControls: false,
          lockScalingX: true,
          lockScalingY: true,
          lockRotation: true,
          data: { id: wall.id, type: "wall", points: wall.points },
          hoverCursor: "move",
        }
      )
      canvas.add(line)
    })

    electrical.cables.forEach(route => {
      const from = electrical.points.find(point => point.id === route.from)
      const to = electrical.points.find(point => point.id === route.to)
      if (from && to) {
        canvas.add(createCableRouteObject(from.position, route.waypoints, to.position))
      }
    })

    scene.doors.forEach(door => {
      const wall = scene.walls.find(w => w.id === door.wallId)
      if (wall) canvas.add(createDoorObject(door, wall))
    })

    scene.windows.forEach(windowItem => {
      const wall = scene.walls.find(w => w.id === windowItem.wallId)
      if (wall) canvas.add(createWindowObject(windowItem, wall))
    })

    scene.objects.forEach(object => {
      canvas.add(createFurnitureObject(object))
    })

    electrical.points.forEach(point => {
      canvas.add(createPointObject(point, getPointStatus(point)))
    })

    canvas.renderAll()
  }, [canvasSize.height, canvasSize.width, electrical.cables, electrical.points, scene.doors, scene.objects, scene.rooms, scene.walls, scene.windows])

  // Draw grid on canvas size change, update visibility on toggle
  useEffect(() => {
    const canvas = fabricRef.current
    if (!canvas) return
    // Remove old grid lines (those with excludeFromExport but no data.id)
    canvas.getObjects().forEach(obj => {
      if (obj.excludeFromExport && !obj.data?.id) canvas.remove(obj)
    })
    if (ui.showGrid) {
      drawGrid(canvas, canvasSize.width, canvasSize.height)
      canvas.renderAll()
    }
  }, [canvasSize.height, canvasSize.width, ui.showGrid])

  useEffect(() => {
    const canvas = fabricRef.current
    if (!canvas) return

    const onModified = (event: fabric.TEvent) => {
      const obj = event.target as fabric.FabricObject | undefined
      if (!obj?.data?.id) return
      const st = useProjectStore.getState()

      if (obj.data.type === "wall") {
        const original = obj.data.points as [Point, Point]
        const delta = { x: obj.left ?? 0, y: obj.top ?? 0 }
        st.moveWall(obj.data.id, [
          snapPoint({ x: original[0].x + delta.x, y: original[0].y + delta.y }, st.ui.snapToGrid),
          snapPoint({ x: original[1].x + delta.x, y: original[1].y + delta.y }, st.ui.snapToGrid),
        ])
        return
      }

      if (isElectricalCanvasType(obj.data.type)) {
        if (obj.data.type === "furniture") {
          st.moveObject(obj.data.id, snapPoint({ x: obj.left ?? 0, y: obj.top ?? 0 }, st.ui.snapToGrid))
          return
        }
        const center = obj.getCenterPoint()
        st.moveElectricalPoint(obj.data.id, snapPlacementPoint({ x: center.x, y: center.y }, st.scene.walls, st.ui.snapToGrid).point)
      }
    }

    canvas.on("object:modified", onModified)
    return () => { canvas.off("object:modified", onModified) }
  }, [])

  useEffect(() => {
    const canvas = fabricRef.current
    if (!canvas) return

    const onMouseDown = (opt: fabric.TPointerEventInfo) => {
      const currentState = useProjectStore.getState()
      const activeTool = currentState.ui.activeTool
      const walls = currentState.scene.walls
      const snapToGrid = currentState.ui.snapToGrid
      if (!activeTool || activeTool === "select" || activeTool === "wall") return

      const rawPointer = getEventPoint(opt)
      const pointer = snapPlacementPoint(rawPointer, walls, snapToGrid)

      if (activeTool === "door" || activeTool === "window") {
        const targetWall = opt.target?.data?.type === "wall"
          ? walls.find(wall => wall.id === opt.target?.data?.id)
          : undefined
        const nearest = targetWall
          ? { wall: targetWall, ...projectPointToSegment(rawPointer, targetWall.points[0], targetWall.points[1]) }
          : findNearestWall(rawPointer, walls)
        if (!nearest) return

        if (activeTool === "door") addDoor(nearest.wall.id, nearest.t)
        if (activeTool === "window") addWindow(nearest.wall.id, nearest.t)
        return
      }

      const pointType = toolToPointType(activeTool)
      if (!pointType) return

      addElectricalPoint({
        type: pointType,
        name: getDefaultName(pointType),
        position: pointer.point,
        mountingHeight: getDefaultMountingHeight(pointType),
        parameters: {
          wallId: pointer.wall?.id,
          wallPosition: pointer.t,
          snappedToWall: Boolean(pointer.wall),
        },
      })
    }

    canvas.defaultCursor = ui.activeTool && ui.activeTool !== "select" ? "crosshair" : "default"
    canvas.on("mouse:down", onMouseDown)
    return () => { canvas.off("mouse:down", onMouseDown) }
  }, [addDoor, addElectricalPoint, addWindow, scene.walls, ui.activeTool, ui.snapToGrid])

  useEffect(() => {
    const canvas = fabricRef.current
    if (!canvas || ui.activeTool !== "wall") return

    let startPoint: Point | null = null
    let tempLine: fabric.Line | null = null

    const onMouseDown = (opt: fabric.TPointerEventInfo) => {
      startPoint = snapDrawingPoint(getEventPoint(opt), useProjectStore.getState().scene.walls, ui.snapToGrid)
      tempLine = new fabric.Line([startPoint.x, startPoint.y, startPoint.x, startPoint.y], {
        stroke: "#0e7490",
        strokeWidth: 3,
        strokeDashArray: [8, 8],
        selectable: false,
        evented: false,
      })
      canvas.add(tempLine)
    }

    const onMouseMove = (opt: fabric.TPointerEventInfo) => {
      if (!startPoint || !tempLine) return

      const pointer = snapDrawingPoint(getEventPoint(opt), useProjectStore.getState().scene.walls, ui.snapToGrid)
      tempLine.set({ x2: pointer.x, y2: pointer.y })
      canvas.renderAll()
    }

    const onMouseUp = (opt: fabric.TPointerEventInfo) => {
      if (!startPoint || !tempLine) return

      const endPoint = snapDrawingPoint(getEventPoint(opt), useProjectStore.getState().scene.walls, ui.snapToGrid)
      const distance = Math.hypot(endPoint.x - startPoint.x, endPoint.y - startPoint.y)
      canvas.remove(tempLine)
      tempLine = null

      if (distance > GRID_SIZE) {
        addWall([startPoint, endPoint])
      }
      startPoint = null
    }

    canvas.on("mouse:down", onMouseDown)
    canvas.on("mouse:move", onMouseMove)
    canvas.on("mouse:up", onMouseUp)
    return () => {
      canvas.off("mouse:down", onMouseDown)
      canvas.off("mouse:move", onMouseMove)
      canvas.off("mouse:up", onMouseUp)
    }
  }, [addWall, ui.activeTool, ui.snapToGrid])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z" && !e.shiftKey) {
        e.preventDefault()
        undo()
      }

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z" && e.shiftKey) {
        e.preventDefault()
        redo()
      }

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "a") {
        e.preventDefault()
        const allObjects = canvas?.getObjects().filter(obj => obj.data?.id) ?? []
        allObjects.forEach(obj => SelectionEngine.select(obj.data.id as UUID))
        canvas?.discardActiveObject()
        if (allObjects.length > 0) {
          const sel = new fabric.ActiveSelection(allObjects, { canvas: canvas ?? undefined })
          canvas?.setActiveObject(sel)
        }
        canvas?.requestRenderAll()
      }

      if ((e.key === "Delete" || e.key === "Backspace") && SelectionEngine.getSelectedIds().length > 0) {
        SelectionEngine.getSelectedIds().forEach(id => {
          if (scene.walls.some(w => w.id === id)) removeWall(id)
          if (scene.rooms.some(room => room.id === id)) removeRoom(id)
          if (scene.doors.some(door => door.id === id)) removeDoor(id)
          if (scene.windows.some(windowItem => windowItem.id === id)) removeWindow(id)
          if (scene.objects.some(object => object.id === id)) removeObject(id)
          if (electrical.points.some(p => p.id === id)) removeElectricalPoint(id)
        })
        SelectionEngine.deselectAll()
        selectObject(null)
      }

      if (e.key === "Escape") {
        SelectionEngine.deselectAll()
        canvas?.discardActiveObject()
        canvas?.requestRenderAll()
        selectObject(null)
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [electrical.points, redo, removeDoor, removeElectricalPoint, removeObject, removeRoom, removeWall, removeWindow, scene.doors, scene.objects, scene.rooms, scene.walls, scene.windows, selectObject, undo])

  return (
    <div ref={containerRef} className="relative h-full w-full overflow-hidden bg-[#f4f7fb]" role="img" aria-label="Канвас редактора плана. Используйте колесо мыши для зума, зажмите среднюю кнопку или Alt для панорамирования.">
      <canvas ref={canvasRef} className="block" />
      {scene.walls.length === 0 && electrical.points.length === 0 && (
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center select-none">
          <div className="rounded-md border border-dashed border-slate-300 bg-white/80 px-5 py-4 text-center shadow-sm">
            <div className="text-sm font-semibold text-slate-700">Пустой план</div>
            <div className="mt-1 max-w-xs text-xs text-slate-500">
              Выберите стену или электроточку слева и начните собирать проект.
            </div>
          </div>
        </div>
      )}
      <div className="pointer-events-none absolute bottom-3 left-3 flex items-center gap-2">
        <Badge variant={ui.snapToGrid ? "default" : "secondary"} className="shadow-sm">
          {ui.snapToGrid ? "Привязка: сетка, углы, стены" : "Привязка отключена"}
        </Badge>
        {ui.activeTool && ui.activeTool !== "select" && (
          <Badge variant="outline" className="bg-white/90 shadow-sm">
            Инструмент: {getToolHint(ui.activeTool)}
          </Badge>
        )}
      </div>
      <div className="pointer-events-none absolute bottom-3 right-3 flex items-center gap-1">
        <Badge variant="outline" className="bg-white/70 shadow-sm text-[10px]">⌨ Ctrl+Z Отмена</Badge>
        <Badge variant="outline" className="bg-white/70 shadow-sm text-[10px]">⌨ Ctrl+Shift+Z Повтор</Badge>
        <Badge variant="outline" className="bg-white/70 shadow-sm text-[10px]">⌨ Del Удалить</Badge>
        <Badge variant="outline" className="bg-white/70 shadow-sm text-[10px]">⌨ Esc Снять выделение</Badge>
      </div>
    </div>
  )
}

function selectActiveCanvasObject(canvas: fabric.Canvas, selectObject: (id: string | null) => void): void {
  const selected = canvas.getActiveObject()
  if (!selected?.data?.id) return

  SelectionEngine.select(selected.data.id as UUID)
  selectObject(selected.data.id as UUID)
}

function createPointObject(point: ElectricalPoint, status: "ok" | "warning" | "error" | "panel"): fabric.Group {
  const radius = 13
  const isPanel = point.type === "panel"
  const statusColor = getStatusColor(status)
  const halo = new fabric.Circle({
    radius: isPanel ? 21 : 18,
    fill: statusColor.fill,
    stroke: statusColor.stroke,
    strokeWidth: 1.5,
    originX: "center",
    originY: "center",
    selectable: false,
    evented: false,
  })
  const circle = new fabric.Circle({
    radius: isPanel ? 16 : radius,
    fill: getPointColor(point.type),
    stroke: statusColor.stroke,
    strokeWidth: isPanel ? 3 : 2.5,
    originX: "center",
    originY: "center",
  })

  const text = new fabric.Text(getPointLabel(point.type), {
    fontSize: 8,
    fontWeight: "700",
    fill: "#ffffff",
    textAlign: "center",
    originX: "center",
    originY: "center",
    selectable: false,
    evented: false,
  })

  return new fabric.Group([halo, circle, text], {
    left: point.position.x - (isPanel ? 21 : 18),
    top: point.position.y - (isPanel ? 21 : 18),
    selectable: true,
    hasControls: false,
    lockScalingX: true,
    lockScalingY: true,
    lockRotation: true,
    data: { id: point.id, type: point.type },
    hoverCursor: "move",
  })
}

function createRoomObject(room: Room): fabric.Polygon {
  return new fabric.Polygon(room.polygon, {
    fill: "rgba(234, 179, 8, 0.07)",
    stroke: "rgba(234, 179, 8, 0.28)",
    strokeWidth: 1,
    selectable: true,
    hasControls: false,
    lockMovementX: true,
    lockMovementY: true,
    lockScalingX: true,
    lockScalingY: true,
    lockRotation: true,
    data: { id: room.id, type: "room" },
    hoverCursor: "pointer",
  })
}

function createFurnitureObject(object: GeometryObject): fabric.Group {
  const rect = new fabric.Rect({
    width: object.width / 5,
    height: object.height / 5,
    rx: 4,
    ry: 4,
    fill: "rgba(30, 41, 59, 0.10)",
    stroke: "#64748b",
    strokeDashArray: [4, 4],
    strokeWidth: 1.5,
    originX: "center",
    originY: "center",
  })
  const text = new fabric.Text(getFurnitureLabel(object.type), {
    fontSize: 10,
    fill: "#334155",
    fontWeight: "700",
    originX: "center",
    originY: "center",
    selectable: false,
    evented: false,
  })

  return new fabric.Group([rect, text], {
    left: object.position.x,
    top: object.position.y,
    selectable: true,
    hasControls: false,
    data: { id: object.id, type: "furniture" },
    hoverCursor: "move",
  })
}

function createCableRouteObject(from: Point, waypoints: Point[], to: Point): fabric.Polyline {
  const points = [from, ...waypoints, to]
  return new fabric.Polyline(points, {
    fill: "",
    stroke: "#f59e0b",
    strokeWidth: 2.5,
    strokeDashArray: [10, 6],
    selectable: false,
    evented: false,
    opacity: 0.9,
  })
}

function createDoorObject(door: Door, wall: Wall): fabric.Group {
  const center = pointOnWall(wall, door.position)
  const angle = Math.atan2(wall.points[1].y - wall.points[0].y, wall.points[1].x - wall.points[0].x)
  const length = Math.max(34, door.width / 20)
  const dx = Math.cos(angle) * length / 2
  const dy = Math.sin(angle) * length / 2

  const cut = new fabric.Line([center.x - dx, center.y - dy, center.x + dx, center.y + dy], {
    stroke: "#f8fafc",
    strokeWidth: 13,
    strokeLineCap: "butt",
    selectable: false,
    evented: false,
  })
  const leaf = new fabric.Line([center.x - dx, center.y - dy, center.x - dx + Math.cos(angle - Math.PI / 2) * length, center.y - dy + Math.sin(angle - Math.PI / 2) * length], {
    stroke: "#92400e",
    strokeWidth: 2,
    selectable: false,
    evented: false,
  })
  return new fabric.Group([cut, leaf], {
    selectable: true,
    hasControls: false,
    data: { id: door.id, type: "door" },
    hoverCursor: "pointer",
  })
}

function createWindowObject(windowItem: Window, wall: Wall): fabric.Group {
  const center = pointOnWall(wall, windowItem.position)
  const angle = Math.atan2(wall.points[1].y - wall.points[0].y, wall.points[1].x - wall.points[0].x)
  const length = Math.max(40, windowItem.width / 18)
  const dx = Math.cos(angle) * length / 2
  const dy = Math.sin(angle) * length / 2

  const cut = new fabric.Line([center.x - dx, center.y - dy, center.x + dx, center.y + dy], {
    stroke: "#f8fafc",
    strokeWidth: 13,
    strokeLineCap: "butt",
    selectable: false,
    evented: false,
  })
  const glass = new fabric.Line([center.x - dx, center.y - dy, center.x + dx, center.y + dy], {
    stroke: "#38bdf8",
    strokeWidth: 4,
    selectable: false,
    evented: false,
  })
  return new fabric.Group([cut, glass], {
    selectable: true,
    hasControls: false,
    data: { id: windowItem.id, type: "window" },
    hoverCursor: "pointer",
  })
}

function getEventPoint(opt: fabric.TPointerEventInfo): Point {
  return { x: opt.e.offsetX, y: opt.e.offsetY }
}

function snapPoint(point: Point, enabled: boolean): Point {
  if (!enabled) return point

  return {
    x: Math.round(point.x / GRID_SIZE) * GRID_SIZE,
    y: Math.round(point.y / GRID_SIZE) * GRID_SIZE,
  }
}

function snapDrawingPoint(point: Point, walls: Wall[], enabled: boolean): Point {
  if (!enabled) return point

  const endpoint = findNearestWallEndpoint(point, walls)
  if (endpoint && endpoint.distance <= 22) {
    return endpoint.point
  }

  return snapPoint(point, true)
}

function snapPlacementPoint(point: Point, walls: Wall[], enabled: boolean): { point: Point; wall?: Wall; t?: number } {
  if (!enabled) return { point }

  const nearest = findNearestWall(point, walls)
  if (nearest && nearest.distance <= 30) {
    return { point: nearest.point, wall: nearest.wall, t: nearest.t }
  }

  return { point: snapPoint(point, true) }
}

function findNearestWall(point: Point, walls: Wall[]): { wall: Wall; point: Point; t: number; distance: number } | null {
  let best: { wall: Wall; point: Point; t: number; distance: number } | null = null

  walls.forEach(wall => {
    const projected = projectPointToSegment(point, wall.points[0], wall.points[1])
    if (!best || projected.distance < best.distance) {
      best = { wall, ...projected }
    }
  })

  return best
}

function findNearestWallEndpoint(point: Point, walls: Wall[]): { point: Point; distance: number } | null {
  let best: { point: Point; distance: number } | null = null

  walls.flatMap(wall => wall.points).forEach(endpoint => {
    const distance = Math.hypot(point.x - endpoint.x, point.y - endpoint.y)
    if (!best || distance < best.distance) {
      best = { point: endpoint, distance }
    }
  })

  return best
}

function projectPointToSegment(point: Point, a: Point, b: Point): { point: Point; t: number; distance: number } {
  const dx = b.x - a.x
  const dy = b.y - a.y
  const lengthSq = dx * dx + dy * dy
  const rawT = lengthSq === 0 ? 0 : ((point.x - a.x) * dx + (point.y - a.y) * dy) / lengthSq
  const t = Math.max(0, Math.min(1, rawT))
  const projected = { x: a.x + dx * t, y: a.y + dy * t }
  return {
    point: projected,
    t,
    distance: Math.hypot(point.x - projected.x, point.y - projected.y),
  }
}

function pointOnWall(wall: Wall, t: number): Point {
  return {
    x: wall.points[0].x + (wall.points[1].x - wall.points[0].x) * t,
    y: wall.points[0].y + (wall.points[1].y - wall.points[0].y) * t,
  }
}

function isElectricalCanvasType(type: string): boolean {
  return type !== "wall" && type !== "label"
}

function toolToPointType(tool: string): ElectricalPoint["type"] | null {
  const map: Record<string, ElectricalPoint["type"]> = {
    outlet: "outlet",
    switch: "switch",
    light: "light_ceiling",
    sensor: "sensor_motion",
    panel: "panel",
  }
  return map[tool] ?? null
}

function getToolHint(tool: string): string {
  const hints: Record<string, string> = {
    wall: "стена",
    door: "дверь к ближайшей стене",
    window: "окно к ближайшей стене",
    outlet: "розетка с привязкой к стене",
    switch: "выключатель",
    light: "свет",
    sensor: "датчик",
    panel: "щит",
  }
  return hints[tool] ?? tool
}

function getPointStatus(point: ElectricalPoint): "ok" | "warning" | "error" | "panel" {
  if (point.type === "panel") return "panel"
  if (point.parameters?.aiSuggested) return "warning"
  if (!point.circuitId) return "error"
  return "ok"
}

function getStatusColor(status: "ok" | "warning" | "error" | "panel"): { stroke: string; fill: string } {
  if (status === "ok") return { stroke: "#16a34a", fill: "rgba(22, 163, 74, 0.12)" }
  if (status === "warning") return { stroke: "#f59e0b", fill: "rgba(245, 158, 11, 0.15)" }
  if (status === "error") return { stroke: "#dc2626", fill: "rgba(220, 38, 38, 0.12)" }
  return { stroke: "#facc15", fill: "rgba(250, 204, 21, 0.14)" }
}

function getDefaultName(type: string): string {
  return getPointNameRu(type)
}

function getFurnitureLabel(type: string): string {
  const labels: Record<string, string> = {
    sofa: "Диван",
    bed: "Кровать",
    kitchen: "Кухня",
    tv: "TV",
    fridge: "Холод.",
    desk: "Стол",
    wardrobe: "Шкаф",
  }
  return labels[type] ?? "Мебель"
}

function drawGrid(canvas: fabric.Canvas, width: number, height: number): void {
  const majorEvery = GRID_SIZE * 5

  for (let x = 0; x <= width; x += GRID_SIZE) {
    canvas.add(new fabric.Line([x, 0, x, height], {
      stroke: x % majorEvery === 0 ? "rgba(15, 23, 42, 0.14)" : "rgba(15, 23, 42, 0.06)",
      strokeWidth: x % majorEvery === 0 ? 1 : 0.5,
      selectable: false,
      evented: false,
      excludeFromExport: true,
    }))
  }

  for (let y = 0; y <= height; y += GRID_SIZE) {
    canvas.add(new fabric.Line([0, y, width, y], {
      stroke: y % majorEvery === 0 ? "rgba(15, 23, 42, 0.14)" : "rgba(15, 23, 42, 0.06)",
      strokeWidth: y % majorEvery === 0 ? 1 : 0.5,
      selectable: false,
      evented: false,
      excludeFromExport: true,
    }))
  }
}
