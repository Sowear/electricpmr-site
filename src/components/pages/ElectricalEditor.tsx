import { useCallback, useEffect, useMemo, useRef, useState, type ElementType, type ReactNode } from "react"
import { useNavigate } from "react-router-dom"
import { useProjectStore } from "@/stores/projectStore"
import { CanvasEngine } from "@/engine/canvas/CanvasEngine"
import { getLibraryByCategory, searchLibrary, LIBRARY_CATEGORIES, type LibraryItem } from "@/engine/library"
import { initAutoLayout, updateAutoLayoutData } from "@/engine/core/autoLayout"
import { downloadPDF } from "@/engine/persistence/pdfExport"
import { generateDXF, downloadDXF } from "@/engine/persistence/dxfExport"
import { UXRecorder } from "@/engine/analytics/uxRecorder"
import { Button } from "@/components/ui/button"
import { supabase } from "@/integrations/supabase/client"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import {
  AlertTriangle,
  Check,
  DoorOpen,
  Download,
  FilePlus2,
  Grid3X3,
  Layers,
  Lightbulb,
  Loader2,
  Lock,
  Magnet,
  PanelTop,
  Plug,
  Power,
  Redo2,
  Save,
  Search,
  ShieldCheck,
  Sparkles,
  Square,
  Trash2,
  Undo2,
  Upload,
  X,
  Zap,
} from "lucide-react"
import type { ElectricalPoint } from "@/engine/types"

type Tool = "select" | "wall" | "door" | "window" | "outlet" | "switch" | "light" | "sensor" | "panel"

const BREAKER_LABELS: Record<string, string> = {
  "brk_1p_c6": "C6", "brk_1p_c10": "C10", "brk_1p_c16": "C16",
  "brk_1p_c20": "C20", "brk_1p_c25": "C25", "brk_1p_c32": "C32",
  "brk_1p_c40": "C40", "brk_1p_c50": "C50",
  "brk_2p_c16": "2P C16", "brk_2p_c25": "2P C25", "brk_2p_c32": "2P C32",
}

const CABLE_LABELS: Record<string, string> = {
  "cable_cu_2x1.5": "ВВГнг-LS 2x1.5", "cable_cu_3x1.5": "ВВГнг-LS 3x1.5",
  "cable_cu_3x2.5": "ВВГнг-LS 3x2.5", "cable_cu_3x4": "ВВГнг-LS 3x4",
  "cable_cu_3x6": "ВВГнг-LS 3x6", "cable_cu_3x10": "ВВГнг-LS 3x10",
  "cable_cu_3x16": "ВВГнг-LS 3x16",
}

function breakerLabel(id?: string): string {
  if (!id) return "AI"
  return BREAKER_LABELS[id] ?? id
}

function cableLabel(id?: string): string {
  if (!id) return "AI"
  return CABLE_LABELS[id] ?? id
}

const TOOLS: Array<{ id: Tool; icon: ElementType; label: string; group: "plan" | "electrical" }> = [
  { id: "select", icon: Layers, label: "Выбор", group: "plan" },
  { id: "wall", icon: Square, label: "Стена", group: "plan" },
  { id: "door", icon: DoorOpen, label: "Дверь", group: "plan" },
  { id: "window", icon: PanelTop, label: "Окно", group: "plan" },
  { id: "outlet", icon: Plug, label: "Розетка", group: "electrical" },
  { id: "switch", icon: Zap, label: "Выключатель", group: "electrical" },
  { id: "light", icon: Lightbulb, label: "Свет", group: "electrical" },
  { id: "sensor", icon: AlertTriangle, label: "Датчик", group: "electrical" },
  { id: "panel", icon: Power, label: "Щит", group: "electrical" },
]

const ROOM_TYPES = [
  ["living", "Гостиная"],
  ["bedroom", "Спальня"],
  ["kitchen", "Кухня"],
  ["bathroom", "Санузел"],
  ["corridor", "Коридор"],
  ["office", "Кабинет"],
  ["custom", "Другая"],
] as const

const POINT_TYPES = [
  ["outlet", "Розетка"],
  ["outlet_waterproof", "Розетка IP44"],
  ["outlet_triple", "Тройная розетка"],
  ["switch", "Выключатель"],
  ["switch_pass_through", "Проходной выключатель"],
  ["light_ceiling", "Свет потолочный"],
  ["light_wall", "Бра"],
  ["sensor_motion", "Датчик движения"],
  ["sensor_smoke", "Датчик дыма"],
  ["sensor_leak", "Датчик протечки"],
  ["appliance_stove", "Электроплита"],
  ["appliance_boiler", "Бойлер"],
  ["appliance_ac", "Кондиционер"],
  ["appliance_washing_machine", "Стиральная машина"],
  ["appliance_fridge", "Холодильник"],
  ["panel", "Щит"],
] as const

function ElectricalEditorContent() {
  const {
    name,
    phase,
    scene,
    electrical,
    validation,
    ui,
    undoStack,
    redoStack,
    setActiveTool,
    toggleGrid,
    toggleSnap,
    recalculate,
    validate,
    detectRooms,
    runAIProject,
    undo,
    redo,
    saveProject,
    loadSavedProject,
    importProject,
    clearProject,
    explainedCircuit,
    explainCircuit,
    setExplainedCircuit,
    autoPlace,
  } = useProjectStore()

  const [query, setQuery] = useState("")
  const [libraryOpen, setLibraryOpen] = useState(false)
  const [category, setCategory] = useState("outlets")
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    initAutoLayout()
    loadSavedProject()
  }, [loadSavedProject])

  useEffect(() => {
    updateAutoLayoutData(electrical.points, electrical.circuits)
  }, [electrical.points, electrical.circuits])

  useEffect(() => {
    validate()
  }, [scene.walls.length, scene.doors.length, scene.windows.length, scene.objects.length, electrical.points.length, electrical.circuits.length, validate])

  const trustScore = useMemo(() => {
    let score = 20
    if (scene.walls.length > 0) score += 20
    if (scene.rooms.length > 0) score += 10
    if (scene.doors.length + scene.windows.length > 0) score += 10
    if (scene.objects.length > 0) score += 5
    if (electrical.points.some(point => point.type === "panel")) score += 15
    if (electrical.points.length > 1) score += 15
    if (electrical.circuits.length > 0) score += 15
    if (electrical.cables.length > 0) score += 10
    score -= validation.errors.length * 15
    score -= validation.warnings.length * 5
    return Math.max(0, Math.min(100, score))
  }, [electrical.cables.length, electrical.circuits.length, electrical.points, scene.doors.length, scene.objects.length, scene.rooms.length, scene.walls.length, scene.windows.length, validation.errors.length, validation.warnings.length])

  const libraryItems = query ? searchLibrary(query) : getLibraryByCategory(category)

  const exportJson = useCallback(() => {
    const payload = JSON.stringify({ name, scene, electrical, validation, exportedAt: new Date().toISOString() }, null, 2)
    const blob = new Blob([payload], { type: "application/json;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `${name || "electricpmr-project"}.json`
    link.click()
    URL.revokeObjectURL(url)
  }, [electrical, name, scene, validation])

  const importJson = useCallback(() => {
    fileInputRef.current?.click()
  }, [])

  const handleImportFile = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (e) => {
      const text = e.target?.result
      if (typeof text === "string") {
        importProject(text)
      }
    }
    reader.readAsText(file)
    event.target.value = ""
  }, [importProject])

  const exportPdf = useCallback(() => {
    downloadPDF({ id: "", name, description: "", type: "apartment", phase: "design", status: "draft", scene, electrical, validation, aiState: { totalActions: 0, confidence: 0, taskHistory: [] } }, `${name || "electricpmr-project"}.pdf`)
  }, [electrical, name, scene, validation])

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background text-foreground">
      <input ref={fileInputRef} type="file" accept=".json" className="hidden" onChange={handleImportFile} />
      <aside className="flex w-[76px] flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground">
        <div className="flex h-16 items-center justify-center border-b border-sidebar-border">
          <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary text-primary-foreground shadow-primary">
            <Zap className="h-5 w-5" />
          </div>
        </div>

        <ScrollArea className="flex-1">
          <ToolGroup title="План">
            {TOOLS.filter(tool => tool.group === "plan").map(tool => (
              <ToolButton key={tool.id} tool={tool} active={ui.activeTool === tool.id} onClick={() => setActiveTool(tool.id)} />
            ))}
          </ToolGroup>

          <ToolGroup title="Электрика">
            {TOOLS.filter(tool => tool.group === "electrical").map(tool => (
              <ToolButton key={tool.id} tool={tool} active={ui.activeTool === tool.id} onClick={() => setActiveTool(tool.id)} />
            ))}
          </ToolGroup>
        </ScrollArea>

        <div className="space-y-2 border-t border-sidebar-border p-3">
          <RailButton icon={Grid3X3} active={ui.showGrid} label={ui.showGrid ? "Сетка включена" : "Сетка скрыта"} onClick={toggleGrid} />
          <RailButton icon={Magnet} active={ui.snapToGrid} label={ui.snapToGrid ? "Привязка к сетке и стенам" : "Свободная постановка"} onClick={toggleSnap} />
        </div>
      </aside>

      <main className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-16 items-center justify-between border-b border-border bg-card px-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="truncate text-sm font-semibold">{name || "Новый проект"}</span>
              <Badge variant="outline" className="border-primary/35 text-foreground">
                {phase === "design" ? "Проектирование" : phase}
              </Badge>
            </div>
            <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
              <span>Trust Score {trustScore}%</span>
              <span>•</span>
              <span>{ui.lastSavedAt ? `Автосохранено ${new Date(ui.lastSavedAt).toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })}` : "Ожидает первого сохранения"}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <HeaderButton label="Новый проект" icon={FilePlus2} onClick={clearProject} />
            <HeaderButton label="Сохранить" icon={Save} onClick={saveProject} />
            <Separator orientation="vertical" className="mx-1 h-6" />
            <HeaderButton label="Отменить" icon={Undo2} onClick={() => { undo(); recalculate(); UXRecorder.track("undo") }} disabled={undoStack.length === 0} />
            <HeaderButton label="Повторить" icon={Redo2} onClick={() => { redo(); recalculate(); UXRecorder.track("redo") }} disabled={redoStack.length === 0} />
            <Separator orientation="vertical" className="mx-1 h-6" />
            <HeaderButton label="Библиотека объектов" icon={Search} onClick={() => setLibraryOpen(value => !value)} active={libraryOpen} />
            <Button variant="outline" size="sm" className="h-9 gap-2" disabled={scene.walls.length < 3} onClick={() => { detectRooms(); validate() }}>
              <Square className="h-4 w-4" />
              Комнаты
            </Button>
            <Button variant="secondary" size="sm" className="h-9 gap-2" disabled={electrical.points.filter(point => point.type !== "panel").length === 0 && scene.walls.length < 3} onClick={runAIProject}>
              <Sparkles className="h-4 w-4" />
              AI Проектирование
            </Button>
            <Button variant="outline" size="sm" className="h-9 gap-2" onClick={importJson}>
              <Upload className="h-4 w-4" />
              Импорт
            </Button>
            <Button variant="outline" size="sm" className="h-9 gap-2" onClick={() => { exportJson(); UXRecorder.track("export", "json") }}>
              <Download className="h-4 w-4" />
              JSON
            </Button>
            <Button variant="outline" size="sm" className="h-9 gap-2" onClick={() => { exportPdf(); UXRecorder.track("export", "pdf") }}>
              <Download className="h-4 w-4" />
              PDF
            </Button>
            <Button variant="outline" size="sm" className="h-9 gap-2" onClick={() => {
              const dxf = generateDXF(scene.walls, scene.rooms, scene.doors, scene.windows, electrical.points, electrical.cables)
              downloadDXF(dxf, `${scene.name || "project"}.dxf`)
              UXRecorder.track("export", "dxf")
            }}>
              <Download className="h-4 w-4" />
              DXF
            </Button>
            <Button variant="outline" size="sm" className="h-9 gap-2" onClick={() => { autoPlace(); UXRecorder.track("ai_action", "auto_place") }}>
              <Sparkles className="h-4 w-4" />
              Расставить
            </Button>
          </div>
        </header>

        <div className="flex h-12 items-center justify-between border-b border-border bg-card px-4">
          <WorkflowPills
            walls={scene.walls.length}
            openings={scene.doors.length + scene.windows.length}
            rooms={scene.rooms.length}
            points={electrical.points.length}
            panels={electrical.points.filter(point => point.type === "panel").length}
            circuits={electrical.circuits.length}
            routes={electrical.cables.length}
            errors={validation.errors.length}
          />

          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>Стены: {scene.walls.length}</span>
            <span>Проемы: {scene.doors.length + scene.windows.length}</span>
            <span>Точки: {electrical.points.length}</span>
            <span>Группы: {electrical.circuits.length}</span>
            {validation.errors.length > 0 ? (
              <Badge variant="destructive">{validation.errors.length} ошибок</Badge>
            ) : (
              <Badge variant="outline" className="border-primary/35 text-foreground">Проверка OK</Badge>
            )}
          </div>
        </div>

        <div className="flex min-h-0 flex-1 overflow-hidden">
          <section className="relative min-w-0 flex-1 overflow-hidden">
            <CanvasEngine />
            {libraryOpen && (
              <LibraryPanel
                query={query}
                onQueryChange={setQuery}
                category={category}
                onCategoryChange={setCategory}
                items={libraryItems}
                onClose={() => setLibraryOpen(false)}
              />
            )}
          </section>

          <aside className="w-80 border-l border-border bg-card">
            <div className="flex h-14 items-center justify-between border-b border-border px-4">
              <span className="text-sm font-semibold">Инспектор проекта</span>
              <ShieldCheck className="h-4 w-4 text-primary" />
            </div>
            <ScrollArea className="h-[calc(100vh-8.25rem)]">
              <div className="p-4">
                {explainedCircuit ? (
                  <ExplainModePanel
                    explanation={explainCircuit(explainedCircuit)}
                    onClose={() => setExplainedCircuit(null)}
                  />
                ) : (
                  <PropertiesPanel trustScore={trustScore} />
                )}
              </div>
            </ScrollArea>
          </aside>
        </div>
      </main>
    </div>
  )
}

function ToolGroup({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="space-y-2 p-3">
      <div className="px-1 text-[10px] font-semibold uppercase tracking-wide text-sidebar-foreground/55">{title}</div>
      <div className="flex flex-col gap-1">{children}</div>
    </div>
  )
}

function ToolButton({ tool, active, onClick }: { tool: typeof TOOLS[number]; active: boolean; onClick: () => void }) {
  const Icon = tool.icon
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label={tool.label}
          data-tool={tool.id}
          className={`h-10 w-10 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground ${active ? "bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground" : ""}`}
          onClick={onClick}
        >
          <Icon className="h-4 w-4" />
        </Button>
      </TooltipTrigger>
      <TooltipContent side="right">{tool.label}</TooltipContent>
    </Tooltip>
  )
}

function RailButton({ icon: Icon, active, label, onClick }: { icon: ElementType; active: boolean; label: string; onClick: () => void }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label={label}
          className={`h-10 w-10 text-sidebar-foreground hover:bg-sidebar-accent ${active ? "bg-sidebar-accent ring-1 ring-primary/35" : ""}`}
          onClick={onClick}
        >
          <Icon className="h-4 w-4" />
        </Button>
      </TooltipTrigger>
      <TooltipContent side="right">{label}</TooltipContent>
    </Tooltip>
  )
}

function HeaderButton({ label, icon: Icon, onClick, disabled, active }: { label: string; icon: ElementType; onClick: () => void; disabled?: boolean; active?: boolean }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button variant={active ? "secondary" : "ghost"} size="icon" className="h-9 w-9" onClick={onClick} disabled={disabled}>
          <Icon className="h-4 w-4" />
        </Button>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  )
}

function WorkflowPills({ walls, openings, rooms, points, panels, circuits, routes, errors }: { walls: number; openings: number; rooms: number; points: number; panels: number; circuits: number; routes: number; errors: number }) {
  const items = [
    { label: "План", done: walls > 0 },
    { label: "Проемы", done: openings > 0 },
    { label: "Комнаты", done: rooms > 0 },
    { label: "Щит", done: panels > 0 },
    { label: "Точки", done: points > panels },
    { label: "Группы", done: circuits > 0 },
    { label: "Кабель", done: routes > 0 },
    { label: "Проверка", done: errors === 0 },
  ]

  return (
    <div className="flex items-center gap-2">
      {items.map(item => (
        <div key={item.label} className={`flex items-center gap-2 rounded-md border px-3 py-1.5 text-xs ${item.done ? "border-primary/35 bg-primary/10 text-foreground" : "border-border bg-secondary/40 text-muted-foreground"}`}>
          {item.done ? <Check className="h-3.5 w-3.5 text-primary" /> : <span className="h-2 w-2 rounded-full bg-current opacity-40" />}
          {item.label}
        </div>
      ))}
    </div>
  )
}

function PropertiesPanel({ trustScore }: { trustScore: number }) {
  const store = useProjectStore()
  const { ui, scene, electrical, removeWall, removeRoom, removeDoor, removeWindow, removeElectricalPoint, removeObject } = store
  const selectedId = ui.selectedObjectId

  if (!selectedId) return <ProjectInfo trustScore={trustScore} />

  const wall = scene.walls.find(item => item.id === selectedId)
  const room = scene.rooms.find(item => item.id === selectedId)
  const door = scene.doors.find(item => item.id === selectedId)
  const windowItem = scene.windows.find(item => item.id === selectedId)
  const point = electrical.points.find(item => item.id === selectedId)
  const furniture = scene.objects.find(item => item.id === selectedId)
  const obj = wall ?? room ?? door ?? windowItem ?? point ?? furniture
  if (!obj) return <div className="text-sm text-muted-foreground">Объект не найден</div>

  const title = point?.name ?? furniture?.name ?? room?.name ?? (door ? "Дверь" : windowItem ? "Окно" : "Стена")

  const deleteSelected = () => {
    if (wall) removeWall(wall.id)
    if (room) removeRoom(room.id)
    if (door) removeDoor(door.id)
    if (windowItem) removeWindow(windowItem.id)
    if (point) removeElectricalPoint(point.id)
    if (furniture) removeObject(furniture.id)
  }

  return (
    <div className="space-y-4">
      <div className="rounded-md border border-border bg-secondary/35 p-3">
        <div className="text-xs font-medium uppercase text-muted-foreground">Выбранный объект</div>
        <div className="mt-1 truncate text-sm font-semibold">{title}</div>
        <Button variant="destructive" size="sm" className="mt-3 h-8 gap-2" onClick={deleteSelected}>
          <Trash2 className="h-3.5 w-3.5" />
          Удалить
        </Button>
      </div>

      {wall && <WallEditor wall={wall} />}
      {room && <RoomEditor room={room} />}
      {door && <DoorEditor door={door} />}
      {windowItem && <WindowEditor windowItem={windowItem} />}
      {point && <PointEditor2 point={point} />}
      {furniture && <FurnitureEditor object={furniture} />}
    </div>
  )
}

function WallEditor({ wall }: { wall: any }) {
  const updateWall = useProjectStore(state => state.updateWall)
  const length = Math.round(Math.hypot(wall.points[1].x - wall.points[0].x, wall.points[1].y - wall.points[0].y))

  return (
    <>
      <InfoBlock title="Геометрия" rows={[["Длина", `${length} мм`], ["X1", Math.round(wall.points[0].x)], ["Y1", Math.round(wall.points[0].y)], ["X2", Math.round(wall.points[1].x)], ["Y2", Math.round(wall.points[1].y)]]} />
      <FieldGroup title="Свойства стены">
        <NumberField label="Толщина, мм" value={wall.thickness} onChange={value => updateWall(wall.id, { thickness: value })} />
        <NumberField label="Высота, мм" value={wall.height} onChange={value => updateWall(wall.id, { height: value })} />
        <SelectField label="Материал" value={wall.material} onChange={value => updateWall(wall.id, { material: value as any })} items={[
          ["brick", "Кирпич"],
          ["concrete", "Бетон"],
          ["drywall", "Гипсокартон"],
          ["aerated_concrete", "Газобетон"],
          ["wood", "Дерево"],
        ]} />
      </FieldGroup>
    </>
  )
}

function RoomEditor({ room }: { room: any }) {
  const updateRoom = useProjectStore(state => state.updateRoom)

  return (
    <>
      <InfoBlock title="Параметры" rows={[["Площадь", `${room.area.toFixed(1)} м²`], ["Периметр", `${room.perimeter.toFixed(1)} м`], ["Объем", `${room.volume.toFixed(1)} м³`]]} />
      <FieldGroup title="Комната">
        <TextField label="Название" value={room.name} onChange={value => updateRoom(room.id, { name: value })} />
        <SelectField label="Тип помещения" value={room.type} onChange={value => updateRoom(room.id, { type: value as any })} items={ROOM_TYPES} />
        <NumberField label="Высота потолка, мм" value={room.ceilingHeight} onChange={value => updateRoom(room.id, { ceilingHeight: value })} />
      </FieldGroup>
    </>
  )
}

function DoorEditor({ door }: { door: any }) {
  const updateDoor = useProjectStore(state => state.updateDoor)
  return (
    <FieldGroup title="Дверь">
      <NumberField label="Положение на стене, %" value={Math.round(door.position * 100)} disabled />
      <NumberField label="Ширина, мм" value={door.width} onChange={value => updateDoor(door.id, { width: value })} />
      <NumberField label="Высота, мм" value={door.height} onChange={value => updateDoor(door.id, { height: value })} />
      <SelectField label="Тип" value={door.type} onChange={value => updateDoor(door.id, { type: value as any })} items={[
        ["single", "Одинарная"],
        ["double", "Двойная"],
        ["sliding", "Раздвижная"],
        ["entrance", "Входная"],
        ["bathroom", "Санузел"],
      ]} />
    </FieldGroup>
  )
}

function WindowEditor({ windowItem }: { windowItem: any }) {
  const updateWindow = useProjectStore(state => state.updateWindow)
  return (
    <FieldGroup title="Окно">
      <NumberField label="Положение на стене, %" value={Math.round(windowItem.position * 100)} disabled />
      <NumberField label="Ширина, мм" value={windowItem.width} onChange={value => updateWindow(windowItem.id, { width: value })} />
      <NumberField label="Высота, мм" value={windowItem.height} onChange={value => updateWindow(windowItem.id, { height: value })} />
      <NumberField label="Подоконник, мм" value={windowItem.sillHeight} onChange={value => updateWindow(windowItem.id, { sillHeight: value })} />
    </FieldGroup>
  )
}

function FurnitureEditor({ object }: { object: any }) {
  const updateObject = useProjectStore(state => state.updateObject)
  return (
    <>
      <FieldGroup title="Мебель и контекст">
        <TextField label="Название" value={object.name} onChange={value => updateObject(object.id, { name: value })} />
        <SelectField label="Тип" value={object.type} onChange={value => updateObject(object.id, { type: value })} items={[
          ["sofa", "Диван"],
          ["bed", "Кровать"],
          ["kitchen", "Кухня"],
          ["tv", "TV"],
          ["fridge", "Холодильник"],
          ["desk", "Стол"],
          ["wardrobe", "Шкаф"],
        ]} />
        <NumberField label="Ширина, мм" value={object.width} onChange={value => updateObject(object.id, { width: value })} />
        <NumberField label="Глубина, мм" value={object.height} onChange={value => updateObject(object.id, { height: value })} />
      </FieldGroup>
      <InfoBlock title="Координаты" rows={[["X", Math.round(object.position.x)], ["Y", Math.round(object.position.y)]]} />
    </>
  )
}

function PointEditor2({ point }: { point: ElectricalPoint }) {
  const { scene, electrical, updateElectricalPoint } = useProjectStore()
  const power = Number(point.parameters?.power ?? defaultPower(point.type))

  return (
    <>
      <InfoBlock title="AI Проектирование" rows={[
        ["Тип", pointType(point.type)],
        ["Группа", point.circuitId ? point.circuitId.replace("circuit_", "") : "Еще не назначена"],
        ["Привязка", point.parameters?.wallId ? "К стене" : "Свободно"],
      ]} />
      <FieldGroup title={point.type === "panel" ? "Щит" : "Электроточка"}>
        <TextField label="Название" value={point.name} onChange={value => updateElectricalPoint(point.id, { name: value })} />
        <SelectField label="Тип точки" value={point.type} onChange={value => updateElectricalPoint(point.id, { type: value as any, subtype: value })} items={POINT_TYPES} />
        <SelectField label="Комната" value={point.roomId ?? "none"} onChange={value => updateElectricalPoint(point.id, { roomId: value === "none" ? undefined : value })} items={[["none", "Не назначена"], ...scene.rooms.map(room => [room.id, room.name] as const)]} />
        <SelectField label="Группа" value={point.circuitId ?? "auto"} onChange={value => updateElectricalPoint(point.id, { circuitId: value === "auto" ? undefined : value })} items={[["auto", "AI назначит"], ...electrical.circuits.map(circuit => [circuit.id, circuit.name] as const)]} />
        <NumberField label="Высота монтажа, мм" value={point.mountingHeight} onChange={value => updateElectricalPoint(point.id, { mountingHeight: value })} />
        <NumberField label="Мощность, Вт" value={power} disabled={point.type === "panel" || point.type.includes("switch")} onChange={value => updateElectricalPoint(point.id, { parameters: { ...point.parameters, power: value } })} />
        <SelectField label="Монтаж" value={point.mountingMethod} onChange={value => updateElectricalPoint(point.id, { mountingMethod: value as any })} items={[
          ["flush", "Встроенный"],
          ["surface", "Накладной"],
          ["recessed", "В нишу"],
        ]} />
      </FieldGroup>
      {point.type === "panel" && <PanelEngineeringView />}
      <InfoBlock title="Координаты" rows={[["X", Math.round(point.position.x)], ["Y", Math.round(point.position.y)]]} />
    </>
  )
}

function PanelEngineeringView() {
  const { electrical, setExplainedCircuit } = useProjectStore()

  if (electrical.circuits.length === 0) {
    return (
      <InfoBlock
        title="Щит"
        rows={[
          ["Группы", "Нет"],
          ["Действие", "Запустите AI Проектирование"],
        ]}
      />
    )
  }

  const totalPower = electrical.circuits.reduce((sum, c) => sum + c.load.totalPower, 0)
  const totalCurrent = electrical.circuits.reduce((sum, c) => sum + c.load.totalCurrent, 0)
  const totalPoints = electrical.circuits.reduce((sum, c) => sum + c.points.length, 0)
  const phases = { 1: 0, 2: 0, 3: 0 }
  electrical.circuits.forEach(c => { phases[c.phase as 1 | 2 | 3] += c.load.effectiveCurrent })
  const maxPhase = Math.max(phases[1], phases[2], phases[3])
  const isUnbalanced = maxPhase > 0 && (Math.max(phases[1], phases[2], phases[3]) - Math.min(phases[1], phases[2], phases[3])) / maxPhase > 0.3

  return (
    <div className="space-y-3">
      <InfoBlock title="Щит — Сводка" rows={[
        ["Групп", electrical.circuits.length],
        ["Точек", totalPoints],
        ["Мощность", `${Math.round(totalPower)} Вт`],
        ["Ток", `${totalCurrent.toFixed(1)} А`],
        ["Фазы", `L1: ${phases[1].toFixed(1)}А · L2: ${phases[2].toFixed(1)}А · L3: ${phases[3].toFixed(1)}А`],
      ]} />

      {isUnbalanced && (
        <div className="rounded-md border border-yellow-500/30 bg-yellow-500/10 p-2 text-xs text-yellow-700">
          Перекос фаз: разница {Math.round((maxPhase - Math.min(phases[1], phases[2], phases[3])) / maxPhase * 100)}%. Рекомендуется распределить потребителей равномернее.
        </div>
      )}

      <div className="space-y-2">
        <div className="text-xs font-semibold uppercase text-muted-foreground">Группы</div>
        {electrical.circuits.map(circuit => (
          <div key={circuit.id} className="rounded-md border border-border p-3 text-xs">
            <div className="flex items-center justify-between gap-2">
              <span className="truncate font-semibold">{circuit.name}</span>
              <div className="flex items-center gap-1">
                <span className="rounded bg-secondary px-1.5 py-0.5">L{circuit.phase}</span>
                <Button size="sm" variant="ghost" className="h-6 px-1.5 text-[10px]" onClick={() => setExplainedCircuit(circuit.id)}>
                  ?
                </Button>
              </div>
            </div>
            <div className="mt-2 grid grid-cols-2 gap-2 text-muted-foreground">
              <span>Автомат: {breakerLabel(circuit.breakerId)}</span>
              <span>Кабель: {cableLabel(circuit.cableId)}</span>
              <span>Точек: {circuit.points.length}</span>
              <span>{Math.round(circuit.load.totalPower)} Вт · {circuit.load.totalCurrent.toFixed(1)} А</span>
            </div>
            {circuit.load.totalCurrent > 16 && (
              <div className="mt-2 text-yellow-600">
                Превышен ток для C16 ({circuit.load.totalCurrent.toFixed(1)}А &gt; 16А)
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

function ProjectInfo({ trustScore }: { trustScore: number }) {
  const { scene, electrical, validation, addFurniture, saveToCloud, loadFromCloud, listCloudProjects, cloudSyncing, lastSyncedAt, generateBOM, getPanelSchedule, getCableJournal } = useProjectStore()
  const hasPanel = electrical.points.some(point => point.type === "panel")
  const totalCableLength = electrical.cables.reduce((sum, cable) => sum + cable.length, 0)
  const [cloudProjects, setCloudProjects] = useState<Array<{ id: string; name: string; updated_at: string }>>([])
  const [showCloud, setShowCloud] = useState(false)
  const [showBOM, setShowBOM] = useState(false)
  const [showPanelSchedule, setShowPanelSchedule] = useState(false)
  const [showCableJournal, setShowCableJournal] = useState(false)
  const [uxMetrics, setUxMetrics] = useState(() => UXRecorder.getMetrics())

  const handleLoadCloud = async () => {
    const list = await listCloudProjects()
    setCloudProjects(list)
    setShowCloud(!showCloud)
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-2">
        <StatCard label="Стены" value={scene.walls.length} />
        <StatCard label="Проемы" value={scene.doors.length + scene.windows.length} />
        <StatCard label="Комнаты" value={scene.rooms.length} />
        <StatCard label="Точки" value={electrical.points.length} />
        <StatCard label="Trust" value={`${trustScore}%`} />
        <StatCard label="Сессия" value={`${Math.round(uxMetrics.sessionDuration)}с`} />
        <StatCard label="Действий" value={uxMetrics.totalEvents} />
      </div>

      <ProjectLibraryActions />
      <FurnitureActions onAdd={(type, name, width, height) => addFurniture(type, name, { x: 520, y: 420 }, width, height)} />
      <AIAssistantActions />

      {scene.rooms.length > 0 && (
        <InfoBlock title="Комнаты" rows={scene.rooms.slice(0, 5).map((room, index) => [`${index + 1}. ${room.name} (${room.type})`, `${room.area.toFixed(1)} м²`])} />
      )}

      <InfoBlock
        title="Расчет"
        rows={[
          ["Щит", hasPanel ? "Установлен" : "Не установлен"],
          ["Мощность", `${electrical.totalLoad.totalPower.toFixed(0)} Вт`],
          ["Ток", `${electrical.totalLoad.totalCurrent.toFixed(1)} А`],
          ["Кабельных трасс", electrical.cables.length],
          ["Длина кабелей", `${totalCableLength.toFixed(1)} м`],
          ["Ошибки", validation.errors.length],
        ]}
      />

      {electrical.phaseBalance && (
        <InfoBlock
          title="Баланс фаз"
          rows={[
            ["L1", `${electrical.phaseBalance.L1.effectiveCurrent.toFixed(1)} А`],
            ["L2", `${electrical.phaseBalance.L2.effectiveCurrent.toFixed(1)} А`],
            ["L3", `${electrical.phaseBalance.L3.effectiveCurrent.toFixed(1)} А`],
            ["Отклонение", `${(electrical.phaseBalance.maxDeviation * 100).toFixed(0)}%`],
          ]}
        />
      )}

      {electrical.circuits.length > 0 && (
        <div className="space-y-2">
          <div className="text-xs font-semibold uppercase text-muted-foreground">Группы</div>
          {electrical.circuits.map(circuit => (
            <div key={circuit.id} className="rounded-md border border-border p-3">
              <div className="flex items-center justify-between gap-2">
                <span className="truncate text-sm font-medium">{circuit.name}</span>
                <span className="rounded bg-secondary px-1.5 py-0.5 text-[11px] text-muted-foreground">L{circuit.phase}</span>
              </div>
              <div className="mt-2 grid grid-cols-3 gap-2 text-xs text-muted-foreground">
                <span>{circuit.points.length} точ.</span>
                <span>{Math.round(circuit.load.totalPower)} Вт</span>
                <span>{circuit.load.totalCurrent.toFixed(1)} А</span>
              </div>
              <div className="mt-2 text-xs text-muted-foreground">
                {cableLabel(circuit.cableId)} · {breakerLabel(circuit.breakerId)}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="space-y-2">
        <div className="text-xs font-semibold uppercase text-muted-foreground">Проверка</div>
        {validation.errors.length === 0 && validation.warnings.length === 0 ? (
          <div className="rounded-md border border-primary/25 bg-primary/10 p-3 text-sm">Критических замечаний нет.</div>
        ) : (
          [...validation.errors, ...validation.warnings].slice(0, 6).map(issue => (
            <div key={issue.id} className={`rounded-md border p-2 text-xs ${issue.severity === "error" ? "border-destructive/30 bg-destructive/10" : "border-yellow-500/30 bg-yellow-500/10"}`}>
              {issue.message}
            </div>
          ))
        )}
      </div>

      {electrical.circuits.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="text-xs font-semibold uppercase text-muted-foreground">Спецификация (BOM)</div>
            <Button size="sm" variant="ghost" className="h-6 px-2 text-xs" onClick={() => setShowBOM(!showBOM)}>
              {showBOM ? "Свернуть" : "Показать"}
            </Button>
          </div>
          {showBOM && (() => {
            const bom = generateBOM()
            const totalCost = bom.reduce((sum, item) => sum + item.estimatedCost * item.quantity, 0)
            return (
              <div className="space-y-1 rounded-md border border-border p-2">
                {bom.map((item, index) => (
                  <div key={index} className="flex items-center justify-between text-xs">
                    <div className="flex-1 min-w-0">
                      <div className="truncate font-medium">{item.name}</div>
                      <div className="text-[10px] text-muted-foreground">{item.specification}</div>
                    </div>
                    <div className="text-right">
                      <div>{item.quantity} {item.unit}</div>
                      <div className="text-[10px] text-muted-foreground">{item.estimatedCost * item.quantity} ₽</div>
                    </div>
                  </div>
                ))}
                <div className="border-t border-border pt-1 text-xs font-semibold">
                  Итого: ~{totalCost.toLocaleString("ru-RU")} ₽
                </div>
              </div>
            )
          })()}
        </div>
      )}

      {electrical.circuits.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="text-xs font-semibold uppercase text-muted-foreground">Схема щита</div>
            <Button size="sm" variant="ghost" className="h-6 px-2 text-xs" onClick={() => setShowPanelSchedule(!showPanelSchedule)}>
              {showPanelSchedule ? "Свернуть" : "Показать"}
            </Button>
          </div>
          {showPanelSchedule && (() => {
            const schedule = getPanelSchedule()
            return (
              <div className="space-y-1 rounded-md border border-border p-2 text-xs">
                <div className="font-medium">{schedule.panelName} — {schedule.mainBreaker.model}</div>
                <div className="text-muted-foreground">Нагрузка: {schedule.summary.totalCurrent.toFixed(1)}А / {schedule.mainBreaker.rating}А ({schedule.summary.utilizationPercent}%)</div>
                <div className="text-muted-foreground">Баланс фаз: {schedule.summary.phaseBalance}%</div>
                <div className="mt-2 space-y-1">
                  {schedule.circuits.map(c => (
                    <div key={c.circuitNumber} className="flex items-center justify-between border-t border-border pt-1">
                      <span>{c.circuitNumber}. {c.circuitName}</span>
                      <span className="text-muted-foreground">{c.breakerModel} · {c.power}Вт · L{c.phase}</span>
                    </div>
                  ))}
                </div>
              </div>
            )
          })()}
        </div>
      )}

      {electrical.circuits.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="text-xs font-semibold uppercase text-muted-foreground">Кабельный журнал</div>
            <Button size="sm" variant="ghost" className="h-6 px-2 text-xs" onClick={() => setShowCableJournal(!showCableJournal)}>
              {showCableJournal ? "Свернуть" : "Показать"}
            </Button>
          </div>
          {showCableJournal && (() => {
            const journal = getCableJournal()
            return (
              <div className="space-y-1 rounded-md border border-border p-2 text-xs">
                <div className="text-muted-foreground">Длина: {journal.summary.totalLengthWithReserve}м · Стоимость: ~{journal.summary.totalCost.toLocaleString("ru-RU")}₽</div>
                {journal.summary.cablesOverloaded > 0 && <div className="text-destructive">Перегрузка: {journal.summary.cablesOverloaded} кабелей</div>}
                {journal.summary.cablesOverVoltageDrop > 0 && <div className="text-yellow-600">Потери {'>'}5%: {journal.summary.cablesOverVoltageDrop} кабелей</div>}
                <div className="mt-2 space-y-1">
                  {journal.rows.map(r => (
                    <div key={r.circuitNumber} className="flex items-center justify-between border-t border-border pt-1">
                      <span>{r.circuitNumber}. {r.circuitName}</span>
                      <span className="text-muted-foreground">{r.cableLabel} · {r.lengthWithReserve}м · {r.voltageDrop}%</span>
                    </div>
                  ))}
                </div>
              </div>
            )
          })()}
        </div>
      )}

      <div className="space-y-2">
        <div className="text-xs font-semibold uppercase text-muted-foreground">Облако</div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" className="h-8 flex-1 text-xs" disabled={cloudSyncing} onClick={async () => { await saveToCloud() }}>
            {cloudSyncing ? "Синхронизация..." : "Сохранить в облако"}
          </Button>
          <Button size="sm" variant="outline" className="h-8 flex-1 text-xs" disabled={cloudSyncing} onClick={handleLoadCloud}>
            Загрузить
          </Button>
        </div>
        {lastSyncedAt && (
          <div className="text-[10px] text-muted-foreground">
            Последняя синхронизация: {new Date(lastSyncedAt).toLocaleString("ru-RU")}
          </div>
        )}
        {showCloud && cloudProjects.length > 0 && (
          <div className="space-y-1 rounded-md border border-border p-2">
            {cloudProjects.map(p => (
              <div key={p.id} className="flex items-center justify-between gap-2 rounded-md border border-border bg-background p-2">
                <div className="flex-1 min-w-0">
                  <div className="truncate text-xs font-medium">{p.name}</div>
                  <div className="text-[10px] text-muted-foreground">
                    {new Date(p.updated_at).toLocaleDateString("ru-RU")}
                  </div>
                </div>
                <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => loadFromCloud(p.id)}>
                  Открыть
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function ExplainModePanel({ explanation, onClose }: { explanation: ReturnType<typeof useProjectStore.getState>["explainCircuit"]; onClose: () => void }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="text-xs font-semibold uppercase text-muted-foreground">Объяснение группы</div>
        <Button size="sm" variant="ghost" className="h-6 px-2 text-xs" onClick={onClose}>Закрыть</Button>
      </div>

      <div className="rounded-md border border-primary/25 bg-primary/10 p-3">
        <div className="text-sm font-semibold">{explanation.circuitName}</div>
        <div className="mt-1 text-xs text-muted-foreground">{explanation.reason}</div>
        <div className="mt-1 text-[10px] text-primary">{explanation.rule}</div>
      </div>

      <div className="space-y-2">
        <div className="text-xs font-semibold uppercase text-muted-foreground">Точки в группе</div>
        {explanation.points.map((point, index) => (
          <div key={index} className="rounded-md border border-border p-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-medium">{point.name}</span>
              <span className="text-muted-foreground">{point.type}</span>
            </div>
            <div className="mt-1 text-muted-foreground">{point.reason}</div>
          </div>
        ))}
      </div>

      <div className="space-y-2">
        <div className="text-xs font-semibold uppercase text-muted-foreground">Выбор оборудования</div>
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-md border border-border p-2 text-xs">
            <div className="font-medium">Автомат</div>
            <div className="text-muted-foreground">{explanation.breaker.type}</div>
            <div className="text-[10px] text-muted-foreground">{explanation.breaker.reason}</div>
          </div>
          <div className="rounded-md border border-border p-2 text-xs">
            <div className="font-medium">Кабель</div>
            <div className="text-muted-foreground">{explanation.cable.type}</div>
            <div className="text-[10px] text-muted-foreground">{explanation.cable.reason}</div>
          </div>
        </div>
        <div className="rounded-md border border-border p-2 text-xs">
          <div className="font-medium">Фаза L{explanation.phase.assignment}</div>
          <div className="text-muted-foreground">{explanation.phase.reason}</div>
        </div>
      </div>
    </div>
  )
}

function FurnitureActions({ onAdd }: { onAdd: (type: string, name: string, width: number, height: number) => void }) {
  const items = [
    ["sofa", "Диван", 1800, 850],
    ["bed", "Кровать", 2000, 1600],
    ["kitchen", "Кухня", 2400, 650],
    ["tv", "TV", 1200, 120],
    ["fridge", "Холодильник", 700, 700],
    ["desk", "Стол", 1200, 700],
    ["wardrobe", "Шкаф", 1600, 600],
  ] as const

  return (
    <div className="space-y-2">
      <div className="text-xs font-semibold uppercase text-muted-foreground">Контекст мебели</div>
      <div className="grid grid-cols-2 gap-2">
        {items.map(([type, name, width, height]) => (
          <Button key={type} variant="outline" size="sm" className="h-8 justify-start text-xs" onClick={() => onAdd(type, name, width, height)}>
            {name}
          </Button>
        ))}
      </div>
    </div>
  )
}

function ProjectLibraryActions() {
  const { saveProject, listProjects, loadProjectById, duplicateProject, deleteProject } = useProjectStore()
  const [items, setItems] = useState(() => listProjects())
  const refresh = () => setItems(listProjects())
  const [expanded, setExpanded] = useState(false)

  const shown = expanded ? items : items.slice(0, 4)

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="text-xs font-semibold uppercase text-muted-foreground">Проекты</div>
        <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => { saveProject(); refresh(); UXRecorder.track("save") }}>
          Сохранить
        </Button>
      </div>
      <div className="space-y-2 rounded-md border border-border p-2">
        {items.length === 0 && <div className="text-xs text-muted-foreground">Сохранённых проектов пока нет.</div>}
        {shown.map(item => (
          <div key={item.id} className="space-y-2 rounded-md bg-secondary/35 p-2">
            <div className="truncate text-xs font-medium">{item.name}</div>
            <div className="text-[10px] text-muted-foreground">
              {new Date(item.updatedAt).toLocaleDateString("ru-RU")} {new Date(item.updatedAt).toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })}
            </div>
            <div className="flex gap-1">
              <Button size="sm" variant="outline" className="h-7 flex-1 text-xs" onClick={() => { loadProjectById(item.id); refresh() }}>Открыть</Button>
              <Button size="sm" variant="outline" className="h-7 flex-1 text-xs" onClick={() => { duplicateProject(item.id); refresh() }}>Копия</Button>
              <Button size="sm" variant="ghost" className="h-7 px-2 text-xs" onClick={() => { deleteProject(item.id); refresh() }}>Удалить</Button>
            </div>
          </div>
        ))}
        {items.length > 4 && (
          <Button size="sm" variant="ghost" className="h-7 w-full text-xs" onClick={() => setExpanded(!expanded)}>
            {expanded ? "Свернуть" : `Показать все (${items.length})`}
          </Button>
        )}
      </div>
    </div>
  )
}

function AIAssistantActions() {
  const { scene, electrical, validation, detectRooms, runAIProject, validate, autoGroupCircuits } = useProjectStore()
  const hasPanel = electrical.points.some(point => point.type === "panel")
  const hasConsumers = electrical.points.some(point => point.type !== "panel" && point.type !== "junction_box")
  const hasRooms = scene.rooms.length > 0
  const hasCircuits = electrical.circuits.length > 0
  const hasCables = electrical.cables.length > 0
  const ungroupedPoints = electrical.points.filter(p => p.type !== "panel" && p.type !== "junction_box" && !p.circuitId).length
  const actions: Array<{ label: string; description?: string; disabled?: boolean; onClick: () => void }> = []

  if (scene.walls.length >= 3 && !hasRooms) {
    actions.push({ label: "Определить комнаты", description: "Автоматически разделить план на помещения", onClick: () => { detectRooms(); validate() } })
  }

  if (!hasPanel && hasConsumers) {
    actions.push({ label: "Добавить щит", description: "Щит обязателен для группировки", onClick: () => {} })
  }

  if (hasPanel && hasConsumers && !hasCircuits) {
    actions.push({ label: "Собрать AI проект", description: "Разнести по группам и назначить автоматы", onClick: runAIProject })
  }

  if (hasCircuits && ungroupedPoints > 0) {
    actions.push({ label: "Перегруппировать", description: `${ungroupedPoints} точек без группы`, onClick: autoGroupCircuits })
  }

  if (hasCircuits && !hasCables) {
    actions.push({ label: "Построить трассы", description: "Проложить кабельные трассы от щита", onClick: autoGroupCircuits })
  }

  if (validation.errors.length > 0 || validation.warnings.length > 0) {
    actions.push({ label: "Исправить ошибки", description: `${validation.errors.length} ошибок, ${validation.warnings.length} предупреждений`, onClick: validate })
  }

  if (actions.length === 0 && hasCircuits && validation.errors.length === 0) {
    return (
      <div className="space-y-2">
        <div className="text-xs font-semibold uppercase text-muted-foreground">AI помощник</div>
        <div className="rounded-md border border-primary/25 bg-primary/10 p-3 text-xs">
          Проект готов. Все группы распределены, трассы построены, ошибок нет.
        </div>
      </div>
    )
  }

  if (actions.length === 0) return null

  return (
    <div className="space-y-2">
      <div className="text-xs font-semibold uppercase text-muted-foreground">AI помощник</div>
      <div className="space-y-2 rounded-md border border-primary/25 bg-primary/10 p-2">
        {actions.map(action => (
          <div key={action.label}>
            <Button size="sm" variant="secondary" className="h-8 w-full justify-start text-xs" disabled={action.disabled} onClick={action.onClick}>
              {action.label}
            </Button>
            {action.description && (
              <div className="ml-1 mt-0.5 text-[10px] text-muted-foreground">{action.description}</div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

function LibraryPanel({ query, onQueryChange, category, onCategoryChange, items, onClose }: {
  query: string
  onQueryChange: (q: string) => void
  category: string
  onCategoryChange: (c: string) => void
  items: LibraryItem[]
  onClose: () => void
}) {
  const { addElectricalPoint, recalculate } = useProjectStore()

  const addItem = (item: LibraryItem) => {
    addElectricalPoint({
      type: item.defaultParams.type,
      name: item.nameRu,
      position: { x: 420, y: 320 },
      mountingHeight: item.defaultParams.mountingHeight,
      parameters: { power: item.defaultParams.power ?? 0, ip: item.defaultParams.ip },
    })
    recalculate()
  }

  return (
    <div className="absolute left-4 top-4 z-50 flex max-h-[calc(100%-2rem)] w-[360px] flex-col rounded-md border border-border bg-card shadow-xl">
      <div className="flex items-center justify-between border-b border-border p-3">
        <div>
          <div className="text-sm font-semibold">Библиотека объектов</div>
          <div className="text-xs text-muted-foreground">Выберите конкретный тип точки</div>
        </div>
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="border-b border-border p-3">
        <Input placeholder="Найти розетку, светильник, щит..." value={query} onChange={event => onQueryChange(event.target.value)} />
        <div className="mt-3 flex flex-wrap gap-1.5">
          {LIBRARY_CATEGORIES.map(item => (
            <Button
              key={item.id}
              variant={category === item.id ? "default" : "outline"}
              size="sm"
              className="h-7 text-xs"
              onClick={() => {
                onCategoryChange(item.id)
                onQueryChange("")
              }}
            >
              {item.nameRu}
            </Button>
          ))}
        </div>
      </div>

      <ScrollArea className="min-h-0 flex-1">
        <div className="space-y-1 p-2">
          {items.map(item => (
            <button key={item.id} className="flex w-full items-center gap-3 rounded-md p-2 text-left transition-colors hover:bg-secondary" onClick={() => addItem(item)}>
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary/10 text-xs font-bold text-foreground">{item.icon}</span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium">{item.nameRu}</span>
                <span className="block truncate text-xs text-muted-foreground">{item.description}</span>
              </span>
            </button>
          ))}
          {items.length === 0 && <div className="py-8 text-center text-sm text-muted-foreground">Ничего не найдено</div>}
        </div>
      </ScrollArea>
    </div>
  )
}

export default function ElectricalEditor() {
  const navigate = useNavigate()
  const [authChecked, setAuthChecked] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [hasAccess, setHasAccess] = useState(false)

  useEffect(() => {
    const check = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user) { setAuthChecked(true); return }
      setIsAuthenticated(true)
      const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", session.user.id)
      const userRoles = (roles || []).map(r => r.role)
      setHasAccess(userRoles.some(r => r === 'admin' || r === 'manager' || r === 'technician'))
      setAuthChecked(true)
    }
    check()
  }, [])

  if (!authChecked) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
  }
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-center px-4">
        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-6"><Lock className="h-8 w-8 text-muted-foreground" /></div>
        <h2 className="text-2xl font-bold mb-2">Доступ ограничен</h2>
        <p className="text-muted-foreground mb-6 max-w-md">Проектировщик доступен только авторизованным пользователям. Войдите в систему, чтобы продолжить.</p>
        <Button onClick={() => navigate("/auth")}>Войти в систему</Button>
      </div>
    )
  }
  if (!hasAccess) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-center px-4">
        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-6"><Lock className="h-8 w-8 text-muted-foreground" /></div>
        <h2 className="text-2xl font-bold mb-2">Недостаточно прав</h2>
        <p className="text-muted-foreground mb-6 max-w-md">Проектировщик доступен администраторам, менеджерам и электрикам.</p>
        <Button variant="outline" onClick={() => navigate("/dashboard")}>Вернуться в личный кабинет</Button>
      </div>
    )
  }

  return <ElectricalEditorContent />
}

function FieldGroup({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="space-y-2">
      <div className="text-xs font-semibold uppercase text-muted-foreground">{title}</div>
      <div className="space-y-3 rounded-md border border-border p-3">{children}</div>
    </div>
  )
}

function TextField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <Input className="h-8" value={value} onChange={event => onChange(event.target.value)} />
    </div>
  )
}

function NumberField({ label, value, onChange, disabled }: { label: string; value: number; onChange?: (value: number) => void; disabled?: boolean }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <Input
        className="h-8"
        type="number"
        value={Number.isFinite(value) ? value : 0}
        disabled={disabled}
        onChange={event => onChange?.(Number(event.target.value))}
      />
    </div>
  )
}

function SelectField({ label, value, items, onChange }: { label: string; value: string; items: ReadonlyArray<readonly [string, string]>; onChange: (value: string) => void }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="h-8">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {items.map(([itemValue, label]) => (
            <SelectItem key={itemValue} value={itemValue}>{label}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

function InfoBlock({ title, rows }: { title: string; rows: Array<[string, string | number | unknown]> }) {
  return (
    <div className="space-y-2">
      <div className="text-xs font-semibold uppercase text-muted-foreground">{title}</div>
      <div className="space-y-2 rounded-md border border-border p-3">
        {rows.map(([label, value]) => (
          <div key={label} className="flex justify-between gap-3 text-sm">
            <span className="min-w-0 truncate text-muted-foreground">{label}</span>
            <span className="shrink-0 font-medium">{String(value)}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-md border border-border bg-secondary/35 p-3">
      <div className="text-[11px] uppercase text-muted-foreground">{label}</div>
      <div className="mt-1 text-lg font-semibold">{value}</div>
    </div>
  )
}

function pointType(value: string): string {
  return ({
    outlet: "Розетка",
    outlet_waterproof: "Розетка IP44",
    outlet_triple: "Тройная розетка",
    switch: "Выключатель",
    switch_pass_through: "Проходной выключатель",
    dimmer: "Диммер",
    light_ceiling: "Потолочный светильник",
    light_wall: "Бра",
    light_spot: "Точечный светильник",
    light_strip: "Светодиодная лента",
    sensor_motion: "Датчик движения",
    sensor_smoke: "Датчик дыма",
    sensor_leak: "Датчик протечки",
    thermostat: "Термостат",
    panel: "Щит",
    junction_box: "Распределительная коробка",
    appliance_stove: "Электроплита",
    appliance_boiler: "Бойлер",
    appliance_ac: "Кондиционер",
    appliance_washing_machine: "Стиральная машина",
    appliance_dishwasher: "Посудомоечная машина",
    appliance_oven: "Духовой шкаф",
    appliance_fridge: "Холодильник",
  } as Record<string, string>)[value] ?? value
}

function defaultPower(value: string): number {
  return ({
    outlet: 500,
    outlet_waterproof: 700,
    outlet_triple: 1500,
    light_ceiling: 80,
    light_wall: 60,
    light_spot: 15,
    light_strip: 120,
    appliance_stove: 7000,
    appliance_boiler: 2000,
    appliance_washing_machine: 2000,
    appliance_dishwasher: 2000,
    appliance_oven: 3000,
    appliance_fridge: 150,
  } as Record<string, number>)[value] ?? 0
}
