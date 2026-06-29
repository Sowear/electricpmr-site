import { useProjectStore } from "@/stores/projectStore"
import type { GeometryObject } from "@/engine/types/geometry"
import { FieldGroup, TextField, NumberField, SelectField, InfoBlock } from "../fields"

export function FurnitureEditor({ object }: { object: GeometryObject }) {
  const updateObject = useProjectStore(state => state.updateObject)
  return (
    <>
      <FieldGroup title="Мебель и контекст">
        <TextField label="Название" value={object.name} onChange={value => updateObject(object.id, { name: value })} />
        <SelectField label="Тип" value={object.type} onChange={value => updateObject(object.id, { type: value })} items={[
          ["sofa", "Диван"],
          ["bed", "Кровать"],
          ["kitchen", "Кухня"],
          ["tv", "TV"],
          ["fridge", "Холодильник"],
          ["desk", "Стол"],
          ["wardrobe", "Шкаф"],
        ]} />
        <NumberField label="Ширина, мм" value={object.width} onChange={value => updateObject(object.id, { width: value })} />
        <NumberField label="Глубина, мм" value={object.height} onChange={value => updateObject(object.id, { height: value })} />
      </FieldGroup>
      <InfoBlock title="Координаты" rows={[["X", Math.round(object.position.x)], ["Y", Math.round(object.position.y)]]} />
    </>
  )
}
