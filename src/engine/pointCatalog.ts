export interface PointCatalogEntry {
  nameRu: string
  label: string
  defaultPower: number
  color: string
  defaultMountingHeight: number
  defaultMountingMethod: "flush" | "surface" | "recessed"
}

export const POINT_CATALOG: Record<string, PointCatalogEntry> = {
  outlet:                    { nameRu: "Розетка",              label: "Р",  defaultPower: 500,   color: "#2563eb", defaultMountingHeight: 300,  defaultMountingMethod: "flush" },
  outlet_waterproof:         { nameRu: "Розетка IP44",         label: "IP", defaultPower: 700,   color: "#0891b2", defaultMountingHeight: 300,  defaultMountingMethod: "flush" },
  outlet_triple:             { nameRu: "Тройная розетка",      label: "3Р", defaultPower: 1500,  color: "#4f46e5", defaultMountingHeight: 300,  defaultMountingMethod: "flush" },
  switch:                    { nameRu: "Выключатель",          label: "В",  defaultPower: 0,     color: "#ca8a04", defaultMountingHeight: 900,  defaultMountingMethod: "flush" },
  switch_pass_through:       { nameRu: "Проходной выключатель",label: "ПВ", defaultPower: 0,     color: "#b45309", defaultMountingHeight: 900,  defaultMountingMethod: "flush" },
  dimmer:                    { nameRu: "Диммер",               label: "Д",  defaultPower: 0,     color: "#ea580c", defaultMountingHeight: 900,  defaultMountingMethod: "flush" },
  light_ceiling:             { nameRu: "Потолочный светильник",label: "Л",  defaultPower: 80,    color: "#eab308", defaultMountingHeight: 2700, defaultMountingMethod: "flush" },
  light_wall:                { nameRu: "Бра",                  label: "Б",  defaultPower: 60,    color: "#facc15", defaultMountingHeight: 1500, defaultMountingMethod: "surface" },
  light_spot:                { nameRu: "Точечный светильник",  label: "ТС", defaultPower: 15,    color: "#fde047", defaultMountingHeight: 2700, defaultMountingMethod: "recessed" },
  light_strip:               { nameRu: "Светодиодная лента",   label: "LED", defaultPower: 120,  color: "#fef08a", defaultMountingHeight: 2700, defaultMountingMethod: "surface" },
  sensor_motion:             { nameRu: "Датчик движения",      label: "ДД", defaultPower: 5,     color: "#dc2626", defaultMountingHeight: 2400, defaultMountingMethod: "surface" },
  sensor_smoke:              { nameRu: "Датчик дыма",          label: "ДМ", defaultPower: 3,     color: "#991b1b", defaultMountingHeight: 2400, defaultMountingMethod: "surface" },
  sensor_leak:               { nameRu: "Датчик протечки",      label: "ДП", defaultPower: 1,     color: "#06b6d4", defaultMountingHeight: 50,   defaultMountingMethod: "surface" },
  thermostat:                { nameRu: "Термостат",            label: "Тр", defaultPower: 10,    color: "#059669", defaultMountingHeight: 1200, defaultMountingMethod: "flush" },
  panel:                     { nameRu: "Щит",                  label: "Щ",  defaultPower: 0,     color: "#334155", defaultMountingHeight: 1500, defaultMountingMethod: "surface" },
  junction_box:              { nameRu: "Распределительная коробка", label: "К", defaultPower: 0, color: "#7c3aed", defaultMountingHeight: 2400, defaultMountingMethod: "surface" },
  appliance_stove:           { nameRu: "Электроплита",         label: "ПЛ", defaultPower: 7000,  color: "#b91c1c", defaultMountingHeight: 100,  defaultMountingMethod: "flush" },
  appliance_boiler:          { nameRu: "Бойлер",               label: "Б",  defaultPower: 2000,  color: "#0e7490", defaultMountingHeight: 1500, defaultMountingMethod: "surface" },
  appliance_ac:              { nameRu: "Кондиционер",          label: "Кн", defaultPower: 2500,  color: "#0284c7", defaultMountingHeight: 200,  defaultMountingMethod: "surface" },
  appliance_floor_heating:   { nameRu: "Тёплый пол",           label: "ТП", defaultPower: 1500,  color: "#c2410c", defaultMountingHeight: 50,   defaultMountingMethod: "flush" },
  appliance_kettle:          { nameRu: "Электрочайник",        label: "Ч",  defaultPower: 2000,  color: "#d97706", defaultMountingHeight: 100,  defaultMountingMethod: "flush" },
  appliance_washing_machine: { nameRu: "Стиральная машина",    label: "СМ", defaultPower: 2000,  color: "#1d4ed8", defaultMountingHeight: 100,  defaultMountingMethod: "flush" },
  appliance_dishwasher:      { nameRu: "Посудомоечная машина", label: "ПМ", defaultPower: 2000,  color: "#4338ca", defaultMountingHeight: 100,  defaultMountingMethod: "flush" },
  appliance_oven:            { nameRu: "Духовой шкаф",         label: "Дх", defaultPower: 3000,  color: "#be123c", defaultMountingHeight: 100,  defaultMountingMethod: "flush" },
  appliance_fridge:          { nameRu: "Холодильник",          label: "Х",  defaultPower: 150,   color: "#0f766e", defaultMountingHeight: 100,  defaultMountingMethod: "flush" },
}

export function getPointNameRu(type: string): string {
  return POINT_CATALOG[type]?.nameRu ?? type
}

export function getPointDefaultPower(type: string): number {
  return POINT_CATALOG[type]?.defaultPower ?? 0
}

export function getPointColor(type: string): string {
  return POINT_CATALOG[type]?.color ?? "#64748b"
}

export function getDefaultMountingHeight(type: string): number {
  return POINT_CATALOG[type]?.defaultMountingHeight ?? 300
}

export function getPointLabel(type: string): string {
  return POINT_CATALOG[type]?.label ?? "?"
}
