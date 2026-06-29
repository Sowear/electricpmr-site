import { useProjectStore } from "@/stores/projectStore"
import type { Window } from "@/engine/types/geometry"
import { FieldGroup, NumberField } from "../fields"

export function WindowEditor({ windowItem }: { windowItem: Window }) {
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
