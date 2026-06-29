import { useProjectStore } from "@/stores/projectStore"
import type { Room } from "@/engine/types/geometry"
import { FieldGroup, TextField, NumberField, SelectField, InfoBlock } from "../fields"
import { ROOM_TYPES } from "../helpers"

export function RoomEditor({ room }: { room: Room }) {
  const updateRoom = useProjectStore(state => state.updateRoom)

  return (
    <>
      <InfoBlock title="Параметры" rows={[["Площадь", `${room.area.toFixed(1)} м²`], ["Периметр", `${room.perimeter.toFixed(1)} м`], ["Объем", `${room.volume.toFixed(1)} м³`]]} />
      <FieldGroup title="Комната">
        <TextField label="Название" value={room.name} onChange={value => updateRoom(room.id, { name: value })} />
        <SelectField label="Тип помещения" value={room.type} onChange={value => updateRoom(room.id, { type: value as Room["type"] })} items={ROOM_TYPES} />
        <NumberField label="Высота потолка, мм" value={room.ceilingHeight} onChange={value => updateRoom(room.id, { ceilingHeight: value })} />
      </FieldGroup>
    </>
  )
}
