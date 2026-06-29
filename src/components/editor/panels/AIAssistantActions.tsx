import { Button } from "@/components/ui/button"
import { useProjectStore } from "@/stores/projectStore"

export function AIAssistantActions() {
  const scene = useProjectStore(state => state.scene)
  const electrical = useProjectStore(state => state.electrical)
  const validation = useProjectStore(state => state.validation)
  const detectRooms = useProjectStore(state => state.detectRooms)
  const runAIProject = useProjectStore(state => state.runAIProject)
  const validate = useProjectStore(state => state.validate)
  const autoGroupCircuits = useProjectStore(state => state.autoGroupCircuits)
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
