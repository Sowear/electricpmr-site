import { useProjectStore } from "@/stores/projectStore"
import { Button } from "@/components/ui/button"
import { Trash2 } from "lucide-react"
import { WallEditor } from "../editors/WallEditor"
import { RoomEditor } from "../editors/RoomEditor"
import { DoorEditor } from "../editors/DoorEditor"
import { WindowEditor } from "../editors/WindowEditor"
import { FurnitureEditor } from "../editors/FurnitureEditor"
import { PointEditor2 } from "../editors/PointEditor2"
import { ProjectInfo } from "./ProjectInfo"

export function PropertiesPanel({ trustScore }: { trustScore: number }) {
  const ui = useProjectStore(state => state.ui)
  const scene = useProjectStore(state => state.scene)
  const electrical = useProjectStore(state => state.electrical)
  const removeWall = useProjectStore(state => state.removeWall)
  const removeRoom = useProjectStore(state => state.removeRoom)
  const removeDoor = useProjectStore(state => state.removeDoor)
  const removeWindow = useProjectStore(state => state.removeWindow)
  const removeElectricalPoint = useProjectStore(state => state.removeElectricalPoint)
  const removeObject = useProjectStore(state => state.removeObject)
  const selectedId = ui.selectedObjectId

  if (!selectedId) return <ProjectInfo trustScore={trustScore} />

  const wall = scene.walls.find(item => item.id === selectedId)
  const room = scene.rooms.find(item => item.id === selectedId)
  const door = scene.doors.find(item => item.id === selectedId)
  const windowItem = scene.windows.find(item => item.id === selectedId)
  const point = electrical.points.find(item => item.id === selectedId)
  const furniture = scene.objects.find(item => item.id === selectedId)
  const obj = wall ?? room ?? door ?? windowItem ?? point ?? furniture
  if (!obj) return <div className="text-sm text-muted-foreground">Объект не найден</div>

  const title = point?.name ?? furniture?.name ?? room?.name ?? (door ? "Дверь" : windowItem ? "Окно" : "Стена")

  const deleteSelected = () => {
    if (wall) removeWall(wall.id)
    if (room) removeRoom(room.id)
    if (door) removeDoor(door.id)
    if (windowItem) removeWindow(windowItem.id)
    if (point) removeElectricalPoint(point.id)
    if (furniture) removeObject(furniture.id)
  }

  return (
    <div className="space-y-4">
      <div className="rounded-md border border-border bg-secondary/35 p-3">
        <div className="text-xs font-medium uppercase text-muted-foreground">Выбранный объект</div>
        <div className="mt-1 truncate text-sm font-semibold">{title}</div>
        <Button variant="destructive" size="sm" className="mt-3 h-8 gap-2" onClick={deleteSelected}>
          <Trash2 className="h-3.5 w-3.5" />
          Удалить
        </Button>
      </div>

      {wall && <WallEditor wall={wall} />}
      {room && <RoomEditor room={room} />}
      {door && <DoorEditor door={door} />}
      {windowItem && <WindowEditor windowItem={windowItem} />}
      {point && <PointEditor2 point={point} />}
      {furniture && <FurnitureEditor object={furniture} />}
    </div>
  )
}
