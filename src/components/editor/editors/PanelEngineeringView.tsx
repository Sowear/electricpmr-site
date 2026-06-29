import { Button } from "@/components/ui/button"
import { useProjectStore } from "@/stores/projectStore"
import { InfoBlock } from "../fields"
import { breakerLabel, cableLabel } from "../helpers"

export function PanelEngineeringView() {
  const electrical = useProjectStore(state => state.electrical)
  const setExplainedCircuit = useProjectStore(state => state.setExplainedCircuit)

  if (electrical.circuits.length === 0) {
    return (
      <InfoBlock
        title="Щит"
        rows={[
          ["Группы", "Нет"],
          ["Действие", "Запустите AI Проектирование"],
        ]}
      />
    )
  }

  const totalPower = electrical.circuits.reduce((sum, c) => sum + c.load.totalPower, 0)
  const totalCurrent = electrical.circuits.reduce((sum, c) => sum + c.load.totalCurrent, 0)
  const totalPoints = electrical.circuits.reduce((sum, c) => sum + c.points.length, 0)
  const phases = { 1: 0, 2: 0, 3: 0 }
  electrical.circuits.forEach(c => { phases[c.phase as 1 | 2 | 3] += c.load.effectiveCurrent })
  const maxPhase = Math.max(phases[1], phases[2], phases[3])
  const isUnbalanced = maxPhase > 0 && (Math.max(phases[1], phases[2], phases[3]) - Math.min(phases[1], phases[2], phases[3])) / maxPhase > 0.3

  return (
    <div className="space-y-3">
      <InfoBlock title="Щит — Сводка" rows={[
        ["Групп", electrical.circuits.length],
        ["Точек", totalPoints],
        ["Мощность", `${Math.round(totalPower)} Вт`],
        ["Ток", `${totalCurrent.toFixed(1)} А`],
        ["Фазы", `L1: ${phases[1].toFixed(1)}А · L2: ${phases[2].toFixed(1)}А · L3: ${phases[3].toFixed(1)}А`],
      ]} />

      {isUnbalanced && (
        <div className="rounded-md border border-yellow-500/30 bg-yellow-500/10 p-2 text-xs text-yellow-700">
          Перекос фаз: разница {Math.round((maxPhase - Math.min(phases[1], phases[2], phases[3])) / maxPhase * 100)}%. Рекомендуется распределить потребителей равномернее.
        </div>
      )}

      <div className="space-y-2">
        <div className="text-xs font-semibold uppercase text-muted-foreground">Группы</div>
        {electrical.circuits.map(circuit => (
          <div key={circuit.id} className="rounded-md border border-border p-3 text-xs">
            <div className="flex items-center justify-between gap-2">
              <span className="truncate font-semibold">{circuit.name}</span>
              <div className="flex items-center gap-1">
                <span className="rounded bg-secondary px-1.5 py-0.5">L{circuit.phase}</span>
                <Button size="sm" variant="ghost" className="h-6 px-1.5 text-[10px]" onClick={() => setExplainedCircuit(circuit.id)}>
                  ?
                </Button>
              </div>
            </div>
            <div className="mt-2 grid grid-cols-2 gap-2 text-muted-foreground">
              <span>Автомат: {breakerLabel(circuit.breakerId)}</span>
              <span>Кабель: {cableLabel(circuit.cableId)}</span>
              <span>Точек: {circuit.points.length}</span>
              <span>{Math.round(circuit.load.totalPower)} Вт · {circuit.load.totalCurrent.toFixed(1)} А</span>
            </div>
            {circuit.load.totalCurrent > 16 && (
              <div className="mt-2 text-yellow-600">
                Превышен ток для C16 ({circuit.load.totalCurrent.toFixed(1)}А &gt; 16А)
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
