import { useState, useCallback, memo, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Plus, 
  Trash2, 
  Copy, 
  GripVertical,
  Package,
  Search
} from "lucide-react";
import { 
  LineItem, 
  LineItemPreset,
  LINE_ITEM_TYPES, 
} from "@/types/estimator";
import { 
  useAddLineItem, 
  useUpdateLineItem, 
  useDeleteLineItem,
  useLineItemPresets,
  useAddFromPreset
} from "@/hooks/useEstimates";
import { useDebouncedCallback } from "@/hooks/useDebounce";
import { useIsMobile } from "@/hooks/use-mobile";
import PresetSearch from "./PresetSearch";
import PresetManager from "./PresetManager";
import MobileLineItemCard from "./MobileLineItemCard";

// Unit options for line items
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

interface LineItemsEditorProps {
  estimateId: string;
  lineItems: LineItem[];
  readOnly?: boolean;
  hidePrices?: boolean;
}

interface LineItemRowProps {
  item: LineItem;
  onUpdate: (id: string, field: keyof LineItem, value: any) => void;
  onDelete: (id: string) => void;
  onDuplicate: (item: LineItem) => void;
  readOnly?: boolean;
  hidePrices?: boolean;
}

const LineItemRow = memo(({ 
  item, 
  onUpdate, 
  onDelete, 
  onDuplicate,
  readOnly,
  hidePrices,
}: LineItemRowProps) => {
  const [localDescription, setLocalDescription] = useState(item.description);
  const [localQuantity, setLocalQuantity] = useState(String(item.quantity));
  const [localPrice, setLocalPrice] = useState(String(item.unit_price));
  
  const debouncedDescUpdate = useDebouncedCallback(
    (value: string) => onUpdate(item.id, "description", value),
    400
  );

  const debouncedQuantityUpdate = useDebouncedCallback(
    (value: number) => onUpdate(item.id, "quantity", value),
    300
  );

  const debouncedPriceUpdate = useDebouncedCallback(
    (value: number) => onUpdate(item.id, "unit_price", value),
    300
  );

  const handleDescriptionChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setLocalDescription(value);
    debouncedDescUpdate(value);
  }, [debouncedDescUpdate]);

  const handleQuantityChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setLocalQuantity(value);
    debouncedQuantityUpdate(parseFloat(value) || 0);
  }, [debouncedQuantityUpdate]);

  const handlePriceChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setLocalPrice(value);
    debouncedPriceUpdate(parseFloat(value) || 0);
  }, [debouncedPriceUpdate]);

  return (
    <TableRow className="group">
      <TableCell className="w-8 p-2">
        <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab opacity-50 group-hover:opacity-100" />
      </TableCell>
      <TableCell className="min-w-[180px] p-2">
        <Input
          value={localDescription}
          onChange={handleDescriptionChange}
          className="border-0 p-0 h-8 focus-visible:ring-1 text-sm bg-transparent"
          placeholder="Описание услуги"
          disabled={readOnly}
        />
      </TableCell>
      <TableCell className="w-[90px] p-2">
        <Select
          value={item.item_type}
          onValueChange={(v) => onUpdate(item.id, "item_type", v)}
          disabled={readOnly}
        >
          <SelectTrigger className="h-8 text-xs border-0 bg-muted/50">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="z-[200] bg-popover border shadow-lg" position="popper" sideOffset={4}>
            {LINE_ITEM_TYPES.map((type) => (
              <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </TableCell>
      <TableCell className="w-[80px] p-2">
        <Select
          value={item.unit || "шт"}
          onValueChange={(v) => onUpdate(item.id, "unit", v)}
          disabled={readOnly}
        >
          <SelectTrigger className="h-8 text-xs border-0 bg-muted/50">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="z-[200] bg-popover border shadow-lg" position="popper" sideOffset={4}>
            {UNITS.map((unit) => (
              <SelectItem key={unit.value} value={unit.value}>{unit.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </TableCell>
      <TableCell className="w-[70px] p-2">
        <Input
          type="number" min="0" step="0.01"
          value={localQuantity}
          onChange={handleQuantityChange}
          className="h-8 w-full text-right text-sm px-2"
          disabled={readOnly}
        />
      </TableCell>
      {!hidePrices && (
        <>
          <TableCell className="w-[90px] p-2">
            <Input
              type="number" min="0" step="0.01"
              value={localPrice}
              onChange={handlePriceChange}
              className="h-8 w-full text-right text-sm px-2"
              disabled={readOnly}
            />
          </TableCell>
          <TableCell className="w-[90px] p-2 text-right">
            <span className="font-semibold text-sm tabular-nums">
              {item.line_total.toLocaleString("ru-RU")}
            </span>
          </TableCell>
        </>
      )}
      <TableCell className="w-[70px] p-2">
        {!readOnly && (
          <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button variant="ghost" size="icon" className="h-7 w-7"
              onClick={() => onDuplicate(item)} title="Дублировать">
              <Copy className="h-3.5 w-3.5" />
            </Button>
            <Button variant="ghost" size="icon"
              className="h-7 w-7 text-destructive hover:text-destructive"
              onClick={() => onDelete(item.id)} title="Удалить">
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        )}
      </TableCell>
    </TableRow>
  );
});

LineItemRow.displayName = "LineItemRow";

const LineItemsEditor = memo(({ estimateId, lineItems, readOnly, hidePrices }: LineItemsEditorProps) => {
  const [presetsOpen, setPresetsOpen] = useState(false);
  const [presetManagerOpen, setPresetManagerOpen] = useState(false);
  const isMobile = useIsMobile();
  
  const { data: presets } = useLineItemPresets();
  const addLineItem = useAddLineItem();
  const updateLineItem = useUpdateLineItem();
  const deleteLineItem = useDeleteLineItem();
  const addFromPreset = useAddFromPreset();

  const handleAddEmpty = useCallback(() => {
    addLineItem.mutate({
      estimateId,
      item: { description: "Новая позиция", item_type: "service", quantity: 1, unit_price: 0 },
    });
  }, [estimateId, addLineItem]);

  const handleAddPreset = useCallback((preset: LineItemPreset) => {
    addFromPreset.mutate({ estimateId, preset });
    setPresetsOpen(false);
  }, [estimateId, addFromPreset]);

  const handleUpdateField = useCallback((itemId: string, field: keyof LineItem, value: any) => {
    updateLineItem.mutate({ id: itemId, estimateId, [field]: value });
  }, [estimateId, updateLineItem]);

  const handleDelete = useCallback((itemId: string) => {
    if (confirm("Удалить позицию?")) {
      deleteLineItem.mutate({ id: itemId, estimateId });
    }
  }, [estimateId, deleteLineItem]);

  const handleDuplicate = useCallback((item: LineItem) => {
    addLineItem.mutate({
      estimateId,
      item: {
        item_type: item.item_type, item_code: item.item_code,
        description: item.description + " (копия)", unit: item.unit,
        quantity: item.quantity, unit_price: item.unit_price,
        labor_hours: item.labor_hours, labor_rate: item.labor_rate,
        markup_pct: item.markup_pct, discount_pct: item.discount_pct, tax_pct: item.tax_pct,
      },
    });
  }, [estimateId, addLineItem]);

  const itemCount = useMemo(() => lineItems.length, [lineItems.length]);

  return (
    <div className="space-y-3">
      {/* Quick Actions - Desktop */}
      {!isMobile && !readOnly && (
        <div className="flex flex-wrap gap-2 sticky top-0 bg-background z-10 py-2 -mt-2 border-b">
          <Button variant="default" size="sm" onClick={handleAddEmpty} disabled={addLineItem.isPending}>
            <Plus className="h-4 w-4 mr-1.5" />
            Добавить
          </Button>
          <Button variant="outline" size="sm" onClick={() => setPresetsOpen(true)}>
            <Search className="h-4 w-4 mr-1.5" />
            Из каталога
          </Button>
          <div className="flex-1" />
          <span className="text-sm text-muted-foreground self-center tabular-nums">
            {itemCount} поз.
          </span>
        </div>
      )}

      {/* Read-only header */}
      {readOnly && !isMobile && (
        <div className="flex justify-between items-center py-2 border-b">
          <span className="text-sm text-muted-foreground">{itemCount} поз.</span>
        </div>
      )}

      {/* Line Items: Desktop Table / Mobile Cards */}
      {lineItems.length > 0 ? (
        isMobile ? (
          <div className="space-y-2">
            {lineItems.map((item, index) => (
              <MobileLineItemCard
                key={item.id} item={item} index={index}
                onUpdate={handleUpdateField} onDelete={handleDelete} onDuplicate={handleDuplicate}
                readOnly={readOnly} hidePrices={hidePrices}
              />
            ))}
          </div>
        ) : (
          <div className="border rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="w-8 p-2"></TableHead>
                    <TableHead className="min-w-[180px] p-2 text-xs">Описание</TableHead>
                    <TableHead className="w-[90px] p-2 text-xs">Тип</TableHead>
                    <TableHead className="w-[80px] p-2 text-xs">Ед.</TableHead>
                    <TableHead className="w-[70px] p-2 text-xs text-right">Кол-во</TableHead>
                    {!hidePrices && (
                      <>
                        <TableHead className="w-[90px] p-2 text-xs text-right">Цена</TableHead>
                        <TableHead className="w-[90px] p-2 text-xs text-right">Итого</TableHead>
                      </>
                    )}
                    <TableHead className="w-[70px] p-2"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lineItems.map((item) => (
                    <LineItemRow
                      key={item.id} item={item}
                      onUpdate={handleUpdateField} onDelete={handleDelete} onDuplicate={handleDuplicate}
                      readOnly={readOnly} hidePrices={hidePrices}
                    />
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )
      ) : (
        <div className="text-center py-12 border rounded-lg bg-muted/10 border-dashed">
          <Package className="h-10 w-10 mx-auto text-muted-foreground/50 mb-3" />
          <p className="text-muted-foreground text-sm mb-3">
            {readOnly ? "Нет позиций" : "Добавьте позиции в смету"}
          </p>
          {!readOnly && (
            <div className="flex gap-2 justify-center">
              <Button size={isMobile ? "default" : "sm"} onClick={handleAddEmpty} className={isMobile ? "h-11" : ""}>
                <Plus className="h-4 w-4 mr-1" /> Новая позиция
              </Button>
              <Button variant="outline" size={isMobile ? "default" : "sm"} onClick={() => setPresetsOpen(true)} className={isMobile ? "h-11" : ""}>
                <Search className="h-4 w-4 mr-1" /> Из каталога
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Mobile: Sticky bottom CTA */}
      {isMobile && !readOnly && (
        <div className="sticky bottom-0 left-0 right-0 bg-background border-t p-3 -mx-3 -mb-3 flex gap-2 z-10 shadow-[0_-2px_10px_rgba(0,0,0,0.1)]">
          <Button className="flex-1 h-11" onClick={handleAddEmpty} disabled={addLineItem.isPending}>
            <Plus className="h-4 w-4 mr-1.5" /> Добавить
          </Button>
          <Button variant="outline" className="h-11" onClick={() => setPresetsOpen(true)}>
            <Search className="h-4 w-4 mr-1.5" /> Каталог
          </Button>
          <span className="self-center text-sm text-muted-foreground tabular-nums px-2">{itemCount}</span>
        </div>
      )}

      {/* Presets Dialog */}
      <Dialog open={presetsOpen} onOpenChange={setPresetsOpen}>
        <DialogContent className="max-w-xl h-[80vh] flex flex-col p-0 gap-0">
          <DialogHeader className="px-6 py-4 border-b shrink-0">
            <DialogTitle>Каталог услуг</DialogTitle>
          </DialogHeader>
          <Tabs defaultValue="search" className="flex-1 flex flex-col min-h-0">
            <TabsList className="mx-6 mt-4 shrink-0">
              <TabsTrigger value="search">Поиск</TabsTrigger>
              <TabsTrigger value="manage">Управление</TabsTrigger>
            </TabsList>
            <TabsContent value="search" className="flex-1 min-h-0 px-6 pb-6 mt-4 overflow-hidden">
              <div className="h-full flex flex-col">
                <PresetSearch presets={presets || []} onSelect={handleAddPreset} onAddNew={() => setPresetManagerOpen(true)} />
              </div>
            </TabsContent>
            <TabsContent value="manage" className="px-6 pb-6 mt-4 overflow-auto">
              <div className="text-center py-8">
                <p className="text-muted-foreground mb-4">Управление пресетами</p>
                <Button onClick={() => setPresetManagerOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" /> Добавить пресет
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      <PresetManager open={presetManagerOpen} onOpenChange={setPresetManagerOpen} />
    </div>
  );
});

LineItemsEditor.displayName = "LineItemsEditor";

export default LineItemsEditor;
