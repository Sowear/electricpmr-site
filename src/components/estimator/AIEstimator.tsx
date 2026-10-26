import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bot, Loader2, Save, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { getWorkerApiUrl, supabase } from "@/integrations/supabase/client";
import { calculateAIDraftTotal, canSaveAIDraft } from "@/lib/aiEstimatorRules";

type DraftLine = {
  catalog_item_id: string;
  description: string;
  unit: string;
  quantity: number | null;
  quantity_source: "explicit" | "unknown";
  reason: string;
  unit_price: number;
};
type Draft = {
  location: string;
  objectType: string;
  summary: string;
  completedWork: string[];
  questions: string[];
  lines: DraftLine[];
  currency: string;
};

const AIEstimator = () => {
  const navigate = useNavigate();
  const [description, setDescription] = useState("");
  const [clientName, setClientName] = useState("");
  const [draft, setDraft] = useState<Draft | null>(null);
  const [error, setError] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const total = useMemo(() => calculateAIDraftTotal(draft?.lines || []), [draft]);

  const analyze = async () => {
    setError("");
    setDraft(null);
    setIsAnalyzing(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error("Сессия не найдена. Войдите в систему повторно.");
      const response = await fetch(getWorkerApiUrl("/api/ai-estimator/draft"), {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({ description }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(typeof result.error === "string" ? result.error : "Не удалось подготовить черновик");
      setDraft(result as Draft);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Не удалось подготовить черновик");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const save = async () => {
    if (!draft || !canSaveAIDraft(draft.lines)) return;
    setError("");
    setIsSaving(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error("Сессия не найдена. Войдите в систему повторно.");
      const response = await fetch(getWorkerApiUrl("/api/ai-estimator/save"), {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({
          clientName: clientName.trim(),
          title: [draft.objectType, draft.location].filter(Boolean).join(" — ") || "Смета по описанию объекта",
          description: description.trim(),
          inspection: {
            location: draft.location,
            objectType: draft.objectType,
            summary: draft.summary,
            completedWork: draft.completedWork,
            questions: draft.questions,
          },
          lines: draft.lines.map(({ catalog_item_id, quantity }) => ({ catalog_item_id, quantity })),
        }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(typeof result.error === "string" ? result.error : "Не удалось сохранить смету");
      navigate(`/estimator/${result.id}`);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Не удалось сохранить смету");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="container-main max-w-6xl space-y-6 py-6 lg:py-8">
      <div>
        <h1 className="text-2xl font-bold">ИИ-помощник электрика</h1>
        <p className="mt-1 text-muted-foreground">Опишите объект. Помощник предложит работы из каталога и отметит недостающие объёмы.</p>
      </div>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(360px,0.9fr)]">
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Bot className="h-5 w-5" /> Описание объекта</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <Textarea value={description} onChange={(event) => setDescription(event.target.value)} rows={9} maxLength={8000} placeholder="Например: квартира в Слободзее, кухня и коридор. Протянуть кабель, установить розетки и выключатели. Подрозетники уже установлены; материалы предоставляет заказчик…" />
            <Input value={clientName} onChange={(event) => setClientName(event.target.value)} placeholder="Имя клиента (необязательно)" />
            <Button onClick={analyze} disabled={!description.trim() || isAnalyzing}>
              {isAnalyzing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Bot className="mr-2 h-4 w-4" />}
              {isAnalyzing ? "Анализирую…" : "Подготовить черновик"}
            </Button>
            {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
            <p className="text-xs text-muted-foreground">ИИ формирует только предварительное предложение. Количества и состав работ проверьте перед сохранением.</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Осмотр и недостающие данные</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {!draft && <p className="text-sm text-muted-foreground">Результат анализа появится здесь.</p>}
            {draft && <>
              <p className="text-sm">{draft.summary || "Предварительный перечень по описанию объекта."}</p>
              {(draft.location || draft.objectType) && <p className="text-sm text-muted-foreground">{[draft.objectType, draft.location].filter(Boolean).join(" · ")}</p>}
              {!!draft.completedWork.length && <div><h3 className="text-sm font-semibold">Уже выполнено</h3><ul className="list-inside list-disc text-sm text-muted-foreground">{draft.completedWork.map((work, i) => <li key={`${i}-${work}`}>{work}</li>)}</ul></div>}
              {!!draft.questions.length && <div><h3 className="text-sm font-semibold">Нужно уточнить</h3><ul className="list-inside list-disc text-sm text-amber-700">{draft.questions.map((question, i) => <li key={`${i}-${question}`}>{question}</li>)}</ul></div>}
            </>}
          </CardContent>
        </Card>
      </div>
      {draft && <Card>
        <CardHeader><CardTitle>Предварительная смета</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {draft.lines.length === 0 && <p className="text-sm text-muted-foreground">Подходящих активных позиций каталога не найдено.</p>}
          {draft.lines.map((line, index) => <div key={line.catalog_item_id} className="grid gap-2 border-b pb-3 sm:grid-cols-[minmax(0,1fr)_100px_110px_40px] sm:items-center">
            <div><p className="font-medium">{line.description}</p><p className="text-xs text-muted-foreground">{line.reason || "Из каталога работ"}</p></div>
            <Input aria-label={`Количество: ${line.description}`} type="number" min="0.01" step="any" placeholder="Уточнить" value={line.quantity ?? ""} onChange={(event) => setDraft((current) => current ? ({ ...current, lines: current.lines.map((item, i) => i === index ? { ...item, quantity: event.target.value ? Number(event.target.value) : null, quantity_source: event.target.value ? "explicit" : "unknown" } : item) }) : current)} />
            <div className="text-sm">{line.quantity ? (line.quantity * line.unit_price).toLocaleString("ru-RU") : "—"} {line.unit}</div>
            <Button variant="ghost" size="icon" aria-label={`Удалить ${line.description}`} onClick={() => setDraft((current) => current ? ({ ...current, lines: current.lines.filter((_, i) => i !== index) }) : current)}><Trash2 className="h-4 w-4" /></Button>
          </div>)}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <p className="font-semibold">Итого по заполненным объёмам: {total.toLocaleString("ru-RU")} руб.</p>
            <Button onClick={save} disabled={!canSaveAIDraft(draft.lines) || isSaving}>
              {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              Сохранить как смету
            </Button>
          </div>
          {!canSaveAIDraft(draft.lines) && <p className="text-xs text-muted-foreground">Заполните объём или удалите позицию, чтобы сохранить смету.</p>}
        </CardContent>
      </Card>}
    </div>
  );
};

export default AIEstimator;
