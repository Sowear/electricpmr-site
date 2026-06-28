// ============================================================
// ElectricPMR — PDF Export
// ============================================================
//
// Generates a PDF snapshot of the project with:
// - Project metadata
// - Circuit summary
// - BOM (Bill of Materials)
// - Validation results
// - Version/checksum for traceability
// ============================================================

import { jsPDF } from "jspdf"
import type { ProjectState } from "../../stores/projectStore"

type PersistedProject = Pick<ProjectState,
  "id" | "name" | "description" | "type" | "phase" | "status" | "scene" | "electrical" | "validation" | "aiState"
>

const ENGINE_VERSION = "0.2.0"
const RULE_VERSION = "ПУЭ 7 / СП 256"

function checksum(data: string): string {
  let hash = 0
  for (let i = 0; i < data.length; i++) {
    const char = data.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash |= 0
  }
  return Math.abs(hash).toString(16).padStart(8, "0")
}

export function generatePDF(state: PersistedProject): jsPDF {
  const doc = new jsPDF({ unit: "mm", format: "a4" })
  const pageWidth = 210
  const margin = 15
  let y = 20

  const addLine = () => {
    doc.setDrawColor(200, 200, 200)
    doc.line(margin, y, pageWidth - margin, y)
    y += 3
  }

  const addText = (text: string, fontSize: number = 10, bold = false) => {
    doc.setFontSize(fontSize)
    doc.setFont("helvetica", bold ? "bold" : "normal")
    doc.text(text, margin, y)
    y += fontSize * 0.5
  }

  // Header
  doc.setFontSize(18)
  doc.setFont("helvetica", "bold")
  doc.text("ElectricPMR — Электропроект", margin, y)
  y += 8

  doc.setFontSize(9)
  doc.setFont("helvetica", "normal")
  doc.setTextColor(128, 128, 128)
  doc.text(`Версия движка: ${ENGINE_VERSION} | Нормативы: ${RULE_VERSION}`, margin, y)
  y += 4
  doc.text(`Время создания: ${new Date().toLocaleString("ru-RU")}`, margin, y)
  y += 4
  doc.text(`Контрольная сумма: ${checksum(JSON.stringify(state))}`, margin, y)
  doc.setTextColor(0, 0, 0)
  y += 8

  addLine()

  // Project Info
  addText("Информация о проекте", 12, true)
  y += 2
  addText(`Название: ${state.name || "Без названия"}`, 9)
  addText(`Описание: ${state.description || "Нет описания"}`, 9)
  addText(`Тип: ${state.type} | Фаза: ${state.phase} | Статус: ${state.status}`, 9)
  addText(`Стен: ${state.scene.walls.length} | Комнат: ${state.scene.rooms.length} | Дверей: ${state.scene.doors.length} | Окон: ${state.scene.windows.length}`, 9)
  y += 4

  addLine()

  // Electrical Summary
  addText("Электрическая нагрузка", 12, true)
  y += 2
  addText(`Точек: ${state.electrical.points.length} | Групп: ${state.electrical.circuits.length} | Кабельных трасс: ${state.electrical.cables.length}`, 9)
  addText(`Суммарная мощность: ${Math.round(state.electrical.totalLoad.totalPower)} Вт`, 9)
  addText(`Суммарный ток: ${state.electrical.totalLoad.totalCurrent.toFixed(1)} А`, 9)
  if (state.electrical.phaseBalance) {
    const pb = state.electrical.phaseBalance
    addText(`Баланс фаз: L1=${pb.L1.effectiveCurrent.toFixed(1)}А L2=${pb.L2.effectiveCurrent.toFixed(1)}А L3=${pb.L3.effectiveCurrent.toFixed(1)}А (${pb.maxDeviation.toFixed(1)}%)`, 9)
  }
  y += 4

  // Circuits
  if (state.electrical.circuits.length > 0) {
    addText("Группы", 12, true)
    y += 2

    doc.setFontSize(8)
    doc.setFont("helvetica", "bold")
    doc.text("Группа", margin, y)
    doc.text("Фаза", margin + 55, y)
    doc.text("Автомат", margin + 70, y)
    doc.text("Кабель", margin + 90, y)
    doc.text("Точек", margin + 120, y)
    doc.text("Мощность", margin + 135, y)
    doc.text("Ток", margin + 155, y)
    y += 4

    doc.setFont("helvetica", "normal")
    for (const circuit of state.electrical.circuits) {
      if (y > 270) {
        doc.addPage()
        y = 20
      }
      doc.text(circuit.name.substring(0, 30), margin, y)
      doc.text(`L${circuit.phase}`, margin + 55, y)
      doc.text(circuit.breakerId ?? "AI", margin + 70, y)
      doc.text((circuit.cableId ?? "AI").substring(0, 20), margin + 90, y)
      doc.text(String(circuit.points.length), margin + 120, y)
      doc.text(`${Math.round(circuit.load.totalPower)} Вт`, margin + 135, y)
      doc.text(`${circuit.load.totalCurrent.toFixed(1)} А`, margin + 155, y)
      y += 4
    }
    y += 4
  }

  addLine()

  // BOM
  if (state.electrical.circuits.length > 0) {
    if (y > 200) {
      doc.addPage()
      y = 20
    }

    addText("Спецификация материалов (BOM)", 12, true)
    y += 2

    doc.setFontSize(8)
    doc.setFont("helvetica", "bold")
    doc.text("Наименование", margin, y)
    doc.text("Кол-во", margin + 80, y)
    doc.text("Ед.", margin + 100, y)
    doc.text("Стоимость", margin + 115, y)
    y += 4

    const bom = generateBOMFromState(state)
    let totalCost = 0
    doc.setFont("helvetica", "normal")
    for (const item of bom) {
      if (y > 270) {
        doc.addPage()
        y = 20
      }
      doc.text(item.name.substring(0, 40), margin, y)
      doc.text(String(item.quantity), margin + 80, y)
      doc.text(item.unit, margin + 100, y)
      doc.text(`${(item.estimatedCost * item.quantity).toLocaleString("ru-RU")} ₽`, margin + 115, y)
      totalCost += item.estimatedCost * item.quantity
      y += 4
    }

    y += 2
    doc.setFont("helvetica", "bold")
    doc.text(`ИТОГО: ~${totalCost.toLocaleString("ru-RU")} ₽`, margin, y)
    y += 6
  }

  addLine()

  // Validation
  if (state.validation.errors.length > 0 || state.validation.warnings.length > 0) {
    if (y > 220) {
      doc.addPage()
      y = 20
    }

    addText("Результаты проверки", 12, true)
    y += 2

    doc.setFontSize(8)
    for (const error of state.validation.errors) {
      doc.setTextColor(200, 0, 0)
      doc.text(`ОШИБКА: ${error.message}`, margin, y)
      y += 4
    }
    for (const warning of state.validation.warnings.slice(0, 10)) {
      doc.setTextColor(200, 150, 0)
      doc.text(`ПРЕДУПРЕЖДЕНИЕ: ${warning.message}`, margin, y)
      y += 4
    }
    doc.setTextColor(0, 0, 0)
    y += 4
  }

  // Footer
  const pageCount = doc.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.setFontSize(7)
    doc.setFont("helvetica", "normal")
    doc.setTextColor(128, 128, 128)
    doc.text(
      `ElectricPMR v${ENGINE_VERSION} | ${state.name || "Проект"} | Стр. ${i}/${pageCount} | ${checksum(JSON.stringify(state))}`,
      margin,
      290
    )
  }

  return doc
}

function generateBOMFromState(state: PersistedProject) {
  const items: Array<{ name: string; quantity: number; unit: string; estimatedCost: number }> = []

  if (state.electrical.points.some(p => p.type === "panel")) {
    items.push({ name: "Распределительный щит", quantity: 1, unit: "шт", estimatedCost: 3500 })
  }

  const breakerCounts = new Map<string, number>()
  state.electrical.circuits.forEach(c => {
    const type = c.breakerId ?? "C16"
    breakerCounts.set(type, (breakerCounts.get(type) ?? 0) + 1)
  })
  breakerCounts.forEach((count, type) => {
    items.push({ name: `Автомат ABB SH200 ${type}`, quantity: count, unit: "шт", estimatedCost: 450 })
  })

  const bathroomCircuits = state.electrical.circuits.filter(c => c.type === "outlets_bathroom")
  if (bathroomCircuits.length > 0) {
    items.push({ name: "УЗО ABB F202 AC-25/30мА", quantity: 1, unit: "шт", estimatedCost: 2800 })
  }

  const totalCableLength = state.electrical.cables.reduce((sum, c) => sum + c.length, 0)
  if (totalCableLength > 0) {
    items.push({ name: "ВВГнг-LS 3x2.5", quantity: Math.round(totalCableLength), unit: "м", estimatedCost: 82 })
  } else if (state.electrical.circuits.length > 0) {
    items.push({ name: "ВВГнг-LS 3x2.5", quantity: state.electrical.circuits.length * 8, unit: "м", estimatedCost: 82 })
  }

  const outletCount = state.electrical.points.filter(p => p.type.startsWith("outlet")).length
  if (outletCount > 0) {
    items.push({ name: "Розетка 220В", quantity: outletCount, unit: "шт", estimatedCost: 350 })
  }

  const switchCount = state.electrical.points.filter(p => p.type === "switch" || p.type === "switch_pass_through").length
  if (switchCount > 0) {
    items.push({ name: "Выключатель", quantity: switchCount, unit: "шт", estimatedCost: 450 })
  }

  return items
}

export function downloadPDF(state: PersistedProject, filename?: string): void {
  const doc = generatePDF(state)
  doc.save(filename ?? `${state.name || "project"}.pdf`)
}
