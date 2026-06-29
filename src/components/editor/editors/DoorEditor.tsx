import { useProjectStore } from "@/stores/projectStore"
import type { Door } from "@/engine/types/geometry"
import { FieldGroup, NumberField, SelectField } from "../fields"

export function DoorEditor({ door }: { door: Door }) {
  const updateDoor = useProjectStore(state => state.updateDoor)
  return (
    <FieldGroup title="Дверь">
      <NumberField label="Положение на стене, %" value={Math.round(door.position * 100)} disabled />
      <NumberField label="Ширина, мм" value={door.width} onChange={value => updateDoor(door.id, { width: value })} />
      <NumberField label="Высота, мм" value={door.height} onChange={value => updateDoor(door.id, { height: value })} />
      <SelectField label="Тип" value={door.type} onChange={value => updateDoor(door.id, { type: value as Door["type"] })} items={[
        ["single", "Одинарная"],
        ["double", "Двойная"],
        ["sliding", "Раздвижная"],
        ["entrance", "Входная"],
        ["bathroom", "Санузел"],
      ]} />
    </FieldGroup>
  )
}
