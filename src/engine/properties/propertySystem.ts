// ============================================================
// ElectricPMR — Property System (универсальная панель свойств)
// ============================================================
//
// Любой объект автоматически отображает свои свойства
// без написания отдельного UI для каждого типа.
// ============================================================

// ============================================================
// ТИПЫ ПОЛЕЙ
// ============================================================

export type PropertyFieldType =
  | "text"
  | "number"
  | "select"
  | "boolean"
  | "color"
  | "position"
  | "readonly"
  | "separator"

export interface PropertyField {
  key: string
  label: string
  type: PropertyFieldType
  value: unknown
  options?: Array<{ value: string | number; label: string }>
  min?: number
  max?: number
  step?: number
  unit?: string
  description?: string
  group?: string
  required?: boolean
  editable?: boolean
}

export interface PropertyGroup {
  name: string
  label: string
  fields: PropertyField[]
}

// ============================================================
// ПРОВАЙДЕР СВОЙСТВ ДЛЯ КАЖДОГО ТИПА ОБЪЕКТА
// ============================================================

export function getObjectProperties(object: Record<string, unknown>): PropertyGroup[] {
  const type = object.type as string

  // Определяем категорию по типу
  if (isWall(type)) return getWallProperties(object)
  if (isDoor(type)) return getDoorProperties(object)
  if (isWindow(type)) return getWindowProperties(object)
  if (isElectricalPoint(type)) return getElectricalPointProperties(object)
  if (isPanel(type)) return getPanelProperties(object)
  if (isCircuit(type)) return getCircuitProperties(object)

  return getGenericProperties(object)
}

// ============================================================
// СТЕНЫ
// ============================================================

function isWall(type: string): boolean {
  return type === "wall" || type === "brick" || type === "concrete" || type === "drywall" || type === "wood"
}

function getWallProperties(obj: Record<string, unknown>): PropertyGroup[] {
  return [
    {
      name: "geometry",
      label: "Геометрия",
      fields: [
        { key: "thickness", label: "Толщина", type: "number", value: obj.thickness ?? 200, min: 50, max: 1000, step: 10, unit: "мм", group: "geometry" },
        { key: "height", label: "Высота", type: "number", value: obj.height ?? 2700, min: 2000, max: 6000, step: 10, unit: "мм", group: "geometry" },
        { key: "material", label: "Материал", type: "select", value: obj.material ?? "brick", options: [
          { value: "brick", label: "Кирпич" },
          { value: "concrete", label: "Бетон" },
          { value: "drywall", label: "Гипсокартон" },
          { value: "wood", label: "Дерево" },
          { value: "glass", label: "Стекло" },
          { value: "stone", label: "Камень" },
          { value: "aerated_concrete", label: "Газобетон" },
        ], group: "geometry" },
        { key: "isExternal", label: "Наружная", type: "boolean", value: obj.isExternal ?? false, group: "geometry" },
        { key: "floor", label: "Этаж", type: "number", value: obj.floor ?? 1, min: 1, max: 100, group: "geometry" },
      ],
    },
    {
      name: "position",
      label: "Позиция",
      fields: [
        { key: "x1", label: "X1", type: "number", value: (obj.points as [{ x: number }, { x: number }])?.[0]?.x ?? 0, unit: "мм", group: "position" },
        { key: "y1", label: "Y1", type: "number", value: (obj.points as [{ y: number }, { y: number }])?.[0]?.y ?? 0, unit: "мм", group: "position" },
        { key: "x2", label: "X2", type: "number", value: (obj.points as [{ x: number }, { x: number }])?.[1]?.x ?? 0, unit: "мм", group: "position" },
        { key: "y2", label: "Y2", type: "number", value: (obj.points as [{ y: number }, { y: number }])?.[1]?.y ?? 0, unit: "мм", group: "position" },
        { key: "_length", label: "Длина", type: "readonly", value: calculateWallLength(obj), unit: "мм", group: "position" },
      ],
    },
  ]
}

// ============================================================
// ДВЕРИ
// ============================================================

function isDoor(type: string): boolean {
  return type === "door" || type === "single" || type === "double" || type === "sliding" || type === "entrance"
}

function getDoorProperties(obj: Record<string, unknown>): PropertyGroup[] {
  return [
    {
      name: "geometry",
      label: "Параметры",
      fields: [
        { key: "width", label: "Ширина", type: "number", value: obj.width ?? 800, min: 500, max: 2000, step: 50, unit: "мм" },
        { key: "height", label: "Высота", type: "number", value: obj.height ?? 2100, min: 1800, max: 2500, step: 50, unit: "мм" },
        { key: "type", label: "Тип", type: "select", value: obj.type ?? "single", options: [
          { value: "single", label: "Одинарная" },
          { value: "double", label: "Двойная" },
          { value: "sliding", label: "Раздвижная" },
          { value: "entrance", label: "Входная" },
          { value: "fire", label: "Противопожарная" },
          { value: "bathroom", label: "Для ванной" },
        ]},
        { key: "swing", label: "Открывание", type: "select", value: obj.swing ?? "left", options: [
          { value: "left", label: "Влево" },
          { value: "right", label: "Вправо" },
          { value: "sliding", label: "Раздвижная" },
          { value: "none", label: "Нет" },
        ]},
        { key: "position", label: "Позиция на стене", type: "number", value: obj.position ?? 0.5, min: 0, max: 1, step: 0.01 },
      ],
    },
  ]
}

// ============================================================
// ОКНА
// ============================================================

function isWindow(type: string): boolean {
  return type === "window" || type === "standard" || type === "balcony" || type === "bay" || type === "skylight" || type === "fixed"
}

function getWindowProperties(obj: Record<string, unknown>): PropertyGroup[] {
  return [
    {
      name: "geometry",
      label: "Параметры",
      fields: [
        { key: "width", label: "Ширина", type: "number", value: obj.width ?? 1200, min: 400, max: 3000, step: 50, unit: "мм" },
        { key: "height", label: "Высота", type: "number", value: obj.height ?? 1400, min: 400, max: 2500, step: 50, unit: "мм" },
        { key: "sillHeight", label: "Высота подоконника", type: "number", value: obj.sillHeight ?? 900, min: 0, max: 1500, step: 50, unit: "мм" },
        { key: "type", label: "Тип", type: "select", value: obj.type ?? "standard", options: [
          { value: "standard", label: "Стандартное" },
          { value: "balcony", label: "Балконный блок" },
          { value: "bay", label: "Эркерное" },
          { value: "skylight", label: "Мансардное" },
          { value: "fixed", label: "Неподвижное" },
        ]},
      ],
    },
  ]
}

// ============================================================
// ЭЛЕКТРИЧЕСКИЕ ТОЧКИ
// ============================================================

function isElectricalPoint(type: string): boolean {
  const types = [
    "outlet", "outlet_waterproof", "outlet_triple",
    "switch", "switch_pass_through", "dimmer",
    "light_ceiling", "light_wall", "light_spot", "light_strip",
    "sensor_motion", "sensor_smoke", "sensor_leak",
    "thermostat", "junction_box",
    "appliance_stove", "appliance_boiler", "appliance_ac",
    "appliance_washing_machine", "appliance_floor_heating",
  ]
  return types.includes(type)
}

function getElectricalPointProperties(obj: Record<string, unknown>): PropertyGroup[] {
  const type = obj.type as string
  const groups: PropertyGroup[] = []

  // Основные свойства
  groups.push({
    name: "identity",
    label: "Идентификация",
    fields: [
      { key: "name", label: "Название", type: "text", value: obj.name ?? "", required: true },
      { key: "type", label: "Тип", type: "readonly", value: getReadableType(type) },
    ],
  })

  // Монтаж
  groups.push({
    name: "mounting",
    label: "Монтаж",
    fields: [
      { key: "mountingHeight", label: "Высота установки", type: "number", value: obj.mountingHeight ?? 300, min: 0, max: 3000, step: 50, unit: "мм", description: "Расстояние от пола" },
      { key: "mountingMethod", label: "Способ монтажа", type: "select", value: obj.mountingMethod ?? "flush", options: [
        { value: "flush", label: "Встраиваемый" },
        { value: "surface", label: "Накладной" },
        { value: "recessed", label: "Встраиваемый в нишу" },
      ]},
    ],
  })

  // Позиция
  groups.push({
    name: "position",
    label: "Позиция",
    fields: [
      { key: "x", label: "X", type: "number", value: (obj.position as { x: number })?.x ?? 0, unit: "мм" },
      { key: "y", label: "Y", type: "number", value: (obj.position as { y: number })?.y ?? 0, unit: "мм" },
      { key: "rotation", label: "Поворот", type: "number", value: obj.rotation ?? 0, min: 0, max: 360, step: 15, unit: "°" },
    ],
  })

  // Электрические параметры
  groups.push({
    name: "electrical",
    label: "Электрика",
    fields: [
      { key: "circuitId", label: "Группа", type: "text", value: obj.circuitId ?? "Не назначена", editable: true },
      { key: "floor", label: "Этаж", type: "number", value: obj.floor ?? 1, min: 1, max: 100 },
    ],
  })

  return groups
}

// ============================================================
// ЩИТ
// ============================================================

function isPanel(type: string): boolean {
  return type === "panel" || type === "electrical_panel"
}

function getPanelProperties(obj: Record<string, unknown>): PropertyGroup[] {
  return [
    {
      name: "identity",
      label: "Идентификация",
      fields: [
        { key: "name", label: "Название", type: "text", value: obj.name ?? "Щит" },
      ],
    },
    {
      name: "specs",
      label: "Характеристики",
      fields: [
        { key: "ipRating", label: "Степень защиты", type: "select", value: obj.ipRating ?? "IP31", options: [
          { value: "IP20", label: "IP20" },
          { value: "IP31", label: "IP31" },
          { value: "IP41", label: "IP41" },
          { value: "IP43", label: "IP43" },
          { value: "IP54", label: "IP54" },
        ]},
        { key: "totalWidth", label: "Ширина", type: "readonly", value: obj.totalWidth ?? 0, unit: "мм" },
        { key: "totalHeight", label: "Высота", type: "readonly", value: obj.totalHeight ?? 0, unit: "мм" },
        { key: "rows", label: "Ряды", type: "readonly", value: obj.rows ?? 0 },
      ],
    },
  ]
}

// ============================================================
// ГРУППЫ
// ============================================================

function isCircuit(type: string): boolean {
  return type === "circuit" || type === "circuit_group"
}

function getCircuitProperties(obj: Record<string, unknown>): PropertyGroup[] {
  return [
    {
      name: "identity",
      label: "Группа",
      fields: [
        { key: "name", label: "Название", type: "text", value: obj.name ?? "" },
        { key: "type", label: "Тип", type: "readonly", value: obj.type ?? "" },
        { key: "phase", label: "Фаза", type: "select", value: obj.phase ?? 1, options: [
          { value: 1, label: "L1" },
          { value: 2, label: "L2" },
          { value: 3, label: "L3" },
        ]},
      ],
    },
    {
      name: "load",
      label: "Нагрузка",
      fields: [
        { key: "_power", label: "Мощность", type: "readonly", value: (obj.load as { effectivePower: number })?.effectivePower ?? 0, unit: "Вт" },
        { key: "_current", label: "Ток", type: "readonly", value: (obj.load as { effectiveCurrent: number })?.effectiveCurrent ?? 0, unit: "А" },
      ],
    },
  ]
}

// ============================================================
// GENERIC
// ============================================================

function getGenericProperties(obj: Record<string, unknown>): PropertyGroup[] {
  return [
    {
      name: "info",
      label: "Информация",
      fields: Object.keys(obj).filter(k => !k.startsWith("_")).map(key => ({
        key,
        label: key,
        type: "readonly" as const,
        value: obj[key],
      })),
    },
  ]
}

// ============================================================
// УТИЛИТЫ
// ============================================================

function calculateWallLength(obj: Record<string, unknown>): number {
  const points = obj.points as [{ x: number; y: number }, { x: number; y: number }] | undefined
  if (!points || points.length < 2) return 0
  const dx = points[1].x - points[0].x
  const dy = points[1].y - points[0].y
  return Math.round(Math.sqrt(dx * dx + dy * dy))
}

function getReadableType(type: string): string {
  const typeNames: Record<string, string> = {
    outlet: "Розетка",
    outlet_waterproof: "Розетка IP44",
    outlet_triple: "Тройная розетка",
    switch: "Выключатель",
    switch_pass_through: "Проходной выключатель",
    dimmer: "Диммер",
    light_ceiling: "Потолочный светильник",
    light_wall: "Бра",
    light_spot: "Точечный светильник",
    light_strip: "Светодиодная лента",
    sensor_motion: "Датчик движения",
    sensor_smoke: "Датчик дыма",
    sensor_leak: "Датчик протечки",
    thermostat: "Терморегулятор",
    junction_box: "Распределительная коробка",
    appliance_stove: "Электроплита",
    appliance_boiler: "Бойлер",
    appliance_ac: "Кондиционер",
    appliance_washing_machine: "Стиральная машина",
    appliance_floor_heating: "Тёплый пол",
  }
  return typeNames[type] ?? type
}
