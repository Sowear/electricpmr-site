import { useState } from "react"
import { Button } from "@/components/ui/button"
import { useProjectStore } from "@/stores/projectStore"
import { UXRecorder } from "@/engine/analytics/uxRecorder"

export function ProjectLibraryActions() {
  const saveProject = useProjectStore(state => state.saveProject)
  const listProjects = useProjectStore(state => state.listProjects)
  const loadProjectById = useProjectStore(state => state.loadProjectById)
  const duplicateProject = useProjectStore(state => state.duplicateProject)
  const deleteProject = useProjectStore(state => state.deleteProject)
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
