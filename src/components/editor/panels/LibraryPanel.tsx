import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { X } from "lucide-react"
import { useProjectStore } from "@/stores/projectStore"
import { LIBRARY_CATEGORIES, type LibraryItem } from "@/engine/library"

interface LibraryPanelProps {
  query: string
  onQueryChange: (q: string) => void
  category: string
  onCategoryChange: (c: string) => void
  items: LibraryItem[]
  onClose: () => void
}

export function LibraryPanel({ query, onQueryChange, category, onCategoryChange, items, onClose }: LibraryPanelProps) {
  const addElectricalPoint = useProjectStore(state => state.addElectricalPoint)
  const recalculate = useProjectStore(state => state.recalculate)

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
