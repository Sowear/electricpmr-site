import { create } from "zustand"
import type { GeometryObject, GeometryScene, Wall, Room, Door, Window } from "../engine/types/geometry"
import type { CircuitGroup, CircuitType, ElectricalData, ElectricalPoint, LoadCalculation } from "../engine/types/electrical"
import type { Phase, ProjectStatus, ValidationResult } from "../engine/types/common"
import type { TaskResult } from "../engine/types/ai"
import { EngineeringEngine } from "../engine/core"
import { autoPlaceAll } from "../engine/core/autoPlacement"
import { generatePanelSchedule, type PanelSchedule } from "../engine/core/panelSchedule"
import { generateCableJournal, type CableJournal } from "../engine/core/cableJournal"
import { generateDXF } from "../engine/persistence/dxfExport"
import { RuleEngine } from "../engine/rules"
import { GeometryEngine } from "../engine/geometry"
import { RoutingEngine } from "../engine/routing/routingEngine"
import { EventBus } from "../engine/events"
import {
  saveToCloud as cloudSave,
  loadFromCloud as cloudLoad,
  listCloudProjects as cloudList,
  deleteFromCloud as cloudDelete,
  syncToCloud as cloudSync,
  type CloudProjectMeta,
} from "../engine/persistence/cloudPersistence"

type Point = { x: number; y: number }
type ProjectSnapshot = string
type ProjectListItem = { id: string; name: string; updatedAt: string; createdAt: string }
type NewElectricalPoint = Pick<ElectricalPoint, "type" | "name" | "position"> &
  Partial<Omit<ElectricalPoint, "id" | "type" | "name" | "position" | "createdAt" | "updatedAt">>

interface ProjectState {
  id: string
  name: string
  description: string
  type: "apartment" | "house" | "office" | "commercial" | "industrial"
  phase: Phase
  status: ProjectStatus
  scene: GeometryScene
  electrical: ElectricalData
  validation: ValidationResult
  aiState: {
    lastAction?: Date
    totalActions: number
    confidence: number
    taskHistory: TaskResult[]
  }
  ui: {
    selectedObjectId: string | null
    activePanel: "tools" | "properties" | "ai"
    activeTool: string | null
    viewMode: "2d" | "3d" | "xray"
    showGrid: boolean
    snapToGrid: boolean
    lastSavedAt: string | null
  }
  undoStack: ProjectSnapshot[]
  redoStack: ProjectSnapshot[]
  lastSyncedAt: string | null
  cloudSyncing: boolean
  explainedCircuit: string | null

  addWall: (points: [Point, Point], thickness?: number, height?: number) => Wall
  removeWall: (id: string) => void
  moveWall: (id: string, points: [Point, Point]) => void
  updateWall: (id: string, patch: Partial<Pick<Wall, "thickness" | "height" | "material" | "isExternal">>) => void
  addRoom: (room: Omit<Room, "id" | "createdAt" | "updatedAt">) => Room
  removeRoom: (id: string) => void
  updateRoom: (id: string, patch: Partial<Pick<Room, "name" | "type" | "ceilingHeight">>) => void
  detectRooms: () => Room[]
  addDoor: (wallId: string, position: number, width?: number) => Door
  removeDoor: (id: string) => void
  updateDoor: (id: string, patch: Partial<Pick<Door, "width" | "height" | "type" | "swing">>) => void
  addWindow: (wallId: string, position: number, width?: number) => Window
  removeWindow: (id: string) => void
  updateWindow: (id: string, patch: Partial<Pick<Window, "width" | "height" | "sillHeight" | "type">>) => void

  addElectricalPoint: (point: NewElectricalPoint) => ElectricalPoint
  removeElectricalPoint: (id: string) => void
  moveElectricalPoint: (id: string, position: Point) => void
  updateElectricalPoint: (id: string, patch: Partial<Pick<ElectricalPoint, "type" | "subtype" | "name" | "mountingHeight" | "mountingMethod" | "parameters" | "roomId" | "circuitId">>) => void
  addFurniture: (type: string, name: string, position: Point, width?: number, height?: number) => GeometryObject
  moveObject: (id: string, position: Point) => void
  removeObject: (id: string) => void
  updateObject: (id: string, patch: Partial<Pick<GeometryObject, "name" | "type" | "width" | "height" | "rotation">>) => void

  recalculate: () => void
  validate: () => void
  autoGroupCircuits: () => void
  autoPlace: () => void
  getPanelSchedule: () => PanelSchedule
  getCableJournal: () => CableJournal
  exportDXF: () => string
  runAIProject: () => void
  selectObject: (id: string | null) => void
  setActiveTool: (tool: string | null) => void
  setViewMode: (mode: "2d" | "3d" | "xray") => void
  toggleGrid: () => void
  toggleSnap: () => void

  undo: () => void
  redo: () => void
  saveProject: () => void
  listProjects: () => ProjectListItem[]
  loadProjectById: (id: string) => boolean
  duplicateProject: (id: string) => boolean
  deleteProject: (id: string) => void
  loadSavedProject: () => boolean
  importProject: (json: string) => boolean
  clearProject: () => void
  saveToCloud: () => Promise<boolean>
  loadFromCloud: (id: string) => Promise<boolean>
  listCloudProjects: () => Promise<CloudProjectMeta[]>
  deleteFromCloud: (id: string) => Promise<void>
  syncToCloud: () => Promise<boolean>
  explainCircuit: (circuitId: string) => CircuitExplanation
  setExplainedCircuit: (circuitId: string | null) => void
  generateBOM: () => BOMItem[]
}

export interface BOMItem {
  category: string
  name: string
  quantity: number
  unit: string
  specification: string
  estimatedCost: number
}

export interface CircuitExplanation {
  circuitId: string
  circuitName: string
  rule: string
  reason: string
  points: Array<{ name: string; type: string; reason: string }>
  breaker: { type: string; rating: number; reason: string }
  cable: { type: string; crossSection: number; reason: string }
  phase: { assignment: 1 | 2 | 3; reason: string }
}

type PersistedProject = Pick<ProjectState,
  "id" | "name" | "description" | "type" | "phase" | "status" | "scene" | "electrical" | "validation" | "aiState"
>

const STORAGE_KEY = "electricpmr.nextgen.project.v1"
const PROJECT_INDEX_KEY = "electricpmr.nextgen.projects.index.v1"
const PROJECT_STORAGE_PREFIX = "electricpmr.nextgen.projects.item."
const HISTORY_LIMIT = 80

const emptyScene: GeometryScene = {
  id: "scene_default",
  name: "Новый проект",
  floors: [],
  walls: [],
  rooms: [],
  doors: [],
  windows: [],
  objects: [],
}

const emptyElectrical: ElectricalData = {
  points: [],
  circuits: [],
  cables: [],
  panels: [],
  breakers: [],
  rcds: [],
  phaseBalance: {
    L1: { totalPower: 0, totalCurrent: 0, demandFactor: 1, simultaneousFactor: 1, effectivePower: 0, effectiveCurrent: 0 },
    L2: { totalPower: 0, totalCurrent: 0, demandFactor: 1, simultaneousFactor: 1, effectivePower: 0, effectiveCurrent: 0 },
    L3: { totalPower: 0, totalCurrent: 0, demandFactor: 1, simultaneousFactor: 1, effectivePower: 0, effectiveCurrent: 0 },
    maxDeviation: 0,
    isBalanced: true,
  },
  voltageDrops: [],
  totalLoad: { totalPower: 0, totalCurrent: 0, demandFactor: 1, simultaneousFactor: 1, effectivePower: 0, effectiveCurrent: 0 },
}

function createProjectSnapshot(state: ProjectState): ProjectSnapshot {
  const snapshot: PersistedProject = {
    id: state.id,
    name: state.name,
    description: state.description,
    type: state.type,
    phase: state.phase,
    status: state.status,
    scene: state.scene,
    electrical: state.electrical,
    validation: state.validation,
    aiState: state.aiState,
  }
  return JSON.stringify(snapshot)
}

function restoreProjectSnapshot(snapshot: ProjectSnapshot): PersistedProject {
  return JSON.parse(snapshot) as PersistedProject
}

function persistProject(state: ProjectState): void {
  if (typeof window === "undefined") return

  window.localStorage.setItem(STORAGE_KEY, createProjectSnapshot(state))
}

function getProjectItemKey(id: string): string {
  return `${PROJECT_STORAGE_PREFIX}${id}`
}

function readProjectIndex(): ProjectListItem[] {
  if (typeof window === "undefined") return []
  try {
    return JSON.parse(window.localStorage.getItem(PROJECT_INDEX_KEY) ?? "[]") as ProjectListItem[]
  } catch {
    return []
  }
}

function writeProjectIndex(items: ProjectListItem[]): void {
  if (typeof window === "undefined") return
  window.localStorage.setItem(PROJECT_INDEX_KEY, JSON.stringify(items))
}

function saveProjectToLibrary(state: ProjectState): string {
  if (typeof window === "undefined") return state.id

  const id = state.id || `project_${Date.now()}`
  const now = new Date().toISOString()
  const snapshot = createProjectSnapshot({ ...state, id } as ProjectState)
  const index = readProjectIndex()
  const existing = index.find(item => item.id === id)
  const item: ProjectListItem = {
    id,
    name: state.name || "Новый проект",
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  }

  window.localStorage.setItem(getProjectItemKey(id), snapshot)
  writeProjectIndex([item, ...index.filter(entry => entry.id !== id)].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)))
  return id
}

function withHistory(state: ProjectState): Pick<ProjectState, "undoStack" | "redoStack"> {
  return {
    undoStack: [...state.undoStack, createProjectSnapshot(state)].slice(-HISTORY_LIMIT),
    redoStack: [],
  }
}

function markSaved(state: ProjectState): ProjectState["ui"] {
  return { ...state.ui, lastSavedAt: new Date().toISOString() }
}

function createSuggestedPoint(type: ElectricalPoint["type"], name: string, position: Point, power?: number): ElectricalPoint {
  return {
    id: `ep_ai_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    type,
    subtype: type,
    name,
    position,
    rotation: 0,
    floor: 1,
    mountingHeight: getDefaultMountingHeight(type),
    mountingMethod: "flush",
    connectedTo: [],
    parameters: power ? { power, aiSuggested: true } : { aiSuggested: true },
    createdAt: new Date(),
    updatedAt: new Date(),
  }
}

function getDefaultMountingHeight(type: string): number {
  if (type.includes("switch")) return 900
  if (type.includes("light")) return 2700
  if (type === "panel") return 1500
  return 300
}

function hasNearbyPoint(points: ElectricalPoint[], position: Point, radius = 80): boolean {
  return points.some(point => Math.hypot(point.position.x - position.x, point.position.y - position.y) <= radius)
}

function getFurnitureAnchor(position: Point, dx: number, dy: number): Point {
  return { x: position.x + dx, y: position.y + dy }
}

function suggestElectricalPoints(state: ProjectState): ElectricalPoint[] {
  const suggestions: ElectricalPoint[] = []
  const existing = state.electrical.points

  state.scene.objects.forEach(object => {
    const add = (type: ElectricalPoint["type"], name: string, dx: number, dy: number, power?: number) => {
      const position = getFurnitureAnchor(object.position, dx, dy)
      if (!hasNearbyPoint([...existing, ...suggestions], position)) {
        suggestions.push(createSuggestedPoint(type, name, position, power))
      }
    }

    if (object.type === "kitchen") {
      add("outlet_triple", "AI: розетки рабочей зоны кухни", -90, -60, 1800)
      add("appliance_stove", "AI: электроплита", 90, -60, 7000)
      add("light_ceiling", "AI: свет кухни", 0, -150, 80)
    }

    if (object.type === "tv") {
      add("outlet_triple", "AI: TV зона", 0, -60, 1200)
    }

    if (object.type === "desk") {
      add("outlet_triple", "AI: рабочее место", 0, -70, 1500)
    }

    if (object.type === "bed") {
      add("outlet", "AI: розетка у кровати левая", -90, -60, 500)
      add("outlet", "AI: розетка у кровати правая", 90, -60, 500)
      add("switch_pass_through", "AI: проходной выключатель у кровати", 0, -90)
    }

    if (object.type === "fridge") {
      add("appliance_fridge", "AI: холодильник", 0, -60, 150)
    }
  })

  state.scene.rooms.forEach(room => {
    const center: Point = room.polygon.reduce(
      (acc, point) => ({ x: acc.x + point.x, y: acc.y + point.y }),
      { x: 0, y: 0 }
    )
    const cx = center.x / room.polygon.length
    const cy = center.y / room.polygon.length

    const addRoom = (type: ElectricalPoint["type"], name: string, dx: number, dy: number, power?: number) => {
      const position = { x: cx + dx, y: cy + dy }
      if (!hasNearbyPoint([...existing, ...suggestions], position, 120)) {
        const s = createSuggestedPoint(type, name, position, power)
        s.roomId = room.id
        suggestions.push(s)
      }
    }

    if (room.type === "kitchen" && !existing.some(p => p.roomId === room.id && p.type === "appliance_stove")) {
      addRoom("outlet_triple", `AI: розетки ${room.name}`, 60, 80, 1800)
      addRoom("light_ceiling", `AI: свет ${room.name}`, 0, 0, 80)
      addRoom("appliance_stove", `AI: плита ${room.name}`, -60, 80, 7000)
    }

    if (room.type === "bathroom" && !existing.some(p => p.roomId === room.id && p.type === "sensor_leak")) {
      addRoom("outlet_waterproof", `AI: розетка ${room.name} IP44`, 40, 40, 700)
      addRoom("sensor_leak", `AI: датчик протечки ${room.name}`, 0, 60, 1)
      addRoom("light_ceiling", `AI: свет ${room.name}`, 0, 0, 80)
    }

    if (room.type === "living" && !existing.some(p => p.roomId === room.id)) {
      addRoom("outlet", `AI: розетки ${room.name} левая`, -80, 40, 500)
      addRoom("outlet", `AI: розетки ${room.name} правая`, 80, 40, 500)
      addRoom("switch", `AI: выключатель ${room.name}`, 0, 80)
      addRoom("light_ceiling", `AI: свет ${room.name}`, 0, 0, 80)
    }

    if (room.type === "bedroom" && !existing.some(p => p.roomId === room.id)) {
      addRoom("outlet", `AI: розетка ${room.name} левая`, -60, 40, 500)
      addRoom("outlet", `AI: розетка ${room.name} правая`, 60, 40, 500)
      addRoom("switch", `AI: выключатель ${room.name}`, 0, 80)
      addRoom("light_ceiling", `AI: свет ${room.name}`, 0, 0, 80)
    }

    if (room.type === "corridor" && !existing.some(p => p.roomId === room.id)) {
      addRoom("switch", `AI: выключатель ${room.name}`, 0, 40)
      addRoom("light_ceiling", `AI: свет ${room.name}`, 0, 0, 80)
    }
  })

  if (state.scene.rooms.length > 0 && !existing.some(point => point.type.startsWith("light")) && suggestions.every(point => !point.type.startsWith("light"))) {
    state.scene.rooms.forEach((room, index) => {
      const position = room.polygon.reduce(
        (acc, point) => ({ x: acc.x + point.x, y: acc.y + point.y }),
        { x: 0, y: 0 }
      )
      const pos = { x: position.x / room.polygon.length, y: position.y / room.polygon.length }
      if (!hasNearbyPoint([...existing, ...suggestions], pos, 120)) {
        suggestions.push(createSuggestedPoint("light_ceiling", `AI: свет ${room.name || index + 1}`, pos, 80))
      }
    })
  }

  return suggestions
}

function classifyCircuit(point: ElectricalPoint): { key: string; name: string; type: CircuitType; color: string } {
  if (point.type.startsWith("light") || point.type === "switch" || point.type === "switch_pass_through" || point.type === "dimmer") {
    return { key: "lighting", name: "Освещение", type: "lighting", color: "#eab308" }
  }

  if (point.type === "outlet_waterproof" || point.type === "sensor_leak") {
    return { key: "bathroom", name: "Влажная зона", type: "outlets_bathroom", color: "#0891b2" }
  }

  if (point.type === "appliance_stove") {
    return { key: "stove", name: "Электроплита", type: "power_stove", color: "#b91c1c" }
  }

  if (point.type === "appliance_boiler") {
    return { key: "boiler", name: "Бойлер", type: "power_boiler", color: "#0e7490" }
  }

  if (point.type === "appliance_ac") {
    return { key: "ac", name: "Кондиционер", type: "power_ac", color: "#0284c7" }
  }

  if (point.type === "appliance_washing_machine") {
    return { key: "washer", name: "Стиральная машина", type: "power_washing_machine", color: "#1d4ed8" }
  }

  if (point.type === "panel" || point.type === "junction_box" || point.type.startsWith("sensor")) {
    return { key: "service", name: "Служебные цепи", type: "custom", color: "#64748b" }
  }

  return { key: "outlets", name: "Розетки общие", type: "outlets_general", color: "#2563eb" }
}

function getCircuitBreaker(circuit: CircuitGroup): string {
  if (circuit.type === "lighting") return "brk_1p_c10"
  if (circuit.type === "power_stove") return "brk_1p_c32"
  if (circuit.type.startsWith("power_")) return "brk_1p_c16"
  if (circuit.type === "outlets_bathroom") return "brk_1p_c16"
  return "brk_1p_c16"
}

function getCircuitCable(circuit: CircuitGroup): string {
  if (circuit.type === "lighting") return "cable_cu_3x1.5"
  if (circuit.type === "power_stove") return "cable_cu_3x6"
  if (circuit.type.startsWith("power_")) return "cable_cu_3x2.5"
  return "cable_cu_3x2.5"
}

function findPanelPoint(points: ElectricalPoint[]): ElectricalPoint | undefined {
  return points.find(point => point.type === "panel")
}

function createCableRoute(from: ElectricalPoint, to: ElectricalPoint, index: number) {
  const ceilingY = Math.min(from.position.y, to.position.y) - 80
  const waypoints = [
    { x: from.position.x, y: ceilingY },
    { x: to.position.x, y: ceilingY },
  ]
  const lengthPx =
    Math.abs(from.position.y - ceilingY) +
    Math.abs(to.position.x - from.position.x) +
    Math.abs(to.position.y - ceilingY)

  return {
    id: `route_${Date.now()}_${index}`,
    cableId: `cable_virtual_${index}`,
    from: from.id,
    to: to.id,
    waypoints,
    length: Math.round((lengthPx / 100) * 1.15 * 10) / 10,
    method: "in_wall" as const,
    viaJunctionBoxes: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  }
}

export const useProjectStore = create<ProjectState>((set, get) => ({
  id: "",
  name: "Новый проект",
  description: "",
  type: "apartment",
  phase: "design",
  status: "draft",
  scene: { ...emptyScene },
  electrical: { ...emptyElectrical },
  validation: { errors: [], warnings: [], infos: [], isValid: true, checkedAt: new Date() },
  aiState: { totalActions: 0, confidence: 0, taskHistory: [] },
  ui: {
    selectedObjectId: null,
    activePanel: "tools",
    activeTool: null,
    viewMode: "2d",
    showGrid: true,
    snapToGrid: true,
    lastSavedAt: null,
  },
  undoStack: [],
  redoStack: [],
  lastSyncedAt: null,
  cloudSyncing: false,
  explainedCircuit: null,

  addWall: (points, thickness = 200, height = 2700) => {
    const wall = GeometryEngine.createWall(points, thickness, height)
    set(state => ({
      ...withHistory(state),
      scene: { ...state.scene, walls: [...state.scene.walls, wall] },
    }))
    get().recalculate()
    const state = get()
    if (state.scene.walls.length >= 3 && state.scene.rooms.length === 0) {
      get().detectRooms()
    }
    return wall
  },

  removeWall: (id) => {
    set(state => ({
      ...withHistory(state),
      scene: { ...state.scene, walls: state.scene.walls.filter(w => w.id !== id) },
      ui: { ...state.ui, selectedObjectId: state.ui.selectedObjectId === id ? null : state.ui.selectedObjectId },
    }))
    get().recalculate()
  },

  moveWall: (id, points) => {
    set(state => ({
      ...withHistory(state),
      scene: {
        ...state.scene,
        walls: state.scene.walls.map(w => w.id === id ? { ...w, points, updatedAt: new Date() } : w),
      },
    }))
    persistProject(get())
  },

  updateWall: (id, patch) => {
    set(state => ({
      ...withHistory(state),
      scene: {
        ...state.scene,
        walls: state.scene.walls.map(wall =>
          wall.id === id ? { ...wall, ...patch, updatedAt: new Date() } : wall
        ),
      },
      ui: markSaved(state),
    }))
    persistProject(get())
  },

  addRoom: (roomData) => {
    const room: Room = { ...roomData, id: `room_${Date.now()}`, createdAt: new Date(), updatedAt: new Date() }
    set(state => ({
      ...withHistory(state),
      scene: { ...state.scene, rooms: [...state.scene.rooms, room] },
    }))
    persistProject(get())
    return room
  },

  removeRoom: (id) => {
    set(state => ({
      ...withHistory(state),
      scene: { ...state.scene, rooms: state.scene.rooms.filter(r => r.id !== id) },
    }))
    persistProject(get())
  },

  updateRoom: (id, patch) => {
    set(state => ({
      ...withHistory(state),
      scene: {
        ...state.scene,
        rooms: state.scene.rooms.map(room => {
          if (room.id !== id) return room
          const ceilingHeight = patch.ceilingHeight ?? room.ceilingHeight
          return {
            ...room,
            ...patch,
            ceilingHeight,
            volume: Math.round(room.area * (ceilingHeight / 1000) * 100) / 100,
            updatedAt: new Date(),
          }
        }),
      },
      ui: markSaved(state),
    }))
    persistProject(get())
  },

  detectRooms: () => {
    const state = get()
    const rooms = GeometryEngine.detectRooms(state.scene.walls, 1)
    set(state => ({
      ...withHistory(state),
      scene: { ...state.scene, rooms },
      ui: markSaved(state),
    }))
    persistProject(get())
    return rooms
  },

  addDoor: (wallId, position, width = 800) => {
    const door = GeometryEngine.addDoor(wallId, position, width)
    set(state => ({
      ...withHistory(state),
      scene: { ...state.scene, doors: [...state.scene.doors, door] },
    }))
    persistProject(get())
    return door
  },

  removeDoor: (id) => {
    set(state => ({
      ...withHistory(state),
      scene: { ...state.scene, doors: state.scene.doors.filter(door => door.id !== id) },
      ui: { ...state.ui, selectedObjectId: state.ui.selectedObjectId === id ? null : state.ui.selectedObjectId },
    }))
    persistProject(get())
  },

  updateDoor: (id, patch) => {
    set(state => ({
      ...withHistory(state),
      scene: {
        ...state.scene,
        doors: state.scene.doors.map(door =>
          door.id === id ? { ...door, ...patch, updatedAt: new Date() } : door
        ),
      },
      ui: markSaved(state),
    }))
    persistProject(get())
  },

  addWindow: (wallId, position, width = 1200) => {
    const window = GeometryEngine.addWindow(wallId, position, width)
    set(state => ({
      ...withHistory(state),
      scene: { ...state.scene, windows: [...state.scene.windows, window] },
    }))
    persistProject(get())
    return window
  },

  removeWindow: (id) => {
    set(state => ({
      ...withHistory(state),
      scene: { ...state.scene, windows: state.scene.windows.filter(windowItem => windowItem.id !== id) },
      ui: { ...state.ui, selectedObjectId: state.ui.selectedObjectId === id ? null : state.ui.selectedObjectId },
    }))
    persistProject(get())
  },

  updateWindow: (id, patch) => {
    set(state => ({
      ...withHistory(state),
      scene: {
        ...state.scene,
        windows: state.scene.windows.map(windowItem =>
          windowItem.id === id ? { ...windowItem, ...patch, updatedAt: new Date() } : windowItem
        ),
      },
      ui: markSaved(state),
    }))
    persistProject(get())
  },

  addElectricalPoint: (pointData) => {
    const state = get()
    const point: ElectricalPoint = {
      subtype: pointData.subtype ?? pointData.type,
      rotation: pointData.rotation ?? 0,
      floor: pointData.floor ?? 1,
      mountingHeight: pointData.mountingHeight ?? 300,
      mountingMethod: pointData.mountingMethod ?? "flush",
      connectedTo: pointData.connectedTo ?? [],
      parameters: pointData.parameters ?? {},
      ...pointData,
      roomId: pointData.roomId ?? GeometryEngine.findRoomAtPoint(pointData.position, state.scene.rooms)?.id,
      id: `ep_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    set(state => ({
      ...withHistory(state),
      electrical: { ...state.electrical, points: [...state.electrical.points, point] },
    }))
    EventBus.emit({ type: "electrical.point.added", point })
    get().recalculate()
    const next = get()
    const hasPanel = next.electrical.points.some(p => p.type === "panel")
    const hasConsumer = next.electrical.points.some(p => p.type !== "panel" && p.type !== "junction_box")
    if (hasPanel && hasConsumer) {
      get().autoGroupCircuits()
    }
    return point
  },

  removeElectricalPoint: (id) => {
    set(state => ({
      ...withHistory(state),
      electrical: { ...state.electrical, points: state.electrical.points.filter(p => p.id !== id) },
      ui: { ...state.ui, selectedObjectId: state.ui.selectedObjectId === id ? null : state.ui.selectedObjectId },
    }))
    get().recalculate()
  },

  moveElectricalPoint: (id, position) => {
    set(state => ({
      ...withHistory(state),
      electrical: {
        ...state.electrical,
        points: state.electrical.points.map(p => p.id === id ? { ...p, position, updatedAt: new Date() } : p),
      },
    }))
    get().recalculate()
  },

  updateElectricalPoint: (id, patch) => {
    set(state => ({
      ...withHistory(state),
      electrical: {
        ...state.electrical,
        points: state.electrical.points.map(point =>
          point.id === id ? { ...point, ...patch, updatedAt: new Date() } : point
        ),
      },
      ui: markSaved(state),
    }))
    get().recalculate()
    const next = get()
    const hasPanel = next.electrical.points.some(point => point.type === "panel")
    const hasConsumer = next.electrical.points.some(point => point.type !== "panel" && point.type !== "junction_box")
    if (hasPanel && hasConsumer) {
      get().autoGroupCircuits()
    }
  },

  addFurniture: (type, name, position, width = 700, height = 400) => {
    const object = GeometryEngine.placeObject(type, name, position, 0, width, height)
    set(state => ({
      ...withHistory(state),
      scene: { ...state.scene, objects: [...state.scene.objects, object] },
      ui: markSaved(state),
    }))
    persistProject(get())
    return object
  },

  moveObject: (id, position) => {
    set(state => ({
      ...withHistory(state),
      scene: {
        ...state.scene,
        objects: state.scene.objects.map(object =>
          object.id === id ? { ...object, position, updatedAt: new Date() } : object
        ),
      },
      ui: markSaved(state),
    }))
    persistProject(get())
  },

  removeObject: (id) => {
    set(state => ({
      ...withHistory(state),
      scene: { ...state.scene, objects: state.scene.objects.filter(object => object.id !== id) },
      ui: { ...state.ui, selectedObjectId: state.ui.selectedObjectId === id ? null : state.ui.selectedObjectId, lastSavedAt: new Date().toISOString() },
    }))
    persistProject(get())
  },

  updateObject: (id, patch) => {
    set(state => ({
      ...withHistory(state),
      scene: {
        ...state.scene,
        objects: state.scene.objects.map(object =>
          object.id === id ? { ...object, ...patch, updatedAt: new Date() } : object
        ),
      },
      ui: markSaved(state),
    }))
    persistProject(get())
  },

  recalculate: () => {
    const state = get()
    const totalLoad = EngineeringEngine.calculateLoad(state.electrical.points)
    const phaseBalance = EngineeringEngine.calculatePhaseBalance(state.electrical.circuits)

    set(state => ({
      electrical: { ...state.electrical, totalLoad, phaseBalance },
      ui: markSaved(state),
    }))

    EventBus.emit({ type: "calculation.load.updated", scope: "project", load: totalLoad })
    persistProject(get())
  },

  validate: () => {
    const state = get()
    const geoResult = GeometryEngine.validateScene(state.scene)
    const electricalResults = state.electrical.circuits.map(c =>
      EngineeringEngine.validateCircuit(c, state.electrical.circuits)
    )

    // Validate each electrical point against PUE/SP rules
    const ruleIssues = state.electrical.points.flatMap(point =>
      RuleEngine.validateObject(point.type, {
        type: point.type,
        ...point.parameters,
        mountingHeight: point.parameters?.mountingHeight,
      })
    )

    const allErrors = [
      ...geoResult.errors,
      ...electricalResults.flatMap(r => r.errors),
      ...ruleIssues.filter(i => i.severity === "error"),
    ]
    const allWarnings = [
      ...geoResult.warnings,
      ...electricalResults.flatMap(r => r.warnings),
      ...ruleIssues.filter(i => i.severity === "warning"),
    ]
    const allInfos = [
      ...geoResult.infos,
      ...electricalResults.flatMap(r => r.infos),
      ...ruleIssues.filter(i => i.severity === "info"),
    ]

    set({
      validation: {
        errors: allErrors,
        warnings: allWarnings,
        infos: allInfos,
        isValid: allErrors.length === 0,
        checkedAt: new Date(),
      },
    })
    persistProject(get())
  },

  autoGroupCircuits: () => {
    const state = get()
    const grouped = new Map<string, { meta: ReturnType<typeof classifyCircuit>; points: ElectricalPoint[] }>()

    state.electrical.points.filter(point => point.type !== "panel" && point.type !== "junction_box").forEach(point => {
      const meta = classifyCircuit(point)
      const existing = grouped.get(meta.key)
      if (existing) {
        existing.points.push(point)
      } else {
        grouped.set(meta.key, { meta, points: [point] })
      }
    })

    const circuits: CircuitGroup[] = Array.from(grouped.values()).map((group, index) => {
      const id = `circuit_${group.meta.key}_${Date.now()}_${index}`
      return {
        id,
        name: `Гр.${index + 1} ${group.meta.name}`,
        type: group.meta.type,
        floor: 1,
        points: group.points.map(point => point.id),
        load: EngineeringEngine.calculateGroupLoad(
          { id, points: group.points.map(p => p.id) } as CircuitGroup,
          [], // allCircuits — will be updated after creation
          (ids) => state.electrical.points.filter(p => ids.includes(p.id))
        ),
        phase: ((index % 3) + 1) as 1 | 2 | 3,
        color: group.meta.color,
        breakerId: getCircuitBreaker({ type: group.meta.type } as CircuitGroup),
        cableId: getCircuitCable({ type: group.meta.type } as CircuitGroup),
        createdAt: new Date(),
        updatedAt: new Date(),
      }
    })

    const pointToCircuit = new Map<string, string>()
    circuits.forEach(circuit => {
      circuit.points.forEach(pointId => pointToCircuit.set(pointId, circuit.id))
    })

    const panel = findPanelPoint(state.electrical.points)
    const routePoints = state.electrical.points.filter(point => point.id !== panel?.id && pointToCircuit.has(point.id))
    const routes = panel ? RoutingEngine.createPanelRoutes(panel, routePoints, state.scene.walls) : []

    set(state => ({
      ...withHistory(state),
      electrical: {
        ...state.electrical,
        circuits,
        cables: routes,
        points: state.electrical.points.map(point => ({
          ...point,
          circuitId: pointToCircuit.get(point.id) ?? point.circuitId,
          updatedAt: new Date(),
        })),
      },
      ui: markSaved(state),
    }))
    get().recalculate()
  },

  autoPlace: () => {
    const state = get()
    const result = autoPlaceAll(
      state.scene.rooms,
      state.scene.walls,
      state.scene.doors,
      state.scene.windows,
      state.electrical.points,
    )

    if (result.points.length === 0) return

    const newPoints: ElectricalPoint[] = result.points.map((p, i) => ({
      id: `auto_${Date.now()}_${i}`,
      type: p.type,
      name: p.name,
      position: p.position,
      roomId: p.roomId,
      circuitId: undefined,
      panelId: undefined,
      power: p.power,
      parameters: { aiSuggested: true },
      createdAt: new Date(),
      updatedAt: new Date(),
    }))

    set(state => ({
      ...withHistory(state),
      electrical: {
        ...state.electrical,
        points: [...state.electrical.points, ...newPoints],
      },
      ui: markSaved(state),
    }))

    get().autoGroupCircuits()
    get().recalculate()
    get().validate()
  },

  getPanelSchedule: () => {
    const state = get()
    return generatePanelSchedule(
      state.electrical.circuits,
      state.electrical.points,
    )
  },

  getCableJournal: () => {
    const state = get()
    return generateCableJournal(
      state.electrical.circuits,
      state.electrical.cables,
      state.electrical.points,
    )
  },

  exportDXF: () => {
    const state = get()
    return generateDXF(
      state.scene.walls,
      state.scene.rooms,
      state.scene.doors,
      state.scene.windows,
      state.electrical.points,
      state.electrical.cables,
      { projectName: state.scene.name },
    )
  },

  runAIProject: () => {
    const state = get()
    if (state.scene.walls.length >= 3) {
      get().detectRooms()
    }
    const suggestions = suggestElectricalPoints(get())
    if (suggestions.length > 0) {
      set(state => ({
        ...withHistory(state),
        electrical: {
          ...state.electrical,
          points: [...state.electrical.points, ...suggestions],
        },
        aiState: {
          ...state.aiState,
          lastAction: new Date(),
          totalActions: state.aiState.totalActions + 1,
          confidence: Math.min(0.92, state.aiState.confidence + 0.12),
        },
        ui: markSaved(state),
      }))
    }
    get().autoGroupCircuits()
    get().validate()
  },

  selectObject: (id) => {
    set(state => ({ ui: { ...state.ui, selectedObjectId: id } }))
  },

  setActiveTool: (tool) => {
    set(state => ({ ui: { ...state.ui, activeTool: tool } }))
  },

  setViewMode: (mode) => {
    set(state => ({ ui: { ...state.ui, viewMode: mode } }))
  },

  toggleGrid: () => {
    set(state => ({ ui: { ...state.ui, showGrid: !state.ui.showGrid } }))
  },

  toggleSnap: () => {
    set(state => ({ ui: { ...state.ui, snapToGrid: !state.ui.snapToGrid } }))
  },

  undo: () => {
    const state = get()
    const previous = state.undoStack.at(-1)
    if (!previous) return

    const current = createProjectSnapshot(state)
    const restored = restoreProjectSnapshot(previous)
    set({
      ...restored,
      undoStack: state.undoStack.slice(0, -1),
      redoStack: [current, ...state.redoStack].slice(0, HISTORY_LIMIT),
      ui: { ...state.ui, selectedObjectId: null, lastSavedAt: new Date().toISOString() },
    })
    persistProject(get())
  },

  redo: () => {
    const state = get()
    const next = state.redoStack[0]
    if (!next) return

    const current = createProjectSnapshot(state)
    const restored = restoreProjectSnapshot(next)
    set({
      ...restored,
      undoStack: [...state.undoStack, current].slice(-HISTORY_LIMIT),
      redoStack: state.redoStack.slice(1),
      ui: { ...state.ui, selectedObjectId: null, lastSavedAt: new Date().toISOString() },
    })
    persistProject(get())
  },

  saveProject: () => {
    const id = saveProjectToLibrary(get())
    set(state => ({ id, ui: markSaved(state) }))
    persistProject(get())
  },

  listProjects: () => readProjectIndex(),

  loadProjectById: (id) => {
    if (typeof window === "undefined") return false

    const snapshot = window.localStorage.getItem(getProjectItemKey(id))
    if (!snapshot) return false

    const restored = restoreProjectSnapshot(snapshot)
    set(state => ({
      ...restored,
      undoStack: [],
      redoStack: [],
      ui: { ...state.ui, selectedObjectId: null, lastSavedAt: new Date().toISOString() },
    }))
    persistProject(get())
    get().recalculate()
    return true
  },

  duplicateProject: (id) => {
    if (typeof window === "undefined") return false

    const snapshot = window.localStorage.getItem(getProjectItemKey(id))
    if (!snapshot) return false

    const restored = restoreProjectSnapshot(snapshot)
    const duplicateId = `project_${Date.now()}`
    const duplicate = {
      ...restored,
      id: duplicateId,
      name: `${restored.name || "Проект"} копия`,
    }
    window.localStorage.setItem(getProjectItemKey(duplicateId), JSON.stringify(duplicate))
    const now = new Date().toISOString()
    writeProjectIndex([
      { id: duplicateId, name: duplicate.name, createdAt: now, updatedAt: now },
      ...readProjectIndex(),
    ])
    return true
  },

  deleteProject: (id) => {
    if (typeof window === "undefined") return

    window.localStorage.removeItem(getProjectItemKey(id))
    writeProjectIndex(readProjectIndex().filter(item => item.id !== id))
  },

  loadSavedProject: () => {
    if (typeof window === "undefined") return false

    const snapshot = window.localStorage.getItem(STORAGE_KEY)
    if (!snapshot) return false

    const restored = restoreProjectSnapshot(snapshot)
    set(state => ({
      ...restored,
      undoStack: [],
      redoStack: [],
      ui: { ...state.ui, selectedObjectId: null, lastSavedAt: new Date().toISOString() },
    }))
    get().recalculate()
    return true
  },

  importProject: (json) => {
    try {
      const parsed = JSON.parse(json) as PersistedProject & { scene?: GeometryScene; electrical?: ElectricalData }
      if (!parsed.scene || !parsed.electrical) return false

      set(state => ({
        ...withHistory(state),
        id: parsed.id || `project_${Date.now()}`,
        name: parsed.name || "Импортированный проект",
        description: parsed.description || "",
        type: parsed.type || "apartment",
        phase: parsed.phase || "design",
        status: parsed.status || "draft",
        scene: parsed.scene,
        electrical: parsed.electrical,
        validation: { errors: [], warnings: [], infos: [], isValid: true, checkedAt: new Date() },
        aiState: parsed.aiState || { totalActions: 0, confidence: 0, taskHistory: [] },
        ui: { ...state.ui, selectedObjectId: null, lastSavedAt: new Date().toISOString() },
      }))
      get().recalculate()
      get().validate()
      return true
    } catch {
      return false
    }
  },

  clearProject: () => {
    set(state => ({
      ...withHistory(state),
      id: "",
      name: "Новый проект",
      description: "",
      type: "apartment",
      phase: "design",
      status: "draft",
      scene: { ...emptyScene, walls: [], rooms: [], doors: [], windows: [], objects: [] },
      electrical: { ...emptyElectrical, points: [], circuits: [], cables: [], panels: [], breakers: [], rcds: [] },
      validation: { errors: [], warnings: [], infos: [], isValid: true, checkedAt: new Date() },
      ui: { ...state.ui, selectedObjectId: null, activeTool: null, lastSavedAt: new Date().toISOString() },
      lastSyncedAt: null,
    }))
    persistProject(get())
  },

  saveToCloud: async () => {
    set({ cloudSyncing: true })
    const state = get()
    const persisted: PersistedProject = {
      id: state.id || `project_${Date.now()}`,
      name: state.name,
      description: state.description,
      type: state.type,
      phase: state.phase,
      status: state.status,
      scene: state.scene,
      electrical: state.electrical,
      validation: state.validation,
      aiState: state.aiState,
    }
    const result = await cloudSave(persisted)
    set({ cloudSyncing: false, lastSyncedAt: result.error ? null : new Date().toISOString() })
    return !result.error
  },

  loadFromCloud: async (id) => {
    set({ cloudSyncing: true })
    const result = await cloudLoad(id)
    if (result.error || !result.data) {
      set({ cloudSyncing: false })
      return false
    }
    const data = result.data
    set(state => ({
      ...data,
      id: data.id,
      undoStack: [],
      redoStack: [],
      lastSyncedAt: new Date().toISOString(),
      cloudSyncing: false,
      ui: { ...state.ui, selectedObjectId: null, lastSavedAt: new Date().toISOString() },
    }))
    persistProject(get())
    get().recalculate()
    get().validate()
    return true
  },

  listCloudProjects: async () => {
    const result = await cloudList()
    return result.data
  },

  deleteFromCloud: async (id) => {
    await cloudDelete(id)
  },

  syncToCloud: async () => {
    const state = get()
    const persisted: PersistedProject = {
      id: state.id,
      name: state.name,
      description: state.description,
      type: state.type,
      phase: state.phase,
      status: state.status,
      scene: state.scene,
      electrical: state.electrical,
      validation: state.validation,
      aiState: state.aiState,
    }
    const result = await cloudSync(persisted, state.lastSyncedAt ?? undefined)
    if (result.conflict && result.serverVersion) {
      set(state => ({
        scene: result.serverVersion!.scene,
        electrical: result.serverVersion!.electrical,
        aiState: result.serverVersion!.aiState,
        lastSyncedAt: new Date().toISOString(),
      }))
    }
    return result.success
  },

  setExplainedCircuit: (circuitId) => {
    set({ explainedCircuit: circuitId })
  },

  explainCircuit: (circuitId) => {
    const state = get()
    const circuit = state.electrical.circuits.find(c => c.id === circuitId)
    if (!circuit) {
      return {
        circuitId,
        circuitName: "Неизвестная группа",
        rule: "",
        reason: "Группа не найдена",
        points: [],
        breaker: { type: "", rating: 0, reason: "" },
        cable: { type: "", crossSection: 0, reason: "" },
        phase: { assignment: 1, reason: "" },
      }
    }

    const circuitPoints = state.electrical.points.filter(p => circuit.points.includes(p.id))
    const pointExplanations = circuitPoints.map(p => {
      let reason = ""
      if (p.type.startsWith("light")) {
        reason = "Освещение: малая мощность (15-120Вт), объединено в одну группу для удобства управления"
      } else if (p.type === "switch" || p.type === "switch_pass_through") {
        reason = "Выключатель: управляет освещением, подключён к группе освещения"
      } else if (p.type === "outlet_waterproof") {
        reason = "Влагозащищённая розетка: требует отдельной группы с УЗО 30мА (ПУЭ 7.1.47)"
      } else if (p.type === "appliance_stove") {
        reason = "Электроплита: высокая мощность (7кВт), требует отдельной линии с автоматом C32"
      } else if (p.type === "appliance_boiler") {
        reason = "Бойлер: средняя мощность (2кВт), отдельная группа для безопасности"
      } else if (p.type === "appliance_ac") {
        reason = "Кондиционер: средняя мощность (2.5кВт), отдельная группа"
      } else if (p.type === "appliance_washing_machine") {
        reason = "Стиральная машина: средняя мощность (2кВт), отдельная группа"
      } else if (p.type.startsWith("sensor")) {
        reason = "Датчик: служебная цепь, минимальное потребление"
      } else {
        reason = "Розетка: стандартная группа для бытовых приборов (ПУЭ 7.1.71)"
      }
      return { name: p.name, type: p.type, reason }
    })

    let rule = ""
    let reason = ""
    if (circuit.type === "lighting") {
      rule = "ПУЭ 7.1.31 + СП 15.5"
      reason = "Освещение: кабель 3x1.5мм², автомат C10. Минимальное сечение 1.5мм² для освещения"
    } else if (circuit.type === "power_stove") {
      rule = "ПУЭ 7.1.31 + СП 15.5"
      reason = "Электроплита: кабель 3x6мм², автомат C32. Выделенная линия для мощных потребителей"
    } else if (circuit.type === "outlets_bathroom") {
      rule = "ПУЭ 7.1.47 + ПУЭ 7.1.71"
      reason = "Влажная зона: кабель 3x2.5мм², автомат C16 + УЗО 30мА. Обязательная защита от поражения током"
    } else if (circuit.type.startsWith("power_")) {
      rule = "ПУЭ 7.1.31 + СП 15.5"
      reason = "Силовая группа: кабель 3x2.5мм², автомат C16. Стандартное сечение для розеток"
    } else {
      rule = "ПУЭ 7.1.31 + ПУЭ 7.1.71"
      reason = "Розетки: кабель 3x2.5мм², автомат C16. Группа розеток с защитой УЗО"
    }

    return {
      circuitId: circuit.id,
      circuitName: circuit.name,
      rule,
      reason,
      points: pointExplanations,
      breaker: {
        type: circuit.breakerId ?? "C16",
        rating: parseInt(circuit.breakerId?.replace("C", "") ?? "16"),
        reason: `Выбран автомат ${circuit.breakerId ?? "C16"} по токовой нагрузке группы (${circuit.load.effectiveCurrent.toFixed(1)}А)`,
      },
      cable: {
        type: circuit.cableId ?? "ВВГнг-LS 3x2.5",
        crossSection: 2.5,
        reason: `Сечение ${2.5}мм² обеспечивает допустимый ток ${21}А при прокладке в стене`,
      },
      phase: {
        assignment: circuit.phase,
        reason: `Фаза L${circuit.phase}: назначена по round-robin для балансировки нагрузки`,
      },
    }
  },

  generateBOM: () => {
    const state = get()
    const items: BOMItem[] = []

    // Панель
    if (state.electrical.points.some(p => p.type === "panel")) {
      items.push({
        category: "Щит",
        name: "Распределительный щит",
        quantity: 1,
        unit: "шт",
        specification: `На ${state.electrical.circuits.length + 2} модулей`,
        estimatedCost: 3500,
      })
    }

    // Автоматы
    const breakerCounts = new Map<string, number>()
    state.electrical.circuits.forEach(c => {
      const type = c.breakerId ?? "C16"
      breakerCounts.set(type, (breakerCounts.get(type) ?? 0) + 1)
    })
    breakerCounts.forEach((count, type) => {
      items.push({
        category: "Автоматы",
        name: `Автомат ABB SH200 ${type}`,
        quantity: count,
        unit: "шт",
        specification: `${type} 1P`,
        estimatedCost: 450,
      })
    })

    // УЗО для влажных зон
    const bathroomCircuits = state.electrical.circuits.filter(c => c.type === "outlets_bathroom")
    if (bathroomCircuits.length > 0) {
      items.push({
        category: "УЗО",
        name: "УЗО ABB F202 AC-25/30мА",
        quantity: 1,
        unit: "шт",
        specification: "25А 30мА 2P",
        estimatedCost: 2800,
      })
    }

    // Кабели
    const cableLengths = new Map<string, number>()
    state.electrical.cables.forEach(c => {
      const type = c.conduitType === "pipe" ? "ВВГнг-LS 3x2.5" : "ВВГнг-LS 3x2.5"
      cableLengths.set(type, (cableLengths.get(type) ?? 0) + c.length)
    })
    if (cableLengths.size === 0 && state.electrical.circuits.length > 0) {
      cableLengths.set("ВВГнг-LS 3x2.5", state.electrical.circuits.length * 8)
    }
    cableLengths.forEach((length, type) => {
      const pricePerM = type.includes("1.5") ? 52 : type.includes("6") ? 185 : 82
      items.push({
        category: "Кабель",
        name: type,
        quantity: Math.round(length),
        unit: "м",
        specification: `Медный, негорючий`,
        estimatedCost: pricePerM,
      })
    })

    // Розетки и выключатели
    const outletTypes = new Map<string, number>()
    state.electrical.points.forEach(p => {
      if (p.type.startsWith("outlet") || p.type === "switch" || p.type === "switch_pass_through" || p.type === "dimmer") {
        const name = p.type === "outlet_waterproof" ? "Розетка IP44" :
                     p.type === "outlet_triple" ? "Блок розеток 3-местный" :
                     p.type === "switch" ? "Выключатель 1-кл" :
                     p.type === "switch_pass_through" ? "Проходной выключатель" :
                     p.type === "dimmer" ? "Диммер" : "Розетка 220В"
        outletTypes.set(name, (outletTypes.get(name) ?? 0) + 1)
      }
    })
    outletTypes.forEach((count, name) => {
      const price = name.includes("IP44") ? 850 : name.includes("3-местный") ? 1200 :
                    name.includes("Проходной") ? 950 : name.includes("Диммер") ? 2200 : 350
      items.push({
        category: "Электроустановка",
        name,
        quantity: count,
        unit: "шт",
        specification: "Серия Vega или аналог",
        estimatedCost: price,
      })
    })

    // Светильники
    const lightTypes = new Map<string, number>()
    state.electrical.points.forEach(p => {
      if (p.type.startsWith("light")) {
        const name = p.type === "light_ceiling" ? "Потолочный светильник" :
                     p.type === "light_wall" ? "Бра" :
                     p.type === "light_spot" ? "Точечный светильник" : "Светильник"
        lightTypes.set(name, (lightTypes.get(name) ?? 0) + 1)
      }
    })
    lightTypes.forEach((count, name) => {
      const price = name.includes("потолочный") ? 2500 : name.includes("Бра") ? 1200 : 800
      items.push({
        category: "Светильники",
        name,
        quantity: count,
        unit: "шт",
        specification: "LED",
        estimatedCost: price,
      })
    })

    // Распредкоробки
    const junctionBoxes = state.electrical.points.filter(p => p.type === "junction_box").length
    if (junctionBoxes > 0) {
      items.push({
        category: "Монтаж",
        name: "Распределительная коробка",
        quantity: junctionBoxes,
        unit: "шт",
        specification: "100x100x50",
        estimatedCost: 150,
      })
    }

    // Гофра/лотки
    const totalCableLength = state.electrical.cables.reduce((sum, c) => sum + c.length, 0)
    if (totalCableLength > 0) {
      items.push({
        category: "Монтаж",
        name: "Гофротруба ПВХ d20",
        quantity: Math.round(totalCableLength * 1.2),
        unit: "м",
        specification: "Негорючая",
        estimatedCost: 25,
      })
    }

    return items
  },
}))
