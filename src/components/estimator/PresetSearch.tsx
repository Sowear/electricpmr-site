import { useState, useMemo, useCallback, memo } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, Plus, Package } from "lucide-react";
import { LineItemPreset } from "@/types/estimator";
import { useDebounce } from "@/hooks/useDebounce";

interface PresetSearchProps {
  presets: LineItemPreset[];
  onSelect: (preset: LineItemPreset) => void;
  onAddNew?: () => void;
}

const PresetItem = memo(({ 
  preset, 
  onSelect 
}: { 
  preset: LineItemPreset; 
  onSelect: (preset: LineItemPreset) => void;
}) => (
  <button
    type="button"
    className="w-full text-left p-3 rounded-lg border border-border hover:border-primary hover:bg-primary/5 transition-colors"
    onClick={() => onSelect(preset)}
  >
    <div className="flex items-start justify-between gap-2">
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm truncate">{preset.name}</p>
        <p className="text-xs text-muted-foreground truncate mt-0.5">
          {preset.description}
        </p>
      </div>
      <div className="text-right shrink-0">
        <p className="font-semibold text-sm">
          {preset.unit_price?.toLocaleString("ru-RU")} ₽
        </p>
        <p className="text-xs text-muted-foreground">
          / {preset.unit}
        </p>
      </div>
    </div>
  </button>
));

PresetItem.displayName = "PresetItem";

const PresetSearch = ({ presets, onSelect, onAddNew }: PresetSearchProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedQuery = useDebounce(searchQuery, 150);

  const categories = useMemo(() => {
    const cats = new Set<string>();
    presets.forEach((p) => {
      if (p.category) cats.add(p.category);
    });
    return Array.from(cats);
  }, [presets]);

  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const filteredPresets = useMemo(() => {
    const query = debouncedQuery.toLowerCase().trim();
    
    return presets.filter((preset) => {
      const matchesSearch = !query || 
        preset.name.toLowerCase().includes(query) ||
        preset.description.toLowerCase().includes(query) ||
        preset.category?.toLowerCase().includes(query);
      
      const matchesCategory = !selectedCategory || preset.category === selectedCategory;
      
      return matchesSearch && matchesCategory;
    });
  }, [presets, debouncedQuery, selectedCategory]);

  const handleSelectCategory = useCallback((cat: string | null) => {
    setSelectedCategory(cat);
  }, []);

  const handleSelectPreset = useCallback((preset: LineItemPreset) => {
    onSelect(preset);
  }, [onSelect]);

  // Highlight search matches
  const highlightMatch = useCallback((text: string, query: string) => {
    if (!query.trim()) return text;
    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);
    return parts.map((part, i) => 
      regex.test(part) ? <mark key={i} className="bg-primary/20 text-foreground rounded px-0.5">{part}</mark> : part
    );
  }, []);

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Search Input */}
      <div className="relative mb-3 shrink-0">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Поиск по названию или категории..."
          className="pl-10"
          autoFocus
        />
      </div>

      {/* Category Filters */}
      <div className="flex flex-wrap gap-1.5 mb-3 shrink-0">
        <Badge
          variant={selectedCategory === null ? "default" : "outline"}
          className="cursor-pointer text-xs"
          onClick={() => handleSelectCategory(null)}
        >
          Все ({presets.length})
        </Badge>
        {categories.map((cat) => (
          <Badge
            key={cat}
            variant={selectedCategory === cat ? "default" : "outline"}
            className="cursor-pointer text-xs"
            onClick={() => handleSelectCategory(cat)}
          >
            {cat}
          </Badge>
        ))}
      </div>

      {/* Results - Scrollable container with proper height */}
      <div className="flex-1 min-h-0 overflow-hidden">
        <ScrollArea className="h-full">
          {filteredPresets.length > 0 ? (
            <div className="grid gap-2 pr-4 pb-4">
              {filteredPresets.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  className="w-full text-left p-3 rounded-lg border border-border hover:border-primary hover:bg-primary/5 transition-colors"
                  onClick={() => handleSelectPreset(preset)}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm">
                        {highlightMatch(preset.name, debouncedQuery)}
                      </p>
                      <p className="text-xs text-muted-foreground truncate mt-0.5">
                        {highlightMatch(preset.description, debouncedQuery)}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-semibold text-sm tabular-nums">
                        {preset.unit_price?.toLocaleString("ru-RU")} ₽
                      </p>
                      <p className="text-xs text-muted-foreground">
                        / {preset.unit}
                      </p>
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
                <Button
                  variant="link"
                  size="sm"
                  onClick={onAddNew}
                  className="mt-2"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Создать новый пресет
                </Button>
              )}
            </div>
          )}
        </ScrollArea>
      </div>

      {/* Add New Button - Fixed at bottom */}
      {onAddNew && filteredPresets.length > 0 && (
        <div className="pt-3 border-t mt-3 shrink-0">
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={onAddNew}
          >
            <Plus className="h-4 w-4 mr-2" />
            Добавить новый пресет
          </Button>
        </div>
      )}
    </div>
  );
};

export default memo(PresetSearch);
