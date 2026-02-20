import { memo, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Trash2, Copy, ChevronDown, ChevronUp } from "lucide-react";
import { LineItem, LINE_ITEM_TYPES } from "@/types/estimator";
import { useDebouncedCallback } from "@/hooks/useDebounce";
import FieldWithTooltip from "./FieldWithTooltip";

const UNITS = [
  { value: "шт", label: "шт" },
  { value: "м.п.", label: "м.п." },
  { value: "м²", label: "м²" },
  { value: "м³", label: "м³" },
  { value: "компл.", label: "компл." },
  { value: "услуга", label: "услуга" },
  { value: "час", label: "час" },
  { value: "точка", label: "точка" },
];

interface MobileLineItemCardProps {
  item: LineItem;
  index: number;
  onUpdate: (id: string, field: keyof LineItem, value: any) => void;
  onDelete: (id: string) => void;
  onDuplicate: (item: LineItem) => void;
  readOnly?: boolean;
  hidePrices?: boolean;
}

const MobileLineItemCard = memo(({
  item, index, onUpdate, onDelete, onDuplicate, readOnly, hidePrices,
}: MobileLineItemCardProps) => {
  const [expanded, setExpanded] = useState(false);
  const [localDescription, setLocalDescription] = useState(item.description);
  const [localQuantity, setLocalQuantity] = useState(String(item.quantity));
  const [localPrice, setLocalPrice] = useState(String(item.unit_price));

  const debouncedDescUpdate = useDebouncedCallback(
    (value: string) => onUpdate(item.id, "description", value), 400
  );
  const debouncedQuantityUpdate = useDebouncedCallback(
    (value: number) => onUpdate(item.id, "quantity", value), 300
  );
  const debouncedPriceUpdate = useDebouncedCallback(
    (value: number) => onUpdate(item.id, "unit_price", value), 300
  );

  const handleDescriptionChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalDescription(e.target.value);
    debouncedDescUpdate(e.target.value);
  }, [debouncedDescUpdate]);

  const handleQuantityChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalQuantity(e.target.value);
    debouncedQuantityUpdate(parseFloat(e.target.value) || 0);
  }, [debouncedQuantityUpdate]);

  const handlePriceChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalPrice(e.target.value);
    debouncedPriceUpdate(parseFloat(e.target.value) || 0);
  }, [debouncedPriceUpdate]);

  return (
    <div className="border rounded-lg p-3 bg-card">
      {/* Header row */}
      <div className="flex items-start gap-2">
        <span className="text-xs text-muted-foreground font-mono mt-2.5 shrink-0 w-5 text-center">
          {index + 1}
        </span>
        <div className="flex-1 min-w-0">
          <Input
            value={localDescription}
            onChange={handleDescriptionChange}
            className="h-10 text-sm font-medium"
            placeholder="Описание позиции"
            disabled={readOnly}
          />
        </div>
        <Button variant="ghost" size="icon" className="h-10 w-10 shrink-0"
          onClick={() => setExpanded(!expanded)}>
          {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </Button>
      </div>

      {/* Quick summary row */}
      <div className="flex items-center justify-between mt-2 ml-7">
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <span>{item.quantity} {item.unit || "шт"}</span>
          {!hidePrices && (
            <>
              <span>×</span>
              <span>{item.unit_price.toLocaleString("ru-RU")}</span>
            </>
          )}
        </div>
        {!hidePrices && (
          <span className="font-bold text-sm tabular-nums">
            {item.line_total.toLocaleString("ru-RU")} ₽
          </span>
        )}
      </div>

      {/* Expanded details */}
      {expanded && (
        <div className="mt-3 ml-7 space-y-3 pt-3 border-t">
          <div className="grid grid-cols-2 gap-2">
            <FieldWithTooltip label="Тип" tooltip="Выберите: работа / материал / прочее.">
              <Select value={item.item_type} onValueChange={(v) => onUpdate(item.id, "item_type", v)} disabled={readOnly}>
                <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
                <SelectContent className="z-[200] bg-popover">
                  {LINE_ITEM_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FieldWithTooltip>
            <FieldWithTooltip label="Ед. изм." tooltip="Например: шт, м, м.п., час.">
              <Select value={item.unit || "шт"} onValueChange={(v) => onUpdate(item.id, "unit", v)} disabled={readOnly}>
                <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
                <SelectContent className="z-[200] bg-popover">
                  {UNITS.map((unit) => (
                    <SelectItem key={unit.value} value={unit.value}>{unit.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FieldWithTooltip>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <FieldWithTooltip label="Количество" tooltip="Сколько единиц работы или материала.">
              <Input type="number" inputMode="decimal" min="0" step="0.01"
                value={localQuantity} onChange={handleQuantityChange}
                className="h-10 text-right" disabled={readOnly} />
            </FieldWithTooltip>
            {!hidePrices && (
              <FieldWithTooltip label="Цена" tooltip="Цена за одну единицу.">
                <Input type="number" inputMode="decimal" min="0" step="0.01"
                  value={localPrice} onChange={handlePriceChange}
                  className="h-10 text-right" disabled={readOnly} />
              </FieldWithTooltip>
            )}
          </div>

          {/* Actions */}
          {!readOnly && (
            <div className="flex gap-2 pt-2">
              <Button variant="outline" size="sm" className="flex-1 h-10"
                onClick={() => onDuplicate(item)}>
                <Copy className="h-4 w-4 mr-1.5" /> Дублировать
              </Button>
              <Button variant="outline" size="sm"
                className="h-10 text-destructive hover:text-destructive"
                onClick={() => onDelete(item.id)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
});

MobileLineItemCard.displayName = "MobileLineItemCard";

export default MobileLineItemCard;
