import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, RefreshCw, Upload } from "lucide-react";
import PresetSearch from "@/components/estimator/PresetSearch";
import PresetManager from "@/components/estimator/PresetManager";
import { useLineItemPresets, useDeleteCatalogItem, useImportLegacyCatalog } from "@/hooks/useEstimates";
import { useQueryClient } from "@tanstack/react-query";
import { LineItemPreset } from "@/types/estimator";

export default function Catalog() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [presetManagerOpen, setPresetManagerOpen] = useState(false);
  const [presetToEdit, setPresetToEdit] = useState<LineItemPreset | null>(null);
  const [legacyCatalog] = useState<LineItemPreset[]>(() => {
    try {
      if (typeof window === "undefined") return [];
      const stored = window.localStorage.getItem("estimate_catalog_items");
      const parsed: unknown = stored ? JSON.parse(stored) : [];
      return Array.isArray(parsed) ? parsed as LineItemPreset[] : [];
    } catch {
      return [];
    }
  });

  const {
    data: presets,
    isLoading: presetsLoading,
    isError: presetsError,
    error: presetsErrorObject,
  } = useLineItemPresets();

  const deleteCatalogItem = useDeleteCatalogItem();
  const importLegacyCatalog = useImportLegacyCatalog();

  const handleDeletePreset = (id: string) => {
    if (confirm("Вы уверены, что хотите удалить эту позицию навсегда?")) {
      deleteCatalogItem.mutate(id);
    }
  };

  const handleRefreshCatalog = () => {
    queryClient.invalidateQueries({ queryKey: ["line-item-presets"] });
    queryClient.invalidateQueries({ queryKey: ["line-item-presets", "hidden"] });
  };

  const handleImportLegacyCatalog = () => {
    if (legacyCatalog.length && confirm(`Импортировать ${legacyCatalog.length} позиций из старого локального каталога? Совпадающие названия будут пропущены.`)) {
      importLegacyCatalog.mutate(legacyCatalog);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">

      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/projects")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-xl font-semibold">Управление каталогом</h1>
          </div>
          <div className="flex gap-2">
          {legacyCatalog.length > 0 && (
            <Button variant="outline" size="sm" onClick={handleImportLegacyCatalog} disabled={importLegacyCatalog.isPending}>
              <Upload className="h-4 w-4 mr-2" />
              Импортировать старый каталог
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={handleRefreshCatalog} className="text-muted-foreground hover:text-foreground">
            <RefreshCw className="h-4 w-4 mr-2" />
            Обновить
          </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-4 py-6 flex flex-col min-h-0">
        <div className="bg-card border rounded-lg shadow-sm flex-1 flex flex-col overflow-hidden">
          <div className="p-6 flex-1 flex flex-col min-h-0">
            <PresetSearch
              presets={presets || []}
              isLoading={presetsLoading}
              isError={presetsError}
              errorMessage={presetsErrorObject instanceof Error ? presetsErrorObject.message : undefined}
              onSelect={() => {}}
              onAddNew={() => setPresetManagerOpen(true)}
              onEditPreset={(preset) => {
                setPresetToEdit(preset);
                setPresetManagerOpen(true);
              }}
              onDeletePreset={handleDeletePreset}
            />
          </div>
        </div>
      </main>

      <PresetManager 
        open={presetManagerOpen} 
        onOpenChange={setPresetManagerOpen} 
        presetToEdit={presetToEdit}
        onCloseEdit={() => setPresetToEdit(null)}
      />
    </div>
  );
}
