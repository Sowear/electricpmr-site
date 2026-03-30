import { useState, useMemo, useCallback, memo } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, Plus, Package } from "lucide-react";
import { LineItemPreset } from "@/types/estimator";

interface PresetSearchProps {
  presets: LineItemPreset[];
  onSelect: (preset: LineItemPreset) => void;
  onAddNew?: () => void;
}

const ELECTRICAL_KEYWORDS = [
  "электро",
  "электрик",
  "кабел",
  "провод",
  "розет",
  "выключ",
  "щит",
  "автомат",
  "узо",
  "диф",
  "свет",
  "освещ",
  "люстр",
  "светиль",
  "штроб",
  "гофр",
  "подрозет",
  "распред",
  "монтаж",
  "демонтаж",
  "слаботоч",
  "интернет",
  "tv",
  "видеонаблюд",
  "заземл",
  "контур",
  "реле",
  "датчик",
];

const SUPPORT_KEYWORDS = ["расходн", "крепеж", "доставка", "транспорт", "выезд"];

const SEARCH_ALIASES: Record<string, string[]> = {
  розетка: ["розет", "подрозет"],
  штроба: ["штроб", "штроблен"],
  кабель: ["кабел", "провод"],
  свет: ["освещ", "светиль", "люстр"],
  щит: ["щит", "автомат", "узо", "диф"],
  интернет: ["слаботоч", "витая", "lan", "tv"],
};

const normalize = (value: string) => value.toLowerCase().replace(/ё/g, "е").trim();

const isElectricalPreset = (preset: LineItemPreset) => {
  const searchable = normalize(`${preset.name} ${preset.description || ""} ${preset.category || ""}`);
  return (
    ELECTRICAL_KEYWORDS.some((keyword) => searchable.includes(keyword)) ||
    SUPPORT_KEYWORDS.some((keyword) => searchable.includes(keyword))
  );
};

const getTokenVariants = (token: string) => {
  const normalizedToken = normalize(token);
  return [normalizedToken, ...(SEARCH_ALIASES[normalizedToken] || [])];
};

const scorePreset = (preset: LineItemPreset, queryTokens: string[]) => {
  if (!queryTokens.length) return 0;

  const name = normalize(preset.name);
  const description = normalize(preset.description || "");
  const category = normalize(preset.category || "");

  return queryTokens.reduce((total, token) => {
    const variants = getTokenVariants(token);

    if (variants.some((variant) => name.startsWith(variant))) return total + 4;
    if (variants.some((variant) => name.includes(variant))) return total + 3;
    if (variants.some((variant) => description.includes(variant))) return total + 2;
    if (variants.some((variant) => category.includes(variant))) return total + 1;

    return total;
  }, 0);
};

const highlightMatch = (text: string, queryText: string) => {
  const normalizedQuery = normalize(queryText);
  if (!normalizedQuery) return text;

  const escaped = normalizedQuery.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
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

const PresetSearch = ({ presets, onSelect, onAddNew }: PresetSearchProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const electricalPresets = useMemo(
    () => presets.filter((preset) => isElectricalPreset(preset)),
    [presets],
  );

  const categories = useMemo(() => {
    const cats = new Set<string>();
    electricalPresets.forEach((preset) => {
      if (preset.category) cats.add(preset.category);
    });
    return Array.from(cats);
  }, [electricalPresets]);

  const filteredPresets = useMemo(() => {
    const query = normalize(searchQuery);
    const queryTokens = query.split(/\s+/).filter(Boolean);

    return electricalPresets
      .filter((preset) => {
        const searchable = normalize(`${preset.name} ${preset.description || ""} ${preset.category || ""}`);
        const matchesSearch =
          queryTokens.length === 0 ||
          queryTokens.every((token) =>
            getTokenVariants(token).some((variant) => searchable.includes(variant)),
          );

        const matchesCategory = !selectedCategory || preset.category === selectedCategory;
        return matchesSearch && matchesCategory;
      })
      .sort((a, b) => {
        if (!queryTokens.length) return a.name.localeCompare(b.name, "ru");
        return scorePreset(b, queryTokens) - scorePreset(a, queryTokens);
      });
  }, [electricalPresets, searchQuery, selectedCategory]);

  const handleSelectCategory = useCallback((category: string | null) => {
    setSelectedCategory(category);
  }, []);

  const handleSelectPreset = useCallback(
    (preset: LineItemPreset) => {
      onSelect(preset);
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
          placeholder="Поиск: розетка, штроба, кабель..."
          className="pl-10 h-11 text-base"
          autoFocus
        />
      </div>

      <div className="flex flex-wrap gap-1.5 mb-3 shrink-0">
        <Badge
          variant={selectedCategory === null ? "default" : "outline"}
          className="cursor-pointer text-xs"
          onClick={() => handleSelectCategory(null)}
        >
          Все ({electricalPresets.length})
        </Badge>
        {categories.map((category) => (
          <Badge
            key={category}
            variant={selectedCategory === category ? "default" : "outline"}
            className="cursor-pointer text-xs"
            onClick={() => handleSelectCategory(category)}
          >
            {category}
          </Badge>
        ))}
      </div>

      <div className="flex-1 min-h-0 overflow-hidden">
        <ScrollArea className="h-full">
          {filteredPresets.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pr-4 pb-4">
              {filteredPresets.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  className="h-full min-h-[170px] text-left p-4 rounded-lg border border-border hover:border-primary hover:bg-primary/5 transition-colors"
                  onClick={() => handleSelectPreset(preset)}
                >
                  <div className="flex h-full flex-col gap-2">
                    <p className="font-medium text-base leading-6">{highlightMatch(preset.name, searchQuery)}</p>
                    <p className="text-sm text-muted-foreground leading-5">
                      {highlightMatch(preset.description || "", searchQuery)}
                    </p>
                    <div className="mt-auto pt-2 text-sm text-muted-foreground tabular-nums">
                      {preset.unit_price?.toLocaleString("ru-RU")} руб / {preset.unit}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <Package className="h-10 w-10 mx-auto mb-3 opacity-40" />
              <p className="text-sm">Ничего не найдено</p>
              {onAddNew && (
                <Button variant="link" size="sm" onClick={onAddNew} className="mt-2">
                  <Plus className="h-4 w-4 mr-1" />
                  Создать новый пресет
                </Button>
              )}
            </div>
          )}
        </ScrollArea>
      </div>

      {onAddNew && filteredPresets.length > 0 && (
        <div className="pt-3 border-t mt-3 shrink-0">
          <Button variant="outline" size="sm" className="w-full" onClick={onAddNew}>
            <Plus className="h-4 w-4 mr-2" />
            Добавить новый пресет
          </Button>
        </div>
      )}
    </div>
  );
};

export default memo(PresetSearch);
