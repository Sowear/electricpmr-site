import { useProjectStore } from "@/stores/projectStore"
import type { ElectricalPoint } from "@/engine/types/electrical"
import { FieldGroup, TextField, NumberField, SelectField, InfoBlock } from "../fields"
import { POINT_TYPES, pointType, defaultPower } from "../helpers"
import { PanelEngineeringView } from "./PanelEngineeringView"

export function PointEditor2({ point }: { point: ElectricalPoint }) {
  const scene = useProjectStore(state => state.scene)
  const electrical = useProjectStore(state => state.electrical)
  const updateElectricalPoint = useProjectStore(state => state.updateElectricalPoint)
  const power = Number(point.parameters?.power ?? defaultPower(point.type))

  return (
    <>
      <InfoBlock title="AI Проектирование" rows={[
        ["Тип", pointType(point.type)],
        ["Группа", point.circuitId ? point.circuitId.replace("circuit_", "") : "Еще не назначена"],
        ["Привязка", point.parameters?.wallId ? "К стене" : "Свободно"],
      ]} />
      <FieldGroup title={point.type === "panel" ? "Щит" : "Электроточка"}>
        <TextField label="Название" value={point.name} onChange={value => updateElectricalPoint(point.id, { name: value })} />
        <SelectField label="Тип точки" value={point.type} onChange={value => updateElectricalPoint(point.id, { type: value as ElectricalPoint["type"], subtype: value })} items={POINT_TYPES} />
        <SelectField label="Комната" value={point.roomId ?? "none"} onChange={value => updateElectricalPoint(point.id, { roomId: value === "none" ? undefined : value })} items={[["none", "Не назначена"], ...scene.rooms.map(room => [room.id, room.name] as const)]} />
        <SelectField label="Группа" value={point.circuitId ?? "auto"} onChange={value => updateElectricalPoint(point.id, { circuitId: value === "auto" ? undefined : value })} items={[["auto", "AI назначит"], ...electrical.circuits.map(circuit => [circuit.id, circuit.name] as const)]} />
        <NumberField label="Высота монтажа, мм" value={point.mountingHeight} onChange={value => updateElectricalPoint(point.id, { mountingHeight: value })} />
        <NumberField label="Мощность, Вт" value={power} disabled={point.type === "panel" || point.type.includes("switch")} onChange={value => updateElectricalPoint(point.id, { parameters: { ...point.parameters, power: value } })} />
        <SelectField label="Монтаж" value={point.mountingMethod} onChange={value => updateElectricalPoint(point.id, { mountingMethod: value as ElectricalPoint["mountingMethod"] })} items={[
          ["flush", "Встроенный"],
          ["surface", "Накладной"],
          ["recessed", "В нишу"],
        ]} />
      </FieldGroup>
      {point.type === "panel" && <PanelEngineeringView />}
      <InfoBlock title="Координаты" rows={[["X", Math.round(point.position.x)], ["Y", Math.round(point.position.y)]]} />
    </>
  )
}
