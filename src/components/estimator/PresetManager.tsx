import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
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

interface PresetManagerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const CATEGORIES = [
  "Электромонтаж",
  "Щитовое оборудование",
  "Освещение",
  "Розетки и выключатели",
  "Слаботочные системы",
  "Заземление",
  "Прочее",
];

const UNITS = ["шт", "м", "м²", "точка", "комплект", "услуга"];

const PresetManager = ({ open, onOpenChange }: PresetManagerProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category: "",
    unit: "шт",
    unit_price: 0,
    labor_hours: 0,
    labor_rate: 0,
  });

  const createPreset = useMutation({
    mutationFn: async (data: typeof formData) => {
      const { error } = await supabase.from("line_item_presets").insert({
        name: data.name,
        description: data.description,
        category: data.category || null,
        unit: data.unit,
        unit_price: data.unit_price,
        labor_hours: data.labor_hours,
        labor_rate: data.labor_rate,
        item_type: "service",
        is_active: true,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["line-item-presets"] });
      toast({ title: "Пресет создан" });
      onOpenChange(false);
      setFormData({
        name: "",
        description: "",
        category: "",
        unit: "шт",
        unit_price: 0,
        labor_hours: 0,
        labor_rate: 0,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Ошибка",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast({
        title: "Ошибка",
        description: "Укажите название пресета",
        variant: "destructive",
      });
      return;
    }
    createPreset.mutate(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Новый пресет</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Название *</Label>
            <Input
              value={formData.name}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, name: e.target.value }))
              }
              placeholder="Установка розетки"
            />
          </div>

          <div>
            <Label>Описание</Label>
            <Textarea
              value={formData.description}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, description: e.target.value }))
              }
              placeholder="Подробное описание услуги..."
              rows={2}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Категория</Label>
              <Select
                value={formData.category}
                onValueChange={(v) =>
                  setFormData((prev) => ({ ...prev, category: v }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Выберите..." />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Единица</Label>
              <Select
                value={formData.unit}
                onValueChange={(v) =>
                  setFormData((prev) => ({ ...prev, unit: v }))
                }
              >
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
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label>Цена</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={formData.unit_price}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    unit_price: parseFloat(e.target.value) || 0,
                  }))
                }
              />
            </div>
            <div>
              <Label>Часы работы</Label>
              <Input
                type="number"
                min="0"
                step="0.5"
                value={formData.labor_hours}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    labor_hours: parseFloat(e.target.value) || 0,
                  }))
                }
              />
            </div>
            <div>
              <Label>Ставка/час</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={formData.labor_rate}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    labor_rate: parseFloat(e.target.value) || 0,
                  }))
                }
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Отмена
            </Button>
            <Button type="submit" disabled={createPreset.isPending}>
              {createPreset.isPending && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              Создать
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default PresetManager;
