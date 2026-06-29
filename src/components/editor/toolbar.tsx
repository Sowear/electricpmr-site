import { type ElementType, type ReactNode } from "react"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { Check } from "lucide-react"
import { TOOLS } from "./helpers"

export function ToolGroup({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="space-y-2 p-3">
      <div className="px-1 text-[10px] font-semibold uppercase tracking-wide text-sidebar-foreground/55">{title}</div>
      <div className="flex flex-col gap-1">{children}</div>
    </div>
  )
}

export function ToolButton({ tool, active, onClick }: { tool: typeof TOOLS[number]; active: boolean; onClick: () => void }) {
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

export function RailButton({ icon: Icon, active, label, onClick }: { icon: ElementType; active: boolean; label: string; onClick: () => void }) {
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

export function HeaderButton({ label, icon: Icon, onClick, disabled, active }: { label: string; icon: ElementType; onClick: () => void; disabled?: boolean; active?: boolean }) {
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

export function WorkflowPills({ walls, openings, rooms, points, panels, circuits, routes, errors }: { walls: number; openings: number; rooms: number; points: number; panels: number; circuits: number; routes: number; errors: number }) {
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
