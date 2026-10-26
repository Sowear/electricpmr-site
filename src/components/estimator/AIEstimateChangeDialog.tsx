import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Bot, Loader2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { getWorkerApiUrl, supabase } from "@/integrations/supabase/client";

type ProposalLine = { catalog_item_id: string; description: string; unit: string; quantity: number | null; unit_price: number; reason: string };

export default function AIEstimateChangeDialog({ estimateId, open, onOpenChange }: { estimateId: string; open: boolean; onOpenChange: (open: boolean) => void }) {
  const [instruction, setInstruction] = useState("");
  const [lines, setLines] = useState<ProposalLine[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const queryClient = useQueryClient();
  const propose = async () => {
    setBusy(true); setError(""); setLines([]);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const response = await fetch(getWorkerApiUrl("/api/ai-estimator/draft"), { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${session?.access_token || ""}` }, body: JSON.stringify({ description: instruction }) });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Не удалось подготовить изменения");
      setLines(data.lines || []);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Ошибка"); } finally { setBusy(false); }
  };
  const apply = async () => {
    if (lines.some((line) => !line.quantity || line.quantity <= 0)) return;
    setBusy(true); setError("");
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const response = await fetch(getWorkerApiUrl("/api/ai-estimator/add-lines"), { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${session?.access_token || ""}` }, body: JSON.stringify({ estimateId, lines: lines.map(({ catalog_item_id, quantity }) => ({ catalog_item_id, quantity })) }) });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Не удалось применить изменения");
      queryClient.invalidateQueries({ queryKey: ["estimate", estimateId] });
      onOpenChange(false); setInstruction(""); setLines([]);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Не удалось применить изменения"); } finally { setBusy(false); }
  };
  return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent className="max-w-2xl"><DialogHeader><DialogTitle>Добавить работы через ИИ</DialogTitle><DialogDescription>Опишите дополнительные работы. Цены будут взяты из действующего каталога; состав и объёмы подтвердите перед добавлением.</DialogDescription></DialogHeader><Textarea value={instruction} onChange={(event) => setInstruction(event.target.value)} placeholder="Например: добавить 4 двойные розетки и 2 светильника" rows={4} /><Button onClick={propose} disabled={!instruction.trim() || busy}>{busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Bot className="mr-2 h-4 w-4" />}Предложить работы</Button>{lines.map((line, index) => <div key={line.catalog_item_id} className="grid grid-cols-[1fr_100px] gap-3 border-b pb-2"><div><p className="text-sm font-medium">{line.description}</p><p className="text-xs text-muted-foreground">{line.reason}</p></div><Input type="number" min="0.01" step="any" value={line.quantity ?? ""} placeholder="Объём" onChange={(event) => setLines((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, quantity: event.target.value ? Number(event.target.value) : null } : item))} /></div>)}{error && <p className="text-sm text-destructive">{error}</p>}<DialogFooter><Button onClick={apply} disabled={!lines.length || busy || lines.some((line) => !line.quantity || line.quantity <= 0)}>{busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}Добавить в смету</Button></DialogFooter></DialogContent></Dialog>;
}
