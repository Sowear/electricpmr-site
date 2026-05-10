import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  useCreateCatalogItem,
  useHiddenLineItemPresets,
  useHideCatalogItem,
  useLineItemPresets,
  useUpdateCatalogItem,
} from "@/hooks/useEstimates";
import { LineItemPreset } from "@/types/estimator";

interface PresetManagerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  presetToEdit?: LineItemPreset | null;
  onCloseEdit?: () => void;
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
const CATEGORIES = Object.keys(CATEGORY_LABELS);

const UNITS = ["шт", "м", "м²", "точка", "линия", "объект", "комплект", "%", "договорная", "услуга"];

const ESTIMATION_TYPES = [
  { value: "piece", label: "Штука" },
  { value: "meter", label: "Метр" },
  { value: "point", label: "Точка" },
  { value: "line", label: "Линия" },
  { value: "object", label: "Объект" },
  { value: "set", label: "Комплект" },
  { value: "percent", label: "Процент" },
  { value: "contract", label: "Договорная" },
];

const splitCSV = (value: string) =>
  value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

const PresetManager = ({ open, onOpenChange, presetToEdit, onCloseEdit }: PresetManagerProps) => {
  const { toast } = useToast();
  const createCatalogItem = useCreateCatalogItem();
  const updateCatalogItem = useUpdateCatalogItem();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category: "sockets",
    unit: "шт",
    base_price: 0,
    market_min: 0,
    market_max: 0,
    tags: "",
    synonyms: "",
    complexity: "low" as "low" | "medium" | "high",
    popularity_score: 0,
    calc_default: "piece",
  });

  const resetForm = () => {
    setEditingId(null);
    setFormData({
      name: "",
      description: "",
      category: "sockets",
      unit: "шт",
      base_price: 0,
      market_min: 0,
      market_max: 0,
      tags: "",
      synonyms: "",
      complexity: "low",
      popularity_score: 0,
      calc_default: "piece",
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast({ title: "Ошибка", description: "Укажите название позиции", variant: "destructive" });
      return;
    }
    if (formData.base_price < 0) {
      toast({ title: "Ошибка", description: "Цена не может быть отрицательной", variant: "destructive" });
      return;
    }
    if (formData.market_min > formData.market_max) {
      toast({
        title: "Ошибка",
        description: "Минимальная рыночная цена не может быть больше максимальной",
        variant: "destructive",
      });
      return;
    }

    const payload = {
      name: formData.name.trim(),
      description: formData.description,
      category: formData.category,
      unit: formData.unit,
      base_price: formData.base_price,
      market_min: formData.market_min,
      market_max: formData.market_max,
      tags: splitCSV(formData.tags),
      synonyms: splitCSV(formData.synonyms),
      complexity: formData.complexity,
      popularity_score: formData.popularity_score,
      calc_default: formData.calc_default,
    };

    if (editingId) {
      updateCatalogItem.mutate(
        { id: editingId, ...payload },
        {
          onSuccess: () => {
            toast({ title: "Позиция обновлена" });
            resetForm();
          },
          onError: (error) => {
            toast({ title: "Ошибка", description: error.message, variant: "destructive" });
          },
        },
      );
      return;
    }

    createCatalogItem.mutate(payload, {
      onSuccess: () => {
        toast({ title: "Позиция создана" });
        resetForm();
      },
      onError: (error) => {
        toast({ title: "Ошибка", description: error.message, variant: "destructive" });
      },
    });
  };

  const startEdit = (item: LineItemPreset) => {
    setEditingId(item.id);
    setFormData({
      name: item.name,
      description: item.description || "",
      category: item.category_key || "other",
      unit: item.unit || "шт",
      base_price: item.base_price ?? item.unit_price ?? 0,
      market_min: item.market_min ?? 0,
      market_max: item.market_max ?? 0,
      tags: (item.tags || []).join(", "),
      synonyms: (item.synonyms || []).join(", "),
      complexity: item.complexity || "low",
      popularity_score: item.popularity_score || 0,
      calc_default: item.calc_default || "piece",
    });
  };

  useEffect(() => {
    if (presetToEdit && open) {
      startEdit(presetToEdit);
    }
  }, [presetToEdit, open]);

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      resetForm();
      if (onCloseEdit) onCloseEdit();
    }
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editingId ? "Редактирование позиции" : "Новая позиция каталога"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div>
            <Label>Название *</Label>
            <Input
              value={formData.name}
                  onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="Установка розетки"
                />
              </div>

              <div>
                <Label>Описание</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                  placeholder="Подробное описание услуги"
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Label>Категория</Label>
                  <Select value={formData.category} onValueChange={(v) => setFormData((prev) => ({ ...prev, category: v }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {CATEGORY_LABELS[cat] || cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Единица</Label>
                  <Select value={formData.unit} onValueChange={(v) => setFormData((prev) => ({ ...prev, unit: v }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {UNITS.map((u) => (
                        <SelectItem key={u} value={u}>
                          {u}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Сложность</Label>
                  <Select
                    value={formData.complexity}
                    onValueChange={(v: "low" | "medium" | "high") => setFormData((prev) => ({ ...prev, complexity: v }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Низкая</SelectItem>
                      <SelectItem value="medium">Средняя</SelectItem>
                      <SelectItem value="high">Высокая</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-3">
                <div>
                  <Label>Цена</Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.base_price}
                    onChange={(e) => setFormData((prev) => ({ ...prev, base_price: parseFloat(e.target.value) || 0 }))}
                  />
                </div>
                <div>
                  <Label>Мин. рынок</Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.market_min}
                    onChange={(e) => setFormData((prev) => ({ ...prev, market_min: parseFloat(e.target.value) || 0 }))}
                  />
                </div>
                <div>
                  <Label>Макс. рынок</Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.market_max}
                    onChange={(e) => setFormData((prev) => ({ ...prev, market_max: parseFloat(e.target.value) || 0 }))}
                  />
                </div>
                <div>
                  <Label>Популярность</Label>
                  <Input
                    type="number"
                    min="0"
                    max="10"
                    step="1"
                    value={formData.popularity_score}
                    onChange={(e) => setFormData((prev) => ({ ...prev, popularity_score: parseInt(e.target.value, 10) || 0 }))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Теги (через запятую)</Label>
                  <Input value={formData.tags} onChange={(e) => setFormData((prev) => ({ ...prev, tags: e.target.value }))} />
                </div>
                <div>
                  <Label>Синонимы (через запятую)</Label>
                  <Input
                    value={formData.synonyms}
                    onChange={(e) => setFormData((prev) => ({ ...prev, synonyms: e.target.value }))}
                  />
                </div>
              </div>

              <div>
                <Label>Тип расчета</Label>
                <Select value={formData.calc_default} onValueChange={(v) => setFormData((prev) => ({ ...prev, calc_default: v }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ESTIMATION_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
              Отмена
            </Button>
            {editingId && (
              <Button type="button" variant="outline" onClick={resetForm}>
                Сбросить
              </Button>
            )}
            <Button type="submit" disabled={createCatalogItem.isPending || updateCatalogItem.isPending}>
              {(createCatalogItem.isPending || updateCatalogItem.isPending) && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              {editingId ? "Сохранить" : "Создать"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default PresetManager;
