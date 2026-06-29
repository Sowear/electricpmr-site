import { useState } from "react"
import { Button } from "@/components/ui/button"
import { useProjectStore } from "@/stores/projectStore"
import { UXRecorder } from "@/engine/analytics/uxRecorder"
import { StatCard, InfoBlock } from "../fields"
import { cableLabel, breakerLabel } from "../helpers"
import { FurnitureActions } from "./FurnitureActions"
import { ProjectLibraryActions } from "./ProjectLibraryActions"
import { AIAssistantActions } from "./AIAssistantActions"

export function ProjectInfo({ trustScore }: { trustScore: number }) {
  const scene = useProjectStore(state => state.scene)
  const electrical = useProjectStore(state => state.electrical)
  const validation = useProjectStore(state => state.validation)
  const addFurniture = useProjectStore(state => state.addFurniture)
  const saveToCloud = useProjectStore(state => state.saveToCloud)
  const loadFromCloud = useProjectStore(state => state.loadFromCloud)
  const listCloudProjects = useProjectStore(state => state.listCloudProjects)
  const cloudSyncing = useProjectStore(state => state.cloudSyncing)
  const lastSyncedAt = useProjectStore(state => state.lastSyncedAt)
  const generateBOM = useProjectStore(state => state.generateBOM)
  const getPanelSchedule = useProjectStore(state => state.getPanelSchedule)
  const getCableJournal = useProjectStore(state => state.getCableJournal)
  const hasPanel = electrical.points.some(point => point.type === "panel")
  const totalCableLength = electrical.cables.reduce((sum, cable) => sum + cable.length, 0)
  const [cloudProjects, setCloudProjects] = useState<Array<{ id: string; name: string; updated_at: string }>>([])
  const [showCloud, setShowCloud] = useState(false)
  const [showBOM, setShowBOM] = useState(false)
  const [showPanelSchedule, setShowPanelSchedule] = useState(false)
  const [showCableJournal, setShowCableJournal] = useState(false)
  const [uxMetrics, setUxMetrics] = useState(() => UXRecorder.getMetrics())

  const handleLoadCloud = async () => {
    const list = await listCloudProjects()
    setCloudProjects(list)
    setShowCloud(!showCloud)
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-2">
        <StatCard label="Стены" value={scene.walls.length} />
        <StatCard label="Проемы" value={scene.doors.length + scene.windows.length} />
        <StatCard label="Комнаты" value={scene.rooms.length} />
        <StatCard label="Точки" value={electrical.points.length} />
        <StatCard label="Trust" value={`${trustScore}%`} />
        <StatCard label="Сессия" value={`${Math.round(uxMetrics.sessionDuration)}с`} />
        <StatCard label="Действий" value={uxMetrics.totalEvents} />
      </div>

      <ProjectLibraryActions />
      <FurnitureActions onAdd={(type, name, width, height) => addFurniture(type, name, { x: 520, y: 420 }, width, height)} />
      <AIAssistantActions />

      {scene.rooms.length > 0 && (
        <InfoBlock title="Комнаты" rows={scene.rooms.slice(0, 5).map((room, index) => [`${index + 1}. ${room.name} (${room.type})`, `${room.area.toFixed(1)} м²`])} />
      )}

      <InfoBlock
        title="Расчет"
        rows={[
          ["Щит", hasPanel ? "Установлен" : "Не установлен"],
          ["Мощность", `${electrical.totalLoad.totalPower.toFixed(0)} Вт`],
          ["Ток", `${electrical.totalLoad.totalCurrent.toFixed(1)} А`],
          ["Кабельных трасс", electrical.cables.length],
          ["Длина кабелей", `${totalCableLength.toFixed(1)} м`],
          ["Ошибки", validation.errors.length],
        ]}
      />

      {electrical.phaseBalance && (
        <InfoBlock
          title="Баланс фаз"
          rows={[
            ["L1", `${electrical.phaseBalance.L1.effectiveCurrent.toFixed(1)} А`],
            ["L2", `${electrical.phaseBalance.L2.effectiveCurrent.toFixed(1)} А`],
            ["L3", `${electrical.phaseBalance.L3.effectiveCurrent.toFixed(1)} А`],
            ["Отклонение", `${(electrical.phaseBalance.maxDeviation * 100).toFixed(0)}%`],
          ]}
        />
      )}

      {electrical.circuits.length > 0 && (
        <div className="space-y-2">
          <div className="text-xs font-semibold uppercase text-muted-foreground">Группы</div>
          {electrical.circuits.map(circuit => (
            <div key={circuit.id} className="rounded-md border border-border p-3">
              <div className="flex items-center justify-between gap-2">
                <span className="truncate text-sm font-medium">{circuit.name}</span>
                <span className="rounded bg-secondary px-1.5 py-0.5 text-[11px] text-muted-foreground">L{circuit.phase}</span>
              </div>
              <div className="mt-2 grid grid-cols-3 gap-2 text-xs text-muted-foreground">
                <span>{circuit.points.length} точ.</span>
                <span>{Math.round(circuit.load.totalPower)} Вт</span>
                <span>{circuit.load.totalCurrent.toFixed(1)} А</span>
              </div>
              <div className="mt-2 text-xs text-muted-foreground">
                {cableLabel(circuit.cableId)} · {breakerLabel(circuit.breakerId)}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="space-y-2">
        <div className="text-xs font-semibold uppercase text-muted-foreground">Проверка</div>
        {validation.errors.length === 0 && validation.warnings.length === 0 ? (
          <div className="rounded-md border border-primary/25 bg-primary/10 p-3 text-sm">Критических замечаний нет.</div>
        ) : (
          [...validation.errors, ...validation.warnings].slice(0, 6).map(issue => (
            <div key={issue.id} className={`rounded-md border p-2 text-xs ${issue.severity === "error" ? "border-destructive/30 bg-destructive/10" : "border-yellow-500/30 bg-yellow-500/10"}`}>
              {issue.message}
            </div>
          ))
        )}
      </div>

      {electrical.circuits.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="text-xs font-semibold uppercase text-muted-foreground">Спецификация (BOM)</div>
            <Button size="sm" variant="ghost" className="h-6 px-2 text-xs" onClick={() => setShowBOM(!showBOM)}>
              {showBOM ? "Свернуть" : "Показать"}
            </Button>
          </div>
          {showBOM && (() => {
            const bom = generateBOM()
            const totalCost = bom.reduce((sum, item) => sum + item.estimatedCost * item.quantity, 0)
            return (
              <div className="space-y-1 rounded-md border border-border p-2">
                {bom.map((item, index) => (
                  <div key={index} className="flex items-center justify-between text-xs">
                    <div className="flex-1 min-w-0">
                      <div className="truncate font-medium">{item.name}</div>
                      <div className="text-[10px] text-muted-foreground">{item.specification}</div>
                    </div>
                    <div className="text-right">
                      <div>{item.quantity} {item.unit}</div>
                      <div className="text-[10px] text-muted-foreground">{item.estimatedCost * item.quantity} ₽</div>
                    </div>
                  </div>
                ))}
                <div className="border-t border-border pt-1 text-xs font-semibold">
                  Итого: ~{totalCost.toLocaleString("ru-RU")} ₽
                </div>
              </div>
            )
          })()}
        </div>
      )}

      {electrical.circuits.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="text-xs font-semibold uppercase text-muted-foreground">Схема щита</div>
            <Button size="sm" variant="ghost" className="h-6 px-2 text-xs" onClick={() => setShowPanelSchedule(!showPanelSchedule)}>
              {showPanelSchedule ? "Свернуть" : "Показать"}
            </Button>
          </div>
          {showPanelSchedule && (() => {
            const schedule = getPanelSchedule()
            return (
              <div className="space-y-1 rounded-md border border-border p-2 text-xs">
                <div className="font-medium">{schedule.panelName} — {schedule.mainBreaker.model}</div>
                <div className="text-muted-foreground">Нагрузка: {schedule.summary.totalCurrent.toFixed(1)}А / {schedule.mainBreaker.rating}А ({schedule.summary.utilizationPercent}%)</div>
                <div className="text-muted-foreground">Баланс фаз: {schedule.summary.phaseBalance}%</div>
                <div className="mt-2 space-y-1">
                  {schedule.circuits.map(c => (
                    <div key={c.circuitNumber} className="flex items-center justify-between border-t border-border pt-1">
                      <span>{c.circuitNumber}. {c.circuitName}</span>
                      <span className="text-muted-foreground">{c.breakerModel} · {c.power}Вт · L{c.phase}</span>
                    </div>
                  ))}
                </div>
              </div>
            )
          })()}
        </div>
      )}

      {electrical.circuits.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="text-xs font-semibold uppercase text-muted-foreground">Кабельный журнал</div>
            <Button size="sm" variant="ghost" className="h-6 px-2 text-xs" onClick={() => setShowCableJournal(!showCableJournal)}>
              {showCableJournal ? "Свернуть" : "Показать"}
            </Button>
          </div>
          {showCableJournal && (() => {
            const journal = getCableJournal()
            return (
              <div className="space-y-1 rounded-md border border-border p-2 text-xs">
                <div className="text-muted-foreground">Длина: {journal.summary.totalLengthWithReserve}м · Стоимость: ~{journal.summary.totalCost.toLocaleString("ru-RU")}₽</div>
                {journal.summary.cablesOverloaded > 0 && <div className="text-destructive">Перегрузка: {journal.summary.cablesOverloaded} кабелей</div>}
                {journal.summary.cablesOverVoltageDrop > 0 && <div className="text-yellow-600">Потери {'>'}5%: {journal.summary.cablesOverVoltageDrop} кабелей</div>}
                <div className="mt-2 space-y-1">
                  {journal.rows.map(r => (
                    <div key={r.circuitNumber} className="flex items-center justify-between border-t border-border pt-1">
                      <span>{r.circuitNumber}. {r.circuitName}</span>
                      <span className="text-muted-foreground">{r.cableLabel} · {r.lengthWithReserve}м · {r.voltageDrop}%</span>
                    </div>
                  ))}
                </div>
              </div>
            )
          })()}
        </div>
      )}

      <div className="space-y-2">
        <div className="text-xs font-semibold uppercase text-muted-foreground">Облако</div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" className="h-8 flex-1 text-xs" disabled={cloudSyncing} onClick={async () => { await saveToCloud() }}>
            {cloudSyncing ? "Синхронизация..." : "Сохранить в облако"}
          </Button>
          <Button size="sm" variant="outline" className="h-8 flex-1 text-xs" disabled={cloudSyncing} onClick={handleLoadCloud}>
            Загрузить
          </Button>
        </div>
        {lastSyncedAt && (
          <div className="text-[10px] text-muted-foreground">
            Последняя синхронизация: {new Date(lastSyncedAt).toLocaleString("ru-RU")}
          </div>
        )}
        {showCloud && cloudProjects.length > 0 && (
          <div className="space-y-1 rounded-md border border-border p-2">
            {cloudProjects.map(p => (
              <div key={p.id} className="flex items-center justify-between gap-2 rounded-md border border-border bg-background p-2">
                <div className="flex-1 min-w-0">
                  <div className="truncate text-xs font-medium">{p.name}</div>
                  <div className="text-[10px] text-muted-foreground">
                    {new Date(p.updated_at).toLocaleDateString("ru-RU")}
                  </div>
                </div>
                <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => loadFromCloud(p.id)}>
                  Открыть
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
