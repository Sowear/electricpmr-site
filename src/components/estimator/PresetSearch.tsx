import { useState, useMemo, useCallback, memo } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, Plus, Package, Star, History, Zap, Wrench, Loader2, Edit2, Trash2 } from "lucide-react";
import { LineItemPreset } from "@/types/estimator";

const LS_FAVORITES_KEY = "estimate_catalog_favorites";
const LS_HISTORY_KEY = "estimate_catalog_history";

interface PresetSearchProps {
  presets: LineItemPreset[];
  isLoading?: boolean;
  isError?: boolean;
  errorMessage?: string;
  onSelect: (preset: LineItemPreset) => void;
  onAddNew?: () => void;
  onEditPreset?: (preset: LineItemPreset) => void;
  onDeletePreset?: (id: string) => void;
}

const CATEGORY_LABELS: Record<string, string> = {
  sockets: "Розетки",
  lighting: "Освещение",
  cable: "Кабель",
  panels: "Щиты",
  outdoor: "Улица",
  additional: "Дополнительно",
  other: "Прочее",
};

const FILTERS = [
  { key: "all", label: "Все" },
  { key: "favorites", label: "Избранное" },
  { key: "recent", label: "История" },
  { key: "popular", label: "Популярные" },
  { key: "sockets", label: "Розетки" },
  { key: "lighting", label: "Освещение" },
  { key: "cable", label: "Кабель" },
  { key: "panels", label: "Щиты" },
  { key: "outdoor", label: "Улица" },
  { key: "additional", label: "Дополнительно" },
] as const;

type FilterKey = (typeof FILTERS)[number]["key"];

const SEARCH_ALIASES: Record<string, string[]> = {
  розетка: ["розетки", "роз", "подрозет"],
  розетки: ["розетка", "роз", "подрозет"],
  роз: ["розетка", "розетки", "подрозет"],
  кабель: ["кабел", "провод", "линия"],
  кабеля: ["кабель", "провод", "линия"],
  штроба: ["штроб", "штробление"],
  штробление: ["штроба", "штроб"],
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

const RELATED_PRESET_HINTS: Array<{ trigger: string; related: string[] }> = [
  {
    trigger: "штроб",
    related: [
      "Прокладка кабеля в штробе",
      "Монтаж подрозетника (бетон)",
      "Монтаж распределительной коробки",
      "Штробление",
    ],
  },
  {
    trigger: "розет",
    related: [
      "Установка розетки / выключателя",
      "Монтаж подрозетника (бетон)",
      "Монтаж подрозетника (гипсокартон)",
      "Монтаж распределительной коробки",
    ],
  },
];

const normalize = (value: string) => value.toLowerCase().replace(/ё/g, "е").trim();

const getTokenVariants = (token: string) => {
  const normalizedToken = normalize(token);
  const corrected = MISSPELLINGS[normalizedToken] || normalizedToken;
  return [corrected, ...(SEARCH_ALIASES[corrected] || [])];
};

const readFromLS = (key: string): string[] => {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === "string") : [];
  } catch {
    return [];
  }
};

const writeToLS = (key: string, value: string[]) => {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore local storage write errors
  }
};

const computeMarketRange = (preset: LineItemPreset) => {
  if (typeof preset.market_min === "number" && typeof preset.market_max === "number") {
    return { min: preset.market_min, max: preset.market_max };
  }
  const base = preset.base_price ?? preset.unit_price ?? 0;
  return { min: Math.round(base * 0.7), max: Math.round(base * 1.3) };
};

const getComplexityBadge = (complexity?: "low" | "medium" | "high") => {
  if (complexity === "high") return "Высокая";
  if (complexity === "medium") return "Средняя";
  return "Низкая";
};

const scorePreset = (preset: LineItemPreset, tokens: string[]) => {
  if (!tokens.length) return preset.popularity_score || 0;

  const name = normalize(preset.name);
  const tags = normalize((preset.tags || []).join(" "));
  const description = normalize(preset.description || "");

  return tokens.reduce((sum, token) => {
    const variants = getTokenVariants(token);
    if (variants.some((variant) => name.includes(variant))) return sum + 8;
    if (variants.some((variant) => tags.includes(variant))) return sum + 5;
    if (variants.some((variant) => description.includes(variant))) return sum + 3;
    return sum;
  }, preset.popularity_score || 0);
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

const PresetSearch = ({ presets, isLoading, isError, errorMessage, onSelect, onAddNew, onEditPreset, onDeletePreset }: PresetSearchProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<FilterKey>("all");
  const [favorites, setFavorites] = useState<string[]>(() => readFromLS(LS_FAVORITES_KEY));
  const [history, setHistory] = useState<string[]>(() => readFromLS(LS_HISTORY_KEY));

  const tokens = useMemo(() => normalize(searchQuery).split(/\s+/).filter(Boolean), [searchQuery]);

  const relatedNames = useMemo(() => {
    if (!tokens.length) return [] as string[];
    const list = new Set<string>();

    RELATED_PRESET_HINTS.forEach((hint) => {
      if (tokens.some((token) => token.includes(hint.trigger))) {
        hint.related.forEach((name) => list.add(name));
      }
    });

    return Array.from(list);
  }, [tokens]);

  const filteredPresets = useMemo(() => {
    const query = normalize(searchQuery);

    return presets
      .filter((preset) => {
        const haystack = normalize(
          `${preset.name} ${preset.description || ""} ${(preset.tags || []).join(" ")} ${(preset.synonyms || []).join(" ")}`,
        );

        const matchesSearch =
          !query ||
          tokens.every((token) => getTokenVariants(token).some((variant) => haystack.includes(variant)));

        if (!matchesSearch) return false;

        if (activeFilter === "all") return true;
        if (activeFilter === "favorites") return favorites.includes(preset.id);
        if (activeFilter === "recent") return history.includes(preset.id);
        if (activeFilter === "popular") return (preset.popularity_score || 0) >= 8;
        return preset.category_key === activeFilter;
      })
      .sort((a, b) => {
        const relatedBoostA = relatedNames.includes(a.name) ? 5 : 0;
        const relatedBoostB = relatedNames.includes(b.name) ? 5 : 0;
        return scorePreset(b, tokens) + relatedBoostB - (scorePreset(a, tokens) + relatedBoostA);
      });
  }, [activeFilter, favorites, history, presets, relatedNames, searchQuery, tokens]);

  const suggestions = useMemo(() => {
    if (!searchQuery) {
      return presets
        .filter((preset) => (preset.popularity_score || 0) >= 8)
        .slice(0, 6)
        .map((preset) => preset.name);
    }
    return filteredPresets.slice(0, 6).map((preset) => preset.name);
  }, [filteredPresets, presets, searchQuery]);

  const toggleFavorite = useCallback((id: string) => {
    setFavorites((prev) => {
      const next = prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id];
      writeToLS(LS_FAVORITES_KEY, next);
      return next;
    });
  }, []);

  const selectPreset = useCallback(
    (preset: LineItemPreset) => {
      onSelect(preset);
      setHistory((prev) => {
        const next = [preset.id, ...prev.filter((id) => id !== preset.id)].slice(0, 20);
        writeToLS(LS_HISTORY_KEY, next);
        return next;
      });
    },
    [onSelect],
  );

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

      {suggestions.length > 0 && (
        <div className="mb-3 shrink-0">
          <p className="text-xs text-muted-foreground mb-1">Автоподсказки</p>
          <div className="flex flex-wrap gap-1.5">
            {suggestions.map((name) => (
              <Button key={name} variant="outline" size="sm" className="h-8 text-xs" onClick={() => setSearchQuery(name)}>
                {name}
              </Button>
            ))}
          </div>
        </div>
      )}

      <div className="flex-1 min-h-0 overflow-hidden">
        <ScrollArea className="h-full">
          {isLoading ? (
            <div className="text-center py-12 text-muted-foreground">
              <Loader2 className="h-10 w-10 mx-auto mb-3 opacity-40 animate-spin" />
              <p className="text-sm">Загрузка каталога...</p>
            </div>
          ) : isError ? (
            <div className="text-center py-12 text-muted-foreground">
              <Package className="h-10 w-10 mx-auto mb-3 opacity-40" />
              <p className="text-sm">Ошибка загрузки каталога</p>
              <p className="text-xs mt-1">{errorMessage || "Попробуйте обновить страницу"}</p>
            </div>
          ) : presets.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Package className="h-10 w-10 mx-auto mb-3 opacity-40" />
              <p className="text-sm">Каталог пуст. Добавьте позиции.</p>
              {onAddNew && (
                <Button variant="link" size="sm" onClick={onAddNew} className="mt-2">
                  <Plus className="h-4 w-4 mr-1" />
                  Создать новую позицию
                </Button>
              )}
            </div>
          ) : filteredPresets.length > 0 ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-3 pr-4 pb-4">
                {filteredPresets.map((preset) => {
                  const market = computeMarketRange(preset);
                  const isFavorite = favorites.includes(preset.id);
                  const isSpecial = preset.category_key === "additional";

                  return (
                    <button
                      key={preset.id}
                      type="button"
                      className={`h-full min-h-[210px] text-left p-4 rounded-xl border transition-all duration-300 shadow-sm hover:shadow-md relative group/card overflow-hidden ${
                        isSpecial
                          ? "border-amber-400/50 bg-gradient-to-br from-amber-500/5 to-amber-500/10 hover:border-amber-500"
                          : "border-border hover:border-primary/50 bg-gradient-to-br from-background to-muted/20 hover:to-primary/5"
                      }`}
                      onClick={() => selectPreset(preset)}
                    >
                      <div className="flex h-full flex-col gap-2 relative z-10">
                        <div className="flex items-start justify-between gap-2">
                          <p className="font-semibold text-[15px] leading-snug">{highlightMatch(preset.name, searchQuery)}</p>
                          <div className="flex items-center gap-1 shrink-0 bg-background/50 backdrop-blur rounded-md p-0.5">
                            {onEditPreset && (
                              <button
                                type="button"
                                className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onEditPreset(preset);
                                }}
                                title="Редактировать позицию"
                              >
                                <Edit2 className="h-4 w-4" />
                              </button>
                            )}
                            {onDeletePreset && (
                              <button
                                type="button"
                                className="p-1.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onDeletePreset(preset.id);
                                }}
                                title="Удалить позицию"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            )}
                            <button
                              type="button"
                              className="p-1.5 rounded hover:bg-muted transition-colors"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleFavorite(preset.id);
                              }}
                              title={isFavorite ? "Убрать из избранного" : "Добавить в избранное"}
                            >
                              <Star className={`h-4 w-4 ${isFavorite ? "fill-current text-yellow-500" : "text-muted-foreground hover:text-foreground"}`} />
                            </button>
                          </div>
                        </div>

                        <p className="text-sm text-muted-foreground leading-5">{highlightMatch(preset.description || "", searchQuery)}</p>

                        <div className="space-y-1 text-sm mt-auto">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Цена</span>
                            <span className="font-semibold tabular-nums">
                              {preset.special_type === "height_markup"
                                ? "+20%"
                                : preset.special_type === "dismantle_percent"
                                ? "50%"
                                : preset.special_type === "emergency_contract"
                                ? "Договорная"
                                : (preset.base_price ?? preset.unit_price).toLocaleString("ru-RU")}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Рынок</span>
                            <span className="tabular-nums">
                              {preset.special_type === "emergency_contract"
                                ? "-"
                                : `${market.min.toLocaleString("ru-RU")}-${market.max.toLocaleString("ru-RU")}${preset.unit === "%" ? "%" : ""}`}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Ед.</span>
                            <span>{preset.unit}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground flex items-center gap-1">
                              <Wrench className="h-3.5 w-3.5" /> Сложность
                            </span>
                            <span>{getComplexityBadge(preset.complexity)}</span>
                          </div>
                        </div>

                        <div className="flex justify-between items-center pt-2">
                          <Badge variant="outline" className="text-[11px]">
                            {CATEGORY_LABELS[preset.category_key || preset.category] || preset.category}
                          </Badge>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Zap className="h-3.5 w-3.5" /> {preset.popularity_score || 0}
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              {history.length > 0 && (
                <div className="pb-4 pr-4">
                  <div className="rounded-lg border p-3">
                    <p className="text-sm font-medium flex items-center gap-2 mb-2">
                      <History className="h-4 w-4" /> Последние выбранные
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {history.slice(0, 8).map((id) => {
                        const preset = presets.find((item) => item.id === id);
                        if (!preset) return null;
                        return (
                          <Button
                            key={id}
                            variant="outline"
                            size="sm"
                            className="h-8 text-xs"
                            onClick={() => selectPreset(preset)}
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
