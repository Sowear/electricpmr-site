import { Button } from "@/components/ui/button"

export function FurnitureActions({ onAdd }: { onAdd: (type: string, name: string, width: number, height: number) => void }) {
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
