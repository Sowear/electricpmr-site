import { useState } from "react";
import { Helmet } from "react-helmet-async";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, RefreshCw } from "lucide-react";
import PresetSearch from "@/components/estimator/PresetSearch";
import PresetManager from "@/components/estimator/PresetManager";
import { useLineItemPresets, useDeleteCatalogItem } from "@/hooks/useEstimates";
import { useQueryClient } from "@tanstack/react-query";
import { LineItemPreset } from "@/types/estimator";

export default function Catalog() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [presetManagerOpen, setPresetManagerOpen] = useState(false);
  const [presetToEdit, setPresetToEdit] = useState<LineItemPreset | null>(null);

  const {
    data: presets,
    isLoading: presetsLoading,
    isError: presetsError,
    error: presetsErrorObject,
  } = useLineItemPresets();

  const deleteCatalogItem = useDeleteCatalogItem();

  const handleDeletePreset = (id: string) => {
    if (confirm("Вы уверены, что хотите удалить эту позицию навсегда?")) {
      deleteCatalogItem.mutate(id);
    }
  };

  const handleResetCatalog = () => {
    if (confirm("Вы уверены, что хотите сбросить каталог до заводских настроек? Все ваши ручные изменения и добавленные позиции будут удалены, а цены обновятся из базы.")) {
      localStorage.removeItem("estimate_catalog_items");
      queryClient.invalidateQueries({ queryKey: ["catalog_items"] });
      window.location.reload();
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Helmet>
        <title>Управление каталогом - ElectricPMR</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/projects")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-xl font-semibold">Управление каталогом</h1>
          </div>
          <Button variant="outline" size="sm" onClick={handleResetCatalog} className="text-muted-foreground hover:text-foreground">
            <RefreshCw className="h-4 w-4 mr-2" />
            Сбросить цены
          </Button>
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
