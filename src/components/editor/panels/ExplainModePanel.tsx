import { Button } from "@/components/ui/button"
import type { CircuitExplanation } from "@/stores/projectStore"

export function ExplainModePanel({ explanation, onClose }: { explanation: CircuitExplanation; onClose: () => void }) {
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
