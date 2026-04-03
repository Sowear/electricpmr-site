import { useState, useMemo, useCallback, memo } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, Plus, Package, Star, History } from "lucide-react";
import { LineItemPreset } from "@/types/estimator";

interface PresetSearchProps {
  presets: LineItemPreset[];
  onSelect: (preset: LineItemPreset) => void;
  onAddNew?: () => void;
}

const BUILTIN_CATALOG: Omit<LineItemPreset, "id">[] = [
  {
    name: "Установка розетки / выключателя",
    description: "Монтаж и подключение новой точки",
    item_type: "service",
    unit: "точка",
    quantity: 1,
    unit_price: 80,
    labor_hours: 0,
    labor_rate: 0,
    cost_price: 0,
    markup_pct: 0,
    category: "Розетки",
    category_key: "sockets",
    keywords: ["розетка", "розетки", "выключатель", "точка", "установка"],
    is_active: true,
    market_min: 56,
    market_max: 104,
    popular: true,
    calc_default: "point",
    source: "builtin",
  },
  {
    name: "Замена розетки / выключателя",
    description: "Демонтаж старого и установка нового",
    item_type: "service",
    unit: "точка",
    quantity: 1,
    unit_price: 120,
    labor_hours: 0,
    labor_rate: 0,
    cost_price: 0,
    markup_pct: 0,
    category: "Розетки",
    category_key: "sockets",
    keywords: ["замена", "розетка", "выключатель", "демонтаж"],
    is_active: true,
    market_min: 84,
    market_max: 156,
    calc_default: "point",
    source: "builtin",
  },
  {
    name: "Монтаж подрозетника (бетон)",
    description: "Установка в бетон",
    item_type: "service",
    unit: "шт",
    quantity: 1,
    unit_price: 70,
    labor_hours: 0,
    labor_rate: 0,
    cost_price: 0,
    markup_pct: 0,
    category: "Розетки",
    category_key: "sockets",
    keywords: ["подрозетник", "бетон", "монтаж"],
    is_active: true,
    market_min: 49,
    market_max: 91,
    calc_default: "piece",
    source: "builtin",
  },
  {
    name: "Монтаж подрозетника (гипсокартон)",
    description: "Установка в гипсокартон",
    item_type: "service",
    unit: "шт",
    quantity: 1,
    unit_price: 20,
    labor_hours: 0,
    labor_rate: 0,
    cost_price: 0,
    markup_pct: 0,
    category: "Розетки",
    category_key: "sockets",
    keywords: ["подрозетник", "гипсокартон", "монтаж"],
    is_active: true,
    market_min: 14,
    market_max: 26,
    calc_default: "piece",
    source: "builtin",
  },
  {
    name: "Монтаж распределительной коробки",
    description: "Установка коробки",
    item_type: "service",
    unit: "шт",
    quantity: 1,
    unit_price: 100,
    labor_hours: 0,
    labor_rate: 0,
    cost_price: 0,
    markup_pct: 0,
    category: "Розетки",
    category_key: "sockets",
    keywords: ["распределительная", "коробка", "распредкоробка"],
    is_active: true,
    market_min: 70,
    market_max: 130,
    calc_default: "piece",
    source: "builtin",
  },
  {
    name: "Монтаж точечного светильника",
    description: "Установка точечного света",
    item_type: "service",
    unit: "точка",
    quantity: 1,
    unit_price: 100,
    labor_hours: 0,
    labor_rate: 0,
    cost_price: 0,
    markup_pct: 0,
    category: "Освещение",
    category_key: "lighting",
    keywords: ["светильник", "точечный", "освещение"],
    is_active: true,
    market_min: 70,
    market_max: 130,
    popular: true,
    calc_default: "point",
    source: "builtin",
  },
  {
    name: "Монтаж потолочного светильника",
    description: "Установка накладного светильника",
    item_type: "service",
    unit: "шт",
    quantity: 1,
    unit_price: 150,
    labor_hours: 0,
    labor_rate: 0,
    cost_price: 0,
    markup_pct: 0,
    category: "Освещение",
    category_key: "lighting",
    keywords: ["потолочный", "светильник", "накладной"],
    is_active: true,
    market_min: 105,
    market_max: 195,
    calc_default: "piece",
    source: "builtin",
  },
  {
    name: "Монтаж люстры",
    description: "Сборка и подключение",
    item_type: "service",
    unit: "шт",
    quantity: 1,
    unit_price: 200,
    labor_hours: 0,
    labor_rate: 0,
    cost_price: 0,
    markup_pct: 0,
    category: "Освещение",
    category_key: "lighting",
    keywords: ["люстра", "светильник", "монтаж"],
    is_active: true,
    market_min: 140,
    market_max: 260,
    popular: true,
    calc_default: "piece",
    source: "builtin",
  },
  {
    name: "Монтаж LED-ленты (без профиля)",
    description: "Базовый монтаж ленты",
    item_type: "service",
    unit: "м",
    quantity: 1,
    unit_price: 70,
    labor_hours: 0,
    labor_rate: 0,
    cost_price: 0,
    markup_pct: 0,
    category: "Освещение",
    category_key: "lighting",
    keywords: ["led", "лента", "освещение"],
    is_active: true,
    market_min: 49,
    market_max: 91,
    calc_default: "meter",
    source: "builtin",
  },
  {
    name: "Монтаж LED-ленты в профиль",
    description: "Монтаж с профилем",
    item_type: "service",
    unit: "м",
    quantity: 1,
    unit_price: 150,
    labor_hours: 0,
    labor_rate: 0,
    cost_price: 0,
    markup_pct: 0,
    category: "Освещение",
    category_key: "lighting",
    keywords: ["led", "лента", "профиль"],
    is_active: true,
    market_min: 105,
    market_max: 195,
    calc_default: "meter",
    source: "builtin",
  },
  {
    name: "Прокладка кабеля в штробе",
    description: "Укладка в стену",
    item_type: "service",
    unit: "м",
    quantity: 1,
    unit_price: 25,
    labor_hours: 0,
    labor_rate: 0,
    cost_price: 0,
    markup_pct: 0,
    category: "Кабель",
    category_key: "cable",
    keywords: ["кабель", "штроба", "прокладка"],
    is_active: true,
    market_min: 18,
    market_max: 33,
    popular: true,
    calc_default: "meter",
    source: "builtin",
  },
  {
    name: "Прокладка кабеля в гофре",
    description: "Защита кабеля",
    item_type: "service",
    unit: "м",
    quantity: 1,
    unit_price: 30,
    labor_hours: 0,
    labor_rate: 0,
    cost_price: 0,
    markup_pct: 0,
    category: "Кабель",
    category_key: "cable",
    keywords: ["кабель", "гофра", "прокладка"],
    is_active: true,
    market_min: 21,
    market_max: 39,
    calc_default: "meter",
    source: "builtin",
  },
  {
    name: "Прокладка по гипсокартону",
    description: "По каркасу",
    item_type: "service",
    unit: "м",
    quantity: 1,
    unit_price: 20,
    labor_hours: 0,
    labor_rate: 0,
    cost_price: 0,
    markup_pct: 0,
    category: "Кабель",
    category_key: "cable",
    keywords: ["гипсокартон", "прокладка", "кабель"],
    is_active: true,
    market_min: 14,
    market_max: 26,
    calc_default: "meter",
    source: "builtin",
  },
  {
    name: "Штробление",
    description: "Резка стен",
    item_type: "service",
    unit: "м",
    quantity: 1,
    unit_price: 40,
    labor_hours: 0,
    labor_rate: 0,
    cost_price: 0,
    markup_pct: 0,
    category: "Кабель",
    category_key: "cable",
    keywords: ["штробление", "штроба", "резка"],
    is_active: true,
    market_min: 28,
    market_max: 52,
    popular: true,
    calc_default: "meter",
    source: "builtin",
  },
  {
    name: "Монтаж щита",
    description: "Установка",
    item_type: "service",
    unit: "объект",
    quantity: 1,
    unit_price: 400,
    labor_hours: 0,
    labor_rate: 0,
    cost_price: 0,
    markup_pct: 0,
    category: "Щиты",
    category_key: "panels",
    keywords: ["щит", "монтаж", "электрощит"],
    is_active: true,
    market_min: 280,
    market_max: 520,
    calc_default: "object",
    source: "builtin",
  },
  {
    name: "Сборка щита",
    description: "1 модуль",
    item_type: "service",
    unit: "шт",
    quantity: 1,
    unit_price: 80,
    labor_hours: 0,
    labor_rate: 0,
    cost_price: 0,
    markup_pct: 0,
    category: "Щиты",
    category_key: "panels",
    keywords: ["сборка", "щит", "модуль"],
    is_active: true,
    market_min: 56,
    market_max: 104,
    popular: true,
    calc_default: "piece",
    source: "builtin",
  },
  {
    name: "Подключение линии",
    description: "Ввод в щит",
    item_type: "service",
    unit: "линия",
    quantity: 1,
    unit_price: 150,
    labor_hours: 0,
    labor_rate: 0,
    cost_price: 0,
    markup_pct: 0,
    category: "Щиты",
    category_key: "panels",
    keywords: ["линия", "щит", "подключение"],
    is_active: true,
    market_min: 105,
    market_max: 195,
    calc_default: "line",
    source: "builtin",
  },
  {
    name: "Диагностика",
    description: "Первичная проверка электроцепей",
    item_type: "service",
    unit: "услуга",
    quantity: 1,
    unit_price: 150,
    labor_hours: 0,
    labor_rate: 0,
    cost_price: 0,
    markup_pct: 0,
    category: "Прочее",
    category_key: "other",
    keywords: ["диагностика", "проверка", "электрика"],
    is_active: true,
    market_min: 105,
    market_max: 195,
    calc_default: "fixed",
    source: "builtin",
  },
  {
    name: "Поиск неисправности",
    description: "Поиск и локализация проблемы",
    item_type: "service",
    unit: "услуга",
    quantity: 1,
    unit_price: 500,
    labor_hours: 0,
    labor_rate: 0,
    cost_price: 0,
    markup_pct: 0,
    category: "Прочее",
    category_key: "other",
    keywords: ["неисправность", "поиск", "авария"],
    is_active: true,
    market_min: 350,
    market_max: 650,
    calc_default: "fixed",
    source: "builtin",
  },
  {
    name: "Выезд",
    description: "Выезд мастера на объект",
    item_type: "service",
    unit: "услуга",
    quantity: 1,
    unit_price: 200,
    labor_hours: 0,
    labor_rate: 0,
    cost_price: 0,
    markup_pct: 0,
    category: "Прочее",
    category_key: "other",
    keywords: ["выезд", "транспорт", "мастер"],
    is_active: true,
    market_min: 140,
    market_max: 260,
    calc_default: "fixed",
    source: "builtin",
  },
  {
    name: "Прокладка по фасаду",
    description: "Наружная прокладка кабеля",
    item_type: "service",
    unit: "м",
    quantity: 1,
    unit_price: 50,
    labor_hours: 0,
    labor_rate: 0,
    cost_price: 0,
    markup_pct: 0,
    category: "Улица",
    category_key: "outdoor",
    keywords: ["фасад", "улица", "кабель"],
    is_active: true,
    market_min: 35,
    market_max: 65,
    calc_default: "meter",
    source: "builtin",
  },
  {
    name: "Прокладка в трубе",
    description: "Прокладка кабеля в трубе",
    item_type: "service",
    unit: "м",
    quantity: 1,
    unit_price: 70,
    labor_hours: 0,
    labor_rate: 0,
    cost_price: 0,
    markup_pct: 0,
    category: "Улица",
    category_key: "outdoor",
    keywords: ["труба", "улица", "кабель"],
    is_active: true,
    market_min: 49,
    market_max: 91,
    calc_default: "meter",
    source: "builtin",
  },
  {
    name: "Кабель в земле",
    description: "Укладка кабеля в грунт",
    item_type: "service",
    unit: "м",
    quantity: 1,
    unit_price: 80,
    labor_hours: 0,
    labor_rate: 0,
    cost_price: 0,
    markup_pct: 0,
    category: "Улица",
    category_key: "outdoor",
    keywords: ["кабель", "земля", "траншея"],
    is_active: true,
    market_min: 56,
    market_max: 104,
    calc_default: "meter",
    source: "builtin",
  },
  {
    name: "Траншея",
    description: "Разработка траншеи",
    item_type: "service",
    unit: "м",
    quantity: 1,
    unit_price: 250,
    labor_hours: 0,
    labor_rate: 0,
    cost_price: 0,
    markup_pct: 0,
    category: "Улица",
    category_key: "outdoor",
    keywords: ["траншея", "земля", "улица"],
    is_active: true,
    market_min: 175,
    market_max: 325,
    calc_default: "meter",
    source: "builtin",
  },
  {
    name: "Труба",
    description: "Монтаж защитной трубы",
    item_type: "service",
    unit: "м",
    quantity: 1,
    unit_price: 40,
    labor_hours: 0,
    labor_rate: 0,
    cost_price: 0,
    markup_pct: 0,
    category: "Улица",
    category_key: "outdoor",
    keywords: ["труба", "защита", "кабель"],
    is_active: true,
    market_min: 28,
    market_max: 52,
    calc_default: "meter",
    source: "builtin",
  },
  {
    name: "Светильник (уличный)",
    description: "Монтаж уличного светильника",
    item_type: "service",
    unit: "шт",
    quantity: 1,
    unit_price: 250,
    labor_hours: 0,
    labor_rate: 0,
    cost_price: 0,
    markup_pct: 0,
    category: "Освещение",
    category_key: "lighting",
    keywords: ["улица", "светильник", "освещение"],
    is_active: true,
    market_min: 175,
    market_max: 325,
    calc_default: "piece",
    source: "builtin",
  },
  {
    name: "Прожектор",
    description: "Монтаж прожектора",
    item_type: "service",
    unit: "шт",
    quantity: 1,
    unit_price: 250,
    labor_hours: 0,
    labor_rate: 0,
    cost_price: 0,
    markup_pct: 0,
    category: "Освещение",
    category_key: "lighting",
    keywords: ["прожектор", "освещение", "улица"],
    is_active: true,
    market_min: 175,
    market_max: 325,
    calc_default: "piece",
    source: "builtin",
  },
  {
    name: "Датчик движения",
    description: "Подключение и настройка",
    item_type: "service",
    unit: "шт",
    quantity: 1,
    unit_price: 200,
    labor_hours: 0,
    labor_rate: 0,
    cost_price: 0,
    markup_pct: 0,
    category: "Освещение",
    category_key: "lighting",
    keywords: ["датчик", "движение", "свет"],
    is_active: true,
    market_min: 140,
    market_max: 260,
    calc_default: "piece",
    source: "builtin",
  },
  {
    name: "Ввод в дом",
    description: "Организация ввода питания",
    item_type: "service",
    unit: "объект",
    quantity: 1,
    unit_price: 1500,
    labor_hours: 0,
    labor_rate: 0,
    cost_price: 0,
    markup_pct: 0,
    category: "Щиты",
    category_key: "panels",
    keywords: ["ввод", "дом", "питание"],
    is_active: true,
    market_min: 1050,
    market_max: 1950,
    calc_default: "object",
    source: "builtin",
  },
  {
    name: "Заземление",
    description: "Монтаж контура заземления",
    item_type: "service",
    unit: "объект",
    quantity: 1,
    unit_price: 3000,
    labor_hours: 0,
    labor_rate: 0,
    cost_price: 0,
    markup_pct: 0,
    category: "Щиты",
    category_key: "panels",
    keywords: ["заземление", "контур", "защита"],
    is_active: true,
    market_min: 2100,
    market_max: 3900,
    popular: true,
    calc_default: "object",
    source: "builtin",
  },
  {
    name: "Стабилизатор",
    description: "Установка и подключение",
    item_type: "service",
    unit: "шт",
    quantity: 1,
    unit_price: 600,
    labor_hours: 0,
    labor_rate: 0,
    cost_price: 0,
    markup_pct: 0,
    category: "Щиты",
    category_key: "panels",
    keywords: ["стабилизатор", "напряжение", "подключение"],
    is_active: true,
    market_min: 420,
    market_max: 780,
    calc_default: "piece",
    source: "builtin",
  },
  {
    name: "Наружный щит",
    description: "Монтаж наружного щита",
    item_type: "service",
    unit: "шт",
    quantity: 1,
    unit_price: 500,
    labor_hours: 0,
    labor_rate: 0,
    cost_price: 0,
    markup_pct: 0,
    category: "Щиты",
    category_key: "panels",
    keywords: ["щит", "наружный", "монтаж"],
    is_active: true,
    market_min: 350,
    market_max: 650,
    calc_default: "piece",
    source: "builtin",
  },
  {
    name: "Работа на высоте",
    description: "Надбавка коэффициентом к стоимости",
    item_type: "other",
    unit: "%",
    quantity: 1,
    unit_price: 20,
    labor_hours: 0,
    labor_rate: 0,
    cost_price: 0,
    markup_pct: 0,
    category: "Дополнительно",
    category_key: "extras",
    keywords: ["высота", "надбавка", "коэффициент"],
    is_active: true,
    market_min: 14,
    market_max: 26,
    special_type: "height_markup",
    calc_default: "percent",
    source: "builtin",
  },
  {
    name: "Демонтаж проводки",
    description: "Процент от стоимости монтажных работ",
    item_type: "other",
    unit: "%",
    quantity: 1,
    unit_price: 50,
    labor_hours: 0,
    labor_rate: 0,
    cost_price: 0,
    markup_pct: 0,
    category: "Дополнительно",
    category_key: "extras",
    keywords: ["демонтаж", "проводка", "процент"],
    is_active: true,
    market_min: 35,
    market_max: 65,
    special_type: "dismantle_percent",
    calc_default: "percent",
    source: "builtin",
  },
  {
    name: "Аварийные работы",
    description: "Договорная цена",
    item_type: "other",
    unit: "услуга",
    quantity: 1,
    unit_price: 0,
    labor_hours: 0,
    labor_rate: 0,
    cost_price: 0,
    markup_pct: 0,
    category: "Дополнительно",
    category_key: "extras",
    keywords: ["авария", "аварийные", "договорная"],
    is_active: true,
    special_type: "emergency_contract",
    calc_default: "contract",
    source: "builtin",
  },
  {
    name: "Устройство ниши (кирпич)",
    description: "Подготовка ниши под оборудование",
    item_type: "service",
    unit: "шт",
    quantity: 1,
    unit_price: 377,
    labor_hours: 0,
    labor_rate: 0,
    cost_price: 0,
    markup_pct: 0,
    category: "Прочее",
    category_key: "other",
    keywords: ["ниша", "кирпич"],
    is_active: true,
    market_min: 264,
    market_max: 490,
    calc_default: "piece",
    source: "builtin",
  },
  {
    name: "Устройство ниши (бетон)",
    description: "Подготовка ниши под оборудование",
    item_type: "service",
    unit: "шт",
    quantity: 1,
    unit_price: 615,
    labor_hours: 0,
    labor_rate: 0,
    cost_price: 0,
    markup_pct: 0,
    category: "Прочее",
    category_key: "other",
    keywords: ["ниша", "бетон"],
    is_active: true,
    market_min: 431,
    market_max: 800,
    calc_default: "piece",
    source: "builtin",
  },
  {
    name: "Установка электрощита",
    description: "Монтаж щита с подключением",
    item_type: "service",
    unit: "шт",
    quantity: 1,
    unit_price: 325,
    labor_hours: 0,
    labor_rate: 0,
    cost_price: 0,
    markup_pct: 0,
    category: "Щиты",
    category_key: "panels",
    keywords: ["щит", "электрощит", "монтаж"],
    is_active: true,
    market_min: 228,
    market_max: 423,
    calc_default: "piece",
    source: "builtin",
  },
  {
    name: "Распредкоробка бетон",
    description: "Монтаж коробки в бетон",
    item_type: "service",
    unit: "шт",
    quantity: 1,
    unit_price: 117,
    labor_hours: 0,
    labor_rate: 0,
    cost_price: 0,
    markup_pct: 0,
    category: "Розетки",
    category_key: "sockets",
    keywords: ["распредкоробка", "бетон"],
    is_active: true,
    market_min: 82,
    market_max: 152,
    calc_default: "piece",
    source: "builtin",
  },
  {
    name: "Распредкоробка кирпич",
    description: "Монтаж коробки в кирпич",
    item_type: "service",
    unit: "шт",
    quantity: 1,
    unit_price: 88,
    labor_hours: 0,
    labor_rate: 0,
    cost_price: 0,
    markup_pct: 0,
    category: "Розетки",
    category_key: "sockets",
    keywords: ["распредкоробка", "кирпич"],
    is_active: true,
    market_min: 62,
    market_max: 114,
    calc_default: "piece",
    source: "builtin",
  },
  {
    name: "Распредкоробка гипс",
    description: "Монтаж коробки в гипсокартон",
    item_type: "service",
    unit: "шт",
    quantity: 1,
    unit_price: 62,
    labor_hours: 0,
    labor_rate: 0,
    cost_price: 0,
    markup_pct: 0,
    category: "Розетки",
    category_key: "sockets",
    keywords: ["распредкоробка", "гипс"],
    is_active: true,
    market_min: 43,
    market_max: 81,
    calc_default: "piece",
    source: "builtin",
  },
  {
    name: "Сборка коробки",
    description: "Сборка и подключение",
    item_type: "service",
    unit: "шт",
    quantity: 1,
    unit_price: 128,
    labor_hours: 0,
    labor_rate: 0,
    cost_price: 0,
    markup_pct: 0,
    category: "Розетки",
    category_key: "sockets",
    keywords: ["сборка", "коробка"],
    is_active: true,
    market_min: 90,
    market_max: 166,
    calc_default: "piece",
    source: "builtin",
  },
  {
    name: "Открытая проводка",
    description: "Открытый способ прокладки",
    item_type: "service",
    unit: "м",
    quantity: 1,
    unit_price: 15,
    labor_hours: 0,
    labor_rate: 0,
    cost_price: 0,
    markup_pct: 0,
    category: "Кабель",
    category_key: "cable",
    keywords: ["открытая", "проводка", "кабель"],
    is_active: true,
    market_min: 11,
    market_max: 20,
    calc_default: "meter",
    source: "builtin",
  },
  {
    name: "Гофра",
    description: "Прокладка в гофре",
    item_type: "service",
    unit: "м",
    quantity: 1,
    unit_price: 23,
    labor_hours: 0,
    labor_rate: 0,
    cost_price: 0,
    markup_pct: 0,
    category: "Кабель",
    category_key: "cable",
    keywords: ["гофра", "прокладка"],
    is_active: true,
    market_min: 16,
    market_max: 30,
    calc_default: "meter",
    source: "builtin",
  },
  {
    name: "Кабель 4+",
    description: "Прокладка кабеля большого сечения",
    item_type: "service",
    unit: "м",
    quantity: 1,
    unit_price: 23,
    labor_hours: 0,
    labor_rate: 0,
    cost_price: 0,
    markup_pct: 0,
    category: "Кабель",
    category_key: "cable",
    keywords: ["кабель", "4+", "сечение"],
    is_active: true,
    market_min: 16,
    market_max: 30,
    calc_default: "meter",
    source: "builtin",
  },
  {
    name: "Кабель 10+",
    description: "Прокладка кабеля высокого сечения",
    item_type: "service",
    unit: "м",
    quantity: 1,
    unit_price: 33,
    labor_hours: 0,
    labor_rate: 0,
    cost_price: 0,
    markup_pct: 0,
    category: "Кабель",
    category_key: "cable",
    keywords: ["кабель", "10+", "сечение"],
    is_active: true,
    market_min: 23,
    market_max: 43,
    calc_default: "meter",
    source: "builtin",
  },
  {
    name: "Сверление",
    description: "Отверстие под кабель/крепеж",
    item_type: "service",
    unit: "шт",
    quantity: 1,
    unit_price: 60,
    labor_hours: 0,
    labor_rate: 0,
    cost_price: 0,
    markup_pct: 0,
    category: "Прочее",
    category_key: "other",
    keywords: ["сверление", "отверстие"],
    is_active: true,
    market_min: 42,
    market_max: 78,
    calc_default: "piece",
    source: "builtin",
  },
  {
    name: "Заземление комплекс",
    description: "Полный комплекс заземления",
    item_type: "service",
    unit: "объект",
    quantity: 1,
    unit_price: 3479,
    labor_hours: 0,
    labor_rate: 0,
    cost_price: 0,
    markup_pct: 0,
    category: "Щиты",
    category_key: "panels",
    keywords: ["заземление", "комплекс"],
    is_active: true,
    market_min: 2435,
    market_max: 4523,
    calc_default: "object",
    source: "builtin",
  },
  {
    name: "Демонтаж кабеля",
    description: "Снятие старой кабельной линии",
    item_type: "other",
    unit: "м",
    quantity: 1,
    unit_price: 13,
    labor_hours: 0,
    labor_rate: 0,
    cost_price: 0,
    markup_pct: 0,
    category: "Демонтаж",
    category_key: "dismantle",
    keywords: ["демонтаж", "кабель"],
    is_active: true,
    market_min: 9,
    market_max: 17,
    calc_default: "meter",
    source: "builtin",
  },
  {
    name: "Демонтаж проводки",
    description: "Демонтаж внутренней проводки",
    item_type: "other",
    unit: "м",
    quantity: 1,
    unit_price: 10,
    labor_hours: 0,
    labor_rate: 0,
    cost_price: 0,
    markup_pct: 0,
    category: "Демонтаж",
    category_key: "dismantle",
    keywords: ["демонтаж", "проводка"],
    is_active: true,
    market_min: 7,
    market_max: 13,
    calc_default: "meter",
    source: "builtin",
  },
  {
    name: "1 ком квартира",
    description: "Комплекс электромонтажа 1-комнатной квартиры",
    item_type: "service",
    unit: "объект",
    quantity: 1,
    unit_price: 9922,
    labor_hours: 0,
    labor_rate: 0,
    cost_price: 0,
    markup_pct: 0,
    category: "Прочее",
    category_key: "other",
    keywords: ["квартира", "1 ком", "комплекс"],
    is_active: true,
    market_min: 6945,
    market_max: 12899,
    calc_default: "object",
    source: "builtin",
  },
  {
    name: "2 ком",
    description: "Комплекс электромонтажа 2-комнатной квартиры",
    item_type: "service",
    unit: "объект",
    quantity: 1,
    unit_price: 13765,
    labor_hours: 0,
    labor_rate: 0,
    cost_price: 0,
    markup_pct: 0,
    category: "Прочее",
    category_key: "other",
    keywords: ["квартира", "2 ком", "комплекс"],
    is_active: true,
    market_min: 9636,
    market_max: 17895,
    calc_default: "object",
    source: "builtin",
  },
  {
    name: "3 ком",
    description: "Комплекс электромонтажа 3-комнатной квартиры",
    item_type: "service",
    unit: "объект",
    quantity: 1,
    unit_price: 19237,
    labor_hours: 0,
    labor_rate: 0,
    cost_price: 0,
    markup_pct: 0,
    category: "Прочее",
    category_key: "other",
    keywords: ["квартира", "3 ком", "комплекс"],
    is_active: true,
    market_min: 13466,
    market_max: 25008,
    calc_default: "object",
    source: "builtin",
  },
  {
    name: "4 ком",
    description: "Комплекс электромонтажа 4-комнатной квартиры",
    item_type: "service",
    unit: "объект",
    quantity: 1,
    unit_price: 24346,
    labor_hours: 0,
    labor_rate: 0,
    cost_price: 0,
    markup_pct: 0,
    category: "Прочее",
    category_key: "other",
    keywords: ["квартира", "4 ком", "комплекс"],
    is_active: true,
    market_min: 17042,
    market_max: 31650,
    calc_default: "object",
    source: "builtin",
  },
  {
    name: "Схема",
    description: "Разработка схемы подключения",
    item_type: "service",
    unit: "услуга",
    quantity: 1,
    unit_price: 97,
    labor_hours: 0,
    labor_rate: 0,
    cost_price: 0,
    markup_pct: 0,
    category: "Прочее",
    category_key: "other",
    keywords: ["схема", "проект"],
    is_active: true,
    market_min: 68,
    market_max: 126,
    calc_default: "fixed",
    source: "builtin",
  },
  {
    name: "Прозвонка",
    description: "Проверка целостности линии",
    item_type: "service",
    unit: "линия",
    quantity: 1,
    unit_price: 62,
    labor_hours: 0,
    labor_rate: 0,
    cost_price: 0,
    markup_pct: 0,
    category: "Прочее",
    category_key: "other",
    keywords: ["прозвонка", "проверка", "линия"],
    is_active: true,
    market_min: 43,
    market_max: 81,
    calc_default: "line",
    source: "builtin",
  },
];

const FILTERS = [
  { key: "all", label: "Все" },
  { key: "favorites", label: "Избранное" },
  { key: "recent", label: "История" },
  { key: "popular", label: "Популярные" },
  { key: "sockets", label: "Розетки" },
  { key: "lighting", label: "Освещение" },
  { key: "cable", label: "Кабель" },
  { key: "panels", label: "Щиты" },
  { key: "dismantle", label: "Демонтаж" },
  { key: "other", label: "Прочее" },
  { key: "extras", label: "Дополнительно" },
] as const;

const SEARCH_ALIASES: Record<string, string[]> = {
  розетка: ["розетки", "роз", "подрозет"],
  розетки: ["розетка", "роз", "подрозет"],
  роз: ["розетка", "розетки", "подрозет"],
  кабель: ["кабел", "провод", "линия"],
  штроба: ["штроб", "штробление"],
  свет: ["освещение", "светильник", "люстра"],
  щит: ["щит", "электрощит", "автомат", "узо"],
};

const MISSPELLINGS: Record<string, string> = {
  разетка: "розетка",
  разетки: "розетки",
  кабел: "кабель",
  шроба: "штроба",
  люстраа: "люстра",
};

const normalize = (value: string) => value.toLowerCase().replace(/ё/g, "е").trim();

const makeId = (name: string) =>
  normalize(name)
    .replace(/[^a-zа-я0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const buildMarketRange = (price: number) => {
  const min = Math.round(price * 0.7);
  const max = Math.round(price * 1.3);
  return { min, max };
};

const getAllVariants = (token: string) => {
  const normalizedToken = normalize(token);
  const corrected = MISSPELLINGS[normalizedToken] || normalizedToken;
  return [corrected, ...(SEARCH_ALIASES[corrected] || [])];
};

const scorePreset = (preset: LineItemPreset, tokens: string[]) => {
  if (!tokens.length) return preset.popular ? 100 : 0;

  const name = normalize(preset.name);
  const description = normalize(preset.description || "");
  const category = normalize(preset.category || "");
  const keywordBlob = normalize((preset.keywords || []).join(" "));

  return tokens.reduce((sum, token) => {
    const variants = getAllVariants(token);
    if (variants.some((v) => name.startsWith(v))) return sum + 8;
    if (variants.some((v) => name.includes(v))) return sum + 6;
    if (variants.some((v) => keywordBlob.includes(v))) return sum + 4;
    if (variants.some((v) => description.includes(v))) return sum + 3;
    if (variants.some((v) => category.includes(v))) return sum + 2;
    return sum;
  }, 0);
};

const withCatalogDefaults = (preset: Omit<LineItemPreset, "id">): LineItemPreset => {
  const range = buildMarketRange(preset.unit_price || 0);
  return {
    id: `builtin-${makeId(preset.name)}`,
    market_min: preset.market_min ?? range.min,
    market_max: preset.market_max ?? range.max,
    source: "builtin",
    ...preset,
  };
};

const highlightMatch = (text: string, query: string) => {
  const cleaned = normalize(query);
  if (!cleaned) return text;

  const escaped = cleaned.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(`(${escaped})`, "gi");
  const parts = text.split(regex);

  return parts.map((part, i) =>
    regex.test(part) ? (
      <mark key={`${part}-${i}`} className="bg-primary/20 text-foreground rounded px-0.5">
        {part}
      </mark>
    ) : (
      part
    ),
  );
};

const MARKET_TEXT = (preset: LineItemPreset) => {
  if (preset.special_type === "emergency_contract") return "Договорная";
  if (preset.special_type === "height_markup") return "14-26%";
  if (preset.special_type === "dismantle_percent") return "35-65%";

  const min = preset.market_min ?? buildMarketRange(preset.unit_price || 0).min;
  const max = preset.market_max ?? buildMarketRange(preset.unit_price || 0).max;
  return `${min.toLocaleString("ru-RU")}-${max.toLocaleString("ru-RU")}`;
};

const PRICE_TEXT = (preset: LineItemPreset) => {
  if (preset.special_type === "height_markup") return "+20%";
  if (preset.special_type === "dismantle_percent") return "50%";
  if (preset.special_type === "emergency_contract") return "Договорная";
  return `${(preset.unit_price || 0).toLocaleString("ru-RU")}`;
};

const PresetSearch = ({ presets, onSelect, onAddNew }: PresetSearchProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<(typeof FILTERS)[number]["key"]>("all");
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [historyIds, setHistoryIds] = useState<string[]>([]);
  const [hiddenIds, setHiddenIds] = useState<string[]>([]);

  const mergedCatalog = useMemo(() => {
    const builtin = BUILTIN_CATALOG.map(withCatalogDefaults);
    const fromDb = presets
      .filter((preset) => preset.is_active)
      .map((preset) => {
        const range = buildMarketRange(preset.unit_price || 0);
        return {
          ...preset,
          source: "custom" as const,
          market_min: preset.market_min ?? range.min,
          market_max: preset.market_max ?? range.max,
          category_key: preset.category_key || "other",
          keywords: preset.keywords || [],
        };
      });

    const dbByName = new Map(fromDb.map((preset) => [normalize(preset.name), preset]));
    const merged = builtin.map((preset) => dbByName.get(normalize(preset.name)) || preset);

    fromDb.forEach((preset) => {
      if (!merged.some((item) => normalize(item.name) === normalize(preset.name))) {
        merged.push(preset);
      }
    });

    return merged.filter((preset) => !hiddenIds.includes(preset.id));
  }, [hiddenIds, presets]);

  const suggestionPool = useMemo(() => {
    return mergedCatalog
      .filter((preset) => preset.popular)
      .slice(0, 6)
      .map((preset) => preset.name);
  }, [mergedCatalog]);

  const filteredPresets = useMemo(() => {
    const query = normalize(searchQuery);
    const tokens = query.split(/\s+/).filter(Boolean);

    return mergedCatalog
      .filter((preset) => {
        const name = normalize(preset.name);
        const description = normalize(preset.description || "");
        const category = normalize(preset.category || "");
        const keywordBlob = normalize((preset.keywords || []).join(" "));
        const textBlob = `${name} ${description} ${category} ${keywordBlob}`;

        const matchesQuery =
          tokens.length === 0 ||
          tokens.every((token) => getAllVariants(token).some((variant) => textBlob.includes(variant)));

        if (!matchesQuery) return false;
        if (activeFilter === "all") return true;
        if (activeFilter === "favorites") return favoriteIds.includes(preset.id);
        if (activeFilter === "recent") return historyIds.includes(preset.id);
        if (activeFilter === "popular") return !!preset.popular;
        return preset.category_key === activeFilter;
      })
      .sort((a, b) => {
        const scoreA = scorePreset(a, tokens) + (favoriteIds.includes(a.id) ? 2 : 0);
        const scoreB = scorePreset(b, tokens) + (favoriteIds.includes(b.id) ? 2 : 0);
        if (scoreA !== scoreB) return scoreB - scoreA;
        return a.name.localeCompare(b.name, "ru");
      });
  }, [activeFilter, favoriteIds, historyIds, mergedCatalog, searchQuery]);

  const handleSelectPreset = useCallback(
    (preset: LineItemPreset) => {
      onSelect(preset);
      setHistoryIds((prev) => [preset.id, ...prev.filter((id) => id !== preset.id)].slice(0, 20));
    },
    [onSelect],
  );

  const toggleFavorite = useCallback((id: string) => {
    setFavoriteIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }, []);

  const hidePreset = useCallback((id: string) => {
    setHiddenIds((prev) => (prev.includes(id) ? prev : [...prev, id]));
  }, []);

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="relative mb-3 shrink-0">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Поиск: розетка, установка розеток, роз..."
          className="pl-10 h-11 text-base"
          autoFocus
        />
      </div>

      <div className="flex flex-wrap gap-2 mb-3 shrink-0">
        {FILTERS.map((filter) => (
          <Badge
            key={filter.key}
            variant={activeFilter === filter.key ? "default" : "outline"}
            className="cursor-pointer text-xs"
            onClick={() => setActiveFilter(filter.key)}
          >
            {filter.label}
          </Badge>
        ))}
      </div>

      {suggestionPool.length > 0 && !searchQuery && (
        <div className="mb-3 shrink-0">
          <p className="text-xs text-muted-foreground mb-1">Быстрый выбор</p>
          <div className="flex flex-wrap gap-1.5">
            {suggestionPool.map((item) => (
              <Button key={item} variant="outline" size="sm" className="h-8 text-xs" onClick={() => setSearchQuery(item)}>
                {item}
              </Button>
            ))}
          </div>
        </div>
      )}

      <div className="flex-1 min-h-0 overflow-hidden">
        <ScrollArea className="h-full">
          {filteredPresets.length > 0 ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-3 pr-4 pb-4">
                {filteredPresets.map((preset) => {
                  const isSpecial = preset.category_key === "extras";
                  const isFavorite = favoriteIds.includes(preset.id);

                  return (
                    <button
                      key={preset.id}
                      type="button"
                      className={`h-full min-h-[185px] text-left p-4 rounded-lg border transition-colors ${
                        isSpecial
                          ? "border-amber-400/50 bg-amber-500/5 hover:border-amber-500"
                          : "border-border hover:border-primary hover:bg-primary/5"
                      }`}
                      onClick={() => handleSelectPreset(preset)}
                    >
                      <div className="flex h-full flex-col gap-2">
                        <div className="flex items-start justify-between gap-2">
                          <p className="font-medium text-base leading-6">{highlightMatch(preset.name, searchQuery)}</p>
                          <button
                            type="button"
                            className="shrink-0"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleFavorite(preset.id);
                            }}
                            title="В избранное"
                          >
                            <Star className={`h-4 w-4 ${isFavorite ? "fill-current text-yellow-500" : "text-muted-foreground"}`} />
                          </button>
                        </div>

                        <p className="text-sm text-muted-foreground leading-5">
                          {highlightMatch(preset.description || "", searchQuery)}
                        </p>

                        <div className="mt-auto space-y-1 text-sm">
                          <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">Цена</span>
                            <span className="font-semibold tabular-nums">{PRICE_TEXT(preset)}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">Рынок</span>
                            <span className="tabular-nums">{MARKET_TEXT(preset)}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">Ед.</span>
                            <span>{preset.unit}</span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-2">
                          <Badge variant="outline" className="text-[11px]">
                            {preset.category}
                          </Badge>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-7 px-2 text-xs"
                            onClick={(e) => {
                              e.stopPropagation();
                              hidePreset(preset.id);
                            }}
                          >
                            Скрыть
                          </Button>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              {historyIds.length > 0 && (
                <div className="pb-4 pr-4">
                  <div className="rounded-lg border p-3">
                    <p className="text-sm font-medium flex items-center gap-2 mb-2">
                      <History className="h-4 w-4" /> Последние выбранные
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {historyIds.slice(0, 6).map((id) => {
                        const preset = mergedCatalog.find((item) => item.id === id);
                        if (!preset) return null;
                        return (
                          <Button
                            key={id}
                            variant="outline"
                            size="sm"
                            className="h-8 text-xs"
                            onClick={() => handleSelectPreset(preset)}
                          >
                            {preset.name}
                          </Button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <Package className="h-10 w-10 mx-auto mb-3 opacity-40" />
              <p className="text-sm">Ничего не найдено</p>
              {onAddNew && (
                <Button variant="link" size="sm" onClick={onAddNew} className="mt-2">
                  <Plus className="h-4 w-4 mr-1" />
                  Создать новую позицию
                </Button>
              )}
            </div>
          )}
        </ScrollArea>
      </div>

      {onAddNew && (
        <div className="pt-3 border-t mt-3 shrink-0">
          <Button variant="outline" size="sm" className="w-full" onClick={onAddNew}>
            <Plus className="h-4 w-4 mr-2" />
            Добавить новую позицию
          </Button>
        </div>
      )}
    </div>
  );
};

export default memo(PresetSearch);
