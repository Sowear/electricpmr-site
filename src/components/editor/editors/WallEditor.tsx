import { useProjectStore } from "@/stores/projectStore"
import type { Wall } from "@/engine/types/geometry"
import { FieldGroup, NumberField, SelectField, InfoBlock } from "../fields"

export function WallEditor({ wall }: { wall: Wall }) {
  const updateWall = useProjectStore(state => state.updateWall)
  const length = Math.round(Math.hypot(wall.points[1].x - wall.points[0].x, wall.points[1].y - wall.points[0].y))

  return (
    <>
      <InfoBlock title="Геометрия" rows={[["Длина", `${length} мм`], ["X1", Math.round(wall.points[0].x)], ["Y1", Math.round(wall.points[0].y)], ["X2", Math.round(wall.points[1].x)], ["Y2", Math.round(wall.points[1].y)]]} />
      <FieldGroup title="Свойства стены">
        <NumberField label="Толщина, мм" value={wall.thickness} onChange={value => updateWall(wall.id, { thickness: value })} />
        <NumberField label="Высота, мм" value={wall.height} onChange={value => updateWall(wall.id, { height: value })} />
        <SelectField label="Материал" value={wall.material} onChange={value => updateWall(wall.id, { material: value as Wall["material"] })} items={[
          ["brick", "Кирпич"],
          ["concrete", "Бетон"],
          ["drywall", "Гипсокартон"],
          ["aerated_concrete", "Газобетон"],
          ["wood", "Дерево"],
        ]} />
      </FieldGroup>
    </>
  )
}
