import type { ReactNode } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export function FieldGroup({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="space-y-2">
      <div className="text-xs font-semibold uppercase text-muted-foreground">{title}</div>
      <div className="space-y-3 rounded-md border border-border p-3">{children}</div>
    </div>
  )
}

export function TextField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <Input className="h-8" value={value} onChange={event => onChange(event.target.value)} />
    </div>
  )
}

export function NumberField({ label, value, onChange, disabled }: { label: string; value: number; onChange?: (value: number) => void; disabled?: boolean }) {
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

export function SelectField({ label, value, items, onChange }: { label: string; value: string; items: ReadonlyArray<readonly [string, string]>; onChange: (value: string) => void }) {
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

export function InfoBlock({ title, rows }: { title: string; rows: Array<[string, string | number | unknown]> }) {
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

export function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-md border border-border bg-secondary/35 p-3">
      <div className="text-[11px] uppercase text-muted-foreground">{label}</div>
      <div className="mt-1 text-lg font-semibold">{value}</div>
    </div>
  )
}
