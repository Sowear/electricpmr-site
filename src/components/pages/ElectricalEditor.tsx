import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useNavigate } from "react-router-dom"
import { useProjectStore } from "@/stores/projectStore"
import { CanvasEngine } from "@/engine/canvas/CanvasEngine"
import { initAutoLayout, updateAutoLayoutData } from "@/engine/core/autoLayout"
import { downloadPDF } from "@/engine/persistence/pdfExport"
import { generateDXF, downloadDXF } from "@/engine/persistence/dxfExport"
import { UXRecorder } from "@/engine/analytics/uxRecorder"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  FilePlus2, Save, Undo2, Redo2, Search, Square, Sparkles, Upload, Download, Loader2, Lock,
  Grid3X3, Magnet, Zap, ShieldCheck,
} from "lucide-react"
import { getLibraryByCategory, searchLibrary } from "@/engine/library"
import { useUserRole } from "@/hooks/useUserRole"
import { ErrorBoundary } from "@/components/editor/ErrorBoundary"
import { TOOLS } from "@/components/editor/helpers"
import { ToolGroup, ToolButton, RailButton, HeaderButton, WorkflowPills } from "@/components/editor/toolbar"
import { LibraryPanel } from "@/components/editor/panels/LibraryPanel"
import { ExplainModePanel } from "@/components/editor/panels/ExplainModePanel"
import { PropertiesPanel } from "@/components/editor/panels/PropertiesPanel"
import type { Tool } from "@/components/editor/helpers"

export default function ElectricalEditor() {
  const navigate = useNavigate()
  const { isAdmin, isManager, isTechnician, isLoading: roleLoading } = useUserRole()
  const hasAccess = isAdmin || isManager || isTechnician

  if (roleLoading) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
  }
  if (!roleLoading && !hasAccess) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-center px-4">
        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-6"><Lock className="h-8 w-8 text-muted-foreground" /></div>
        <h2 className="text-2xl font-bold mb-2">Доступ ограничен</h2>
        <p className="text-muted-foreground mb-6 max-w-md">Проектировщик доступен администраторам, менеджерам и электрикам.</p>
        <Button variant="outline" onClick={() => navigate("/dashboard")}>Вернуться в личный кабинет</Button>
      </div>
    )
  }

  return (
    <ErrorBoundary>
      <ElectricalEditorContent />
    </ErrorBoundary>
  )
}

function ElectricalEditorContent() {
  const name = useProjectStore(s => s.name)
  const phase = useProjectStore(s => s.phase)
  const scene = useProjectStore(s => s.scene)
  const electrical = useProjectStore(s => s.electrical)
  const validation = useProjectStore(s => s.validation)
  const ui = useProjectStore(s => s.ui)
  const undoStack = useProjectStore(s => s.undoStack)
  const redoStack = useProjectStore(s => s.redoStack)
  const explainedCircuit = useProjectStore(s => s.explainedCircuit)
  const setActiveTool = useProjectStore(s => s.setActiveTool)
  const toggleGrid = useProjectStore(s => s.toggleGrid)
  const toggleSnap = useProjectStore(s => s.toggleSnap)
  const recalculate = useProjectStore(s => s.recalculate)
  const validate = useProjectStore(s => s.validate)
  const detectRooms = useProjectStore(s => s.detectRooms)
  const runAIProject = useProjectStore(s => s.runAIProject)
  const undo = useProjectStore(s => s.undo)
  const redo = useProjectStore(s => s.redo)
  const saveProject = useProjectStore(s => s.saveProject)
  const loadSavedProject = useProjectStore(s => s.loadSavedProject)
  const importProject = useProjectStore(s => s.importProject)
  const clearProject = useProjectStore(s => s.clearProject)
  const explainCircuit = useProjectStore(s => s.explainCircuit)
  const setExplainedCircuit = useProjectStore(s => s.setExplainedCircuit)
  const autoPlace = useProjectStore(s => s.autoPlace)

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

  const handleNewProject = useCallback(() => {
    if (scene.walls.length > 0 || electrical.points.length > 0) {
      if (!window.confirm("Создать новый проект? Текущий проект будет сохранён в библиотеку.")) return
      saveProject()
    }
    clearProject()
  }, [scene.walls.length, electrical.points.length, saveProject, clearProject])

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

  const hasUnsavedChanges = ui.lastSavedAt ? new Date().getTime() - new Date(ui.lastSavedAt).getTime() > 10000 : true

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
              {hasUnsavedChanges && (
                <span className="h-2 w-2 rounded-full bg-yellow-500" title="Есть несохранённые изменения" />
              )}
            </div>
            <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
              <span>Trust Score {trustScore}%</span>
              <span>•</span>
              <span>{ui.lastSavedAt ? `Автосохранено ${new Date(ui.lastSavedAt).toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })}` : "Ожидает первого сохранения"}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <HeaderButton label="Новый проект" icon={FilePlus2} onClick={handleNewProject} />
            <HeaderButton label="Сохранить" icon={Save} onClick={() => { saveProject(); UXRecorder.track("save") }} />
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
