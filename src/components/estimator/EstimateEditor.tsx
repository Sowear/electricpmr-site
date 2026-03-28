import { useState, useEffect, useCallback, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  ArrowLeft, 
  Save, 
  Download, 
  Loader2,
  User,
  Calculator,
  Mail,
  CheckCircle,
  Printer,
  Settings,
  Eye,
  Plus
} from "lucide-react";
import { useEstimate, useUpdateEstimate } from "@/hooks/useEstimates";
import {
  useDuplicateEstimate,
  useProjectObjects,
} from "@/hooks/useProjects";
import { CURRENCIES, EDITABLE_STATUSES, Estimate, EstimateStatus } from "@/types/estimator";
import { useUserRole } from "@/hooks/useUserRole";
import LineItemsEditor from "./LineItemsEditor";
import EstimatePDFPreview from "./EstimatePDFPreview";
import EstimateStatusWorkflow from "./EstimateStatusWorkflow";
import PaymentFields from "./PaymentFields";
import PaymentManager from "./PaymentManager";
import SendEstimateDialog from "./SendEstimateDialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { generatePDFPreviewHTML, printPDF, EstimateData, LineItemData } from "@/lib/pdfGenerator";
import { downloadEstimatePDF, PDFEstimateData, PDFLineItem } from "@/lib/pdfDocumentGenerator";
import { useDebounce } from "@/hooks/useDebounce";
import FieldWithTooltip from "./FieldWithTooltip";
import EstimateParticipantsPanel from "./EstimateParticipantsPanel";

const EstimateEditor = () => {
  const { id: routeEstimateId, estimateId: projectEstimateId, projectId } = useParams<{
    id?: string;
    estimateId?: string;
    projectId?: string;
  }>();
  const id = routeEstimateId || projectEstimateId;
  const navigate = useNavigate();
  const { toast } = useToast();
  const { data: estimate, isLoading } = useEstimate(id);
  const updateEstimate = useUpdateEstimate();
  const duplicateEstimate = useDuplicateEstimate();
  const { canManageEstimates, canViewPrices, canChangeStatus, isTechnician } = useUserRole();

  const [formData, setFormData] = useState<Partial<Estimate>>({
    client_name: "",
    client_email: "",
    client_phone: "",
    client_address: "",
    title: "",
    currency: "RUB_PMR",
    global_discount_pct: 0,
    global_tax_pct: 0,
    extra_fees: 0,
    extra_fees_description: "",
    deposit_pct: 0,
    notes: "",
    valid_until: "",
    payment_method: "",
    payment_recipient: "",
  });

  const effectiveProjectId = projectId || estimate?.project_id;
  const { data: projectObjects } = useProjectObjects(effectiveProjectId);

  const [isSaving, setIsSaving] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [sendDialogOpen, setSendDialogOpen] = useState(false);
  
  const debouncedFormData = useDebounce(formData, 800);
  
  type SendStatus = 'idle' | 'sending' | 'sent' | 'failed';
  const [sendStatus, setSendStatus] = useState<SendStatus>('idle');

  // Determine if estimate is locked (after approved status)
  const isLocked = useMemo(() => {
    if (!estimate) return false;
    return !EDITABLE_STATUSES.includes(estimate.status as EstimateStatus);
  }, [estimate?.status]);

  // Technicians can't edit anything
  const isReadOnly = isLocked || isTechnician || !canManageEstimates;

  useEffect(() => {
    if (estimate) {
      setFormData({
        client_name: estimate.client_name,
        client_email: estimate.client_email || "",
        client_phone: estimate.client_phone || "",
        client_address: estimate.client_address || "",
        title: estimate.title || "",
        currency: estimate.currency,
        global_discount_pct: estimate.global_discount_pct,
        global_tax_pct: estimate.global_tax_pct,
        extra_fees: estimate.extra_fees,
        extra_fees_description: estimate.extra_fees_description || "",
        deposit_pct: estimate.deposit_pct,
        notes: estimate.notes || "",
        valid_until: estimate.valid_until || "",
        payment_method: (estimate as any).payment_method || "",
        payment_recipient: (estimate as any).payment_recipient || "",
        object_id: (estimate as any).object_id || null,
      });
      if (estimate.status === 'sent') {
        setSendStatus('sent');
      }
    }
  }, [estimate]);

  const handleChange = useCallback((field: keyof Estimate, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  const handleSave = async () => {
    if (!id || isReadOnly) return;
    
    setIsSaving(true);
    try {
      await updateEstimate.mutateAsync({
        id,
        ...formData,
      });
      toast({ title: "Смета сохранена" });
    } catch (error) {
      console.error("Save error:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSendEmailWithStatus = async () => {
    if (!id) return;
    
    if (!formData.client_email) {
      toast({ 
        title: "Ошибка", 
        description: "Укажите email клиента для отправки сметы",
        variant: "destructive" 
      });
      return;
    }

    await handleSave();
    setIsSending(true);
    setSendStatus('sending');

    try {
      const { data, error } = await supabase.functions.invoke('send-estimate-email', {
        body: { estimateId: id }
      });

      if (error) throw error;

      setSendStatus('sent');
      toast({ 
        title: "Смета отправлена!", 
        description: `Email отправлен на ${formData.client_email}`,
      });
    } catch (error: any) {
      console.error("Send error:", error);
      setSendStatus('failed');
      toast({ 
        title: "Ошибка отправки", 
        description: error.message || "Не удалось отправить смету.",
        variant: "destructive" 
      });
    } finally {
      setIsSending(false);
    }
  };

  const prepareEstimateData = useCallback((): EstimateData | null => {
    if (!estimate) return null;

    const lineItems: LineItemData[] = (estimate.line_items || []).map((item) => ({
      description: item.description,
      quantity: item.quantity,
      unit: item.unit || "шт",
      unit_price: item.unit_price,
      labor_hours: item.labor_hours || 0,
      labor_rate: item.labor_rate || 0,
      line_total: item.line_total || 0,
    }));

    return {
      estimate_number: estimate.estimate_number,
      title: formData.title || estimate.title || "",
      client_name: formData.client_name || estimate.client_name,
      client_email: formData.client_email || estimate.client_email || "",
      client_phone: formData.client_phone || estimate.client_phone || "",
      client_address: formData.client_address || estimate.client_address || "",
      notes: formData.notes || estimate.notes || "",
      subtotal: estimate.subtotal || 0,
      tax_amount: estimate.tax_amount || 0,
      total: estimate.total || 0,
      balance_due: estimate.balance_due || 0,
      deposit_amount: estimate.deposit_amount || 0,
      deposit_pct: formData.deposit_pct ?? estimate.deposit_pct ?? 0,
      currency: formData.currency || estimate.currency,
      valid_until: formData.valid_until || estimate.valid_until || "",
      created_at: estimate.created_at,
      line_items: lineItems,
    };
  }, [estimate, formData]);

  const handlePrint = useCallback(() => {
    const estimateData = prepareEstimateData();
    if (!estimateData) return;
    const htmlContent = generatePDFPreviewHTML(estimateData);
    printPDF(htmlContent);
  }, [prepareEstimateData]);

  const handleDownloadPDF = useCallback(async () => {
    if (!estimate) return;

    setIsDownloading(true);
    try {
      const pdfLineItems: PDFLineItem[] = (estimate.line_items || []).map((item) => ({
        description: item.description,
        quantity: item.quantity,
        unit: item.unit || "шт",
        unit_price: item.unit_price,
        line_total: item.line_total || 0,
      }));

      const pdfData: PDFEstimateData = {
        estimate_number: estimate.estimate_number,
        title: formData.title || estimate.title || undefined,
        client_name: formData.client_name || estimate.client_name,
        client_email: formData.client_email || estimate.client_email || undefined,
        client_phone: formData.client_phone || estimate.client_phone || undefined,
        client_address: formData.client_address || estimate.client_address || undefined,
        notes: formData.notes || estimate.notes || undefined,
        subtotal: estimate.subtotal || 0,
        tax_amount: estimate.tax_amount || 0,
        total: estimate.total || 0,
        balance_due: estimate.balance_due || 0,
        deposit_amount: estimate.deposit_amount || undefined,
        deposit_pct: formData.deposit_pct ?? estimate.deposit_pct ?? undefined,
        currency: formData.currency || estimate.currency,
        valid_until: formData.valid_until || estimate.valid_until || undefined,
        created_at: estimate.created_at,
        line_items: pdfLineItems,
      };

      await downloadEstimatePDF(pdfData, `Смета_${estimate.estimate_number}.pdf`);
      toast({ title: "PDF скачан" });
    } catch (error) {
      console.error("Download error:", error);
      toast({ 
        title: "Ошибка", 
        description: "Не удалось скачать PDF",
        variant: "destructive" 
      });
    } finally {
      setIsDownloading(false);
    }
  }, [estimate, formData, toast]);

  const getSendButtonContent = () => {
    switch (sendStatus) {
      case 'sending':
        return <><Loader2 className="h-4 w-4 animate-spin" /><span className="hidden sm:inline ml-2">Отправка...</span></>;
      case 'sent':
        return <><CheckCircle className="h-4 w-4 text-emerald-600" /><span className="hidden sm:inline ml-2">Отправлено</span></>;
      case 'failed':
        return <><Mail className="h-4 w-4 text-destructive" /><span className="hidden sm:inline ml-2">Ошибка — повторить</span></>;
      default:
        return <><Mail className="h-4 w-4" /><span className="hidden sm:inline ml-2">Отправить</span></>;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!estimate) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Смета не найдена</p>
        <Button
          variant="link"
          onClick={() => {
            if (effectiveProjectId) {
              navigate(`/projects/${effectiveProjectId}`);
              return;
            }
            navigate("/estimator");
          }}
        >
          Вернуться к списку
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4 w-full">
      {/* Header */}
      <div className="flex flex-col lg:flex-row gap-3 justify-between items-start lg:items-center bg-card border rounded-lg p-3 lg:p-4">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              if (effectiveProjectId) {
                navigate(`/projects/${effectiveProjectId}`);
                return;
              }
              navigate("/estimator");
            }}
            className="shrink-0"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-lg font-bold font-mono truncate">
                  {estimate.estimate_number}
                </h1>
                {(estimate as any).version > 1 && (
                  <Badge variant="outline" className="text-xs">v{(estimate as any).version}</Badge>
                )}
                <EstimateStatusWorkflow 
                  estimate={estimate} 
                  canChangeStatus={canChangeStatus}
                />
              </div>
              <p className="text-sm text-muted-foreground truncate">
                {formData.title || "Без названия"} • {formData.client_name || "Без клиента"}
              </p>
            </div>
        </div>
        <div className="flex flex-wrap gap-2 w-full lg:w-auto">
          {!isReadOnly && (
            <Button variant="outline" size="sm" onClick={handleSave} disabled={isSaving}>
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              <span className="hidden sm:inline ml-2">Сохранить</span>
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={handlePrint}>
            <Printer className="h-4 w-4" />
            <span className="hidden sm:inline ml-2">Печать</span>
          </Button>
          <Button variant="outline" size="sm" onClick={handleDownloadPDF} disabled={isDownloading}>
            {isDownloading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            <span className="hidden sm:inline ml-2">Скачать</span>
          </Button>
          {canManageEstimates && (
            <Button 
              size="sm" 
              onClick={() => setSendDialogOpen(true)}
              variant="default"
            >
              <Mail className="h-4 w-4" />
              <span className="hidden sm:inline ml-2">Отправить</span>
            </Button>
          )}
        </div>
      </div>

      {/* Locked Banner */}
      {isLocked && canManageEstimates && (
        <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg p-3 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="text-amber-600 text-sm">🔒</span>
            <p className="text-xs text-amber-800 dark:text-amber-200">
              Смета согласована — позиции и цены заблокированы. Блок «Оплата» остаётся активным.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="shrink-0 text-xs"
            onClick={async () => {
              const result = await duplicateEstimate.mutateAsync(estimate.id);
              if (result) {
                if (effectiveProjectId) {
                  navigate(`/projects/${effectiveProjectId}/estimates/${result.id}`);
                } else {
                  navigate(`/estimator/${result.id}`);
                }
              }
            }}
            disabled={duplicateEstimate.isPending}
          >
            {duplicateEstimate.isPending ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Plus className="h-3 w-3 mr-1" />}
            Новая версия
          </Button>
        </div>
      )}

      {/* Technician view notice */}
      {isTechnician && (
        <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-3 flex items-center gap-2">
          <span className="text-blue-600 text-sm">👷</span>
          <p className="text-xs text-blue-800 dark:text-blue-200">
            Режим просмотра для электрика: только адрес, список работ и комментарии.
          </p>
        </div>
      )}

      {/* Main Content */}
      <div className="grid grid-cols-1 gap-4 2xl:gap-6">
        {/* Full-width Editor */}
        <div className="space-y-4">
          {/* Client & Settings Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Client Info */}
            <div className="border rounded-lg p-3 lg:p-4">
              <div className="flex items-center gap-2 mb-3">
                <User className="h-4 w-4 text-primary" />
                <h2 className="font-semibold text-sm">Клиент</h2>
              </div>
              <div className="grid grid-cols-2 gap-2 lg:gap-3">
                <FieldWithTooltip 
                  label="Имя" required
                  tooltip="Как представился заказчик."
                  className="col-span-2 sm:col-span-1"
                >
                  <Input
                    value={formData.client_name}
                    onChange={(e) => handleChange("client_name", e.target.value)}
                    placeholder="Иван Петров"
                    className="h-8"
                    disabled={isReadOnly}
                  />
                </FieldWithTooltip>
                <FieldWithTooltip 
                  label="Телефон"
                  tooltip="Основной номер для связи с клиентом."
                  className="col-span-2 sm:col-span-1"
                >
                  <Input
                    value={formData.client_phone}
                    onChange={(e) => handleChange("client_phone", e.target.value)}
                    placeholder="+373 777 12345"
                    className="h-8"
                    disabled={isReadOnly}
                  />
                </FieldWithTooltip>
                {/* Email hidden for technicians */}
                {!isTechnician && (
                  <FieldWithTooltip 
                    label="Email"
                    tooltip="Email клиента для отправки сметы."
                    className="col-span-2 sm:col-span-1"
                  >
                    <Input
                      type="email"
                      value={formData.client_email}
                      onChange={(e) => handleChange("client_email", e.target.value)}
                      placeholder="client@example.com"
                      className="h-8"
                      disabled={isReadOnly}
                    />
                  </FieldWithTooltip>
                )}
                <FieldWithTooltip 
                  label="Адрес"
                  tooltip="Полный адрес объекта: город, улица, дом, подъезд, этаж, квартира."
                  className={isTechnician ? "col-span-2" : "col-span-2 sm:col-span-1"}
                >
                  <Input
                    value={formData.client_address}
                    onChange={(e) => handleChange("client_address", e.target.value)}
                    placeholder="ул. Ленина, д. 1"
                    className="h-8"
                    disabled={isReadOnly}
                  />
                </FieldWithTooltip>
              </div>
            </div>

            {/* Estimate Settings - Hidden for technicians */}
            {!isTechnician && (
              <div className="border rounded-lg p-3 lg:p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Settings className="h-4 w-4 text-primary" />
                  <h2 className="font-semibold text-sm">Параметры</h2>
                </div>
                <div className="grid grid-cols-2 gap-2 lg:gap-3">
                  <FieldWithTooltip 
                    label="Название сметы"
                    tooltip='Короткое описание работ, например: "Монтаж входной группы".'
                    className="col-span-2"
                  >
                    <Input
                      value={formData.title}
                      onChange={(e) => handleChange("title", e.target.value)}
                      placeholder="Электромонтаж квартиры"
                      className="h-8"
                      disabled={isReadOnly}
                    />
                  </FieldWithTooltip>
                  <FieldWithTooltip 
                    label="Валюта"
                    tooltip="Валюта расчёта в смете."
                  >
                    <Select
                      value={formData.currency}
                      onValueChange={(v) => handleChange("currency", v)}
                      disabled={isReadOnly}
                    >
                      <SelectTrigger className="h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="z-[200] bg-popover">
                        {CURRENCIES.map((curr) => (
                          <SelectItem key={curr.code} value={curr.code}>
                            {curr.symbol} {curr.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FieldWithTooltip>
                  <FieldWithTooltip 
                    label="Действительна до"
                    tooltip="Дата, до которой смета действительна."
                  >
                    <Input
                      type="date"
                      value={formData.valid_until}
                      onChange={(e) => handleChange("valid_until", e.target.value)}
                      className="h-8"
                      disabled={isReadOnly}
                    />
                  </FieldWithTooltip>
                  <FieldWithTooltip
                    label="Объект проекта"
                    tooltip="Связь сметы с конкретным объектом проекта."
                    className="col-span-2"
                  >
                    <Select
                      value={(formData.object_id as string) || "none"}
                      onValueChange={(v) => {
                        const nextObjectId = v === "none" ? null : v;
                        handleChange("object_id", nextObjectId);
                      }}
                      disabled={isReadOnly || !effectiveProjectId}
                    >
                      <SelectTrigger className="h-8">
                        <SelectValue placeholder={effectiveProjectId ? "Выберите объект" : "Сначала назначьте проект"} />
                      </SelectTrigger>
                      <SelectContent className="z-[200] bg-popover">
                        <SelectItem value="none">Без объекта</SelectItem>
                        {(projectObjects || []).map((obj) => (
                          <SelectItem key={obj.id} value={obj.id}>{obj.title}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FieldWithTooltip>
                </div>
              </div>
            )}

            {!isTechnician && canManageEstimates && effectiveProjectId && (
              <EstimateParticipantsPanel
                estimateId={id!}
                projectId={effectiveProjectId}
                objectId={(formData.object_id as string) || null}
                readOnly={isReadOnly}
              />
            )}
          </div>

          {/* Line Items */}
          <div className="border rounded-lg p-3 lg:p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Calculator className="h-4 w-4 text-primary" />
                <h2 className="font-semibold text-sm">Позиции сметы</h2>
              </div>
              {isLocked && (
                <Badge variant="outline" className="text-xs">🔒 Только просмотр</Badge>
              )}
            </div>
            <LineItemsEditor 
              estimateId={id!} 
              lineItems={estimate.line_items || []} 
              readOnly={isReadOnly}
              hidePrices={isTechnician}
            />
          </div>

          {/* Payment Fields - Only for managers/admins */}
          {canViewPrices && (
            <PaymentFields
              formData={formData}
              onChange={handleChange}
              estimate={estimate}
              readOnly={isLocked}
            />
          )}

          {/* Payment Manager - visible even in locked mode */}
          {canViewPrices && (
            <PaymentManager
              estimate={estimate}
              canConfirm={canManageEstimates}
              projectId={effectiveProjectId}
              objectId={(formData.object_id as string) || null}
            />
          )}

          {/* Totals & Notes Row - Prices hidden for technicians */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {canViewPrices && (
              <div className="border rounded-lg p-3 lg:p-4">
                <h3 className="font-semibold text-sm mb-3">Итоговые настройки</h3>
                <div className="grid grid-cols-3 gap-2 lg:gap-3">
                  <FieldWithTooltip label="Скидка %" tooltip="Общая скидка на всю смету.">
                    <Input
                      type="number" min="0" max="100"
                      value={formData.global_discount_pct}
                      onChange={(e) => handleChange("global_discount_pct", parseFloat(e.target.value) || 0)}
                      className="h-8" disabled={isReadOnly}
                    />
                  </FieldWithTooltip>
                  <FieldWithTooltip label="Налог %" tooltip="Процент налога на итоговую сумму.">
                    <Input
                      type="number" min="0" max="100"
                      value={formData.global_tax_pct}
                      onChange={(e) => handleChange("global_tax_pct", parseFloat(e.target.value) || 0)}
                      className="h-8" disabled={isReadOnly}
                    />
                  </FieldWithTooltip>
                  <FieldWithTooltip label="Предоплата %" tooltip="Обычно 30%. Менять только по договорённости с клиентом." bold>
                    <Input
                      type="number" min="0" max="100"
                      value={formData.deposit_pct}
                      onChange={(e) => handleChange("deposit_pct", parseFloat(e.target.value) || 0)}
                      className="h-8" disabled={isReadOnly}
                    />
                  </FieldWithTooltip>
                </div>
                <div className="grid grid-cols-2 gap-2 lg:gap-3 mt-2">
                  <FieldWithTooltip label="Доп. расходы" tooltip="Выезд, мелкие расходники и т.п.">
                    <Input
                      type="number" min="0"
                      value={formData.extra_fees}
                      onChange={(e) => handleChange("extra_fees", parseFloat(e.target.value) || 0)}
                      className="h-8" disabled={isReadOnly}
                    />
                  </FieldWithTooltip>
                  <FieldWithTooltip label="Описание" tooltip="Описание дополнительных расходов.">
                    <Input
                      value={formData.extra_fees_description}
                      onChange={(e) => handleChange("extra_fees_description", e.target.value)}
                      placeholder="Выезд" className="h-8" disabled={isReadOnly}
                    />
                  </FieldWithTooltip>
                </div>
              </div>
            )}

            {/* Notes */}
            <div className="border rounded-lg p-3 lg:p-4">
              <FieldWithTooltip label="Примечания" tooltip="Дополнительная информация к смете.">
                <Textarea
                  value={formData.notes}
                  onChange={(e) => handleChange("notes", e.target.value)}
                  placeholder="Дополнительная информация..."
                  rows={4}
                  className="resize-none"
                  disabled={isReadOnly}
                />
              </FieldWithTooltip>
              <div className="mt-3 p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-md">
                <p className="text-xs text-amber-800 dark:text-amber-200">
                  ⚠️ Если на объекте выявлены дополнительные работы — электрик обязан остановиться и сообщить менеджеру. Допработы выполняются только после новой сметы и согласия клиента.
                </p>
              </div>
            </div>
          </div>
        </div>

      </div>
      {/* Mobile Sticky Action Bar */}
      <div className="xl:hidden sticky bottom-0 left-0 right-0 bg-background/95 backdrop-blur border-t p-3 -mx-3 -mb-3 flex gap-2 z-20 shadow-[0_-2px_10px_rgba(0,0,0,0.08)]">
        {!isReadOnly && (
          <Button variant="outline" size="sm" className="h-11 flex-1" onClick={handleSave} disabled={isSaving}>
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            <span className="ml-1.5">Сохранить</span>
          </Button>
        )}
        <Button variant="outline" size="sm" className="h-11" onClick={handleDownloadPDF} disabled={isDownloading}>
          {isDownloading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
        </Button>
        {canManageEstimates && (
          <Button size="sm" className="h-11 flex-1" onClick={() => setSendDialogOpen(true)}>
            <Mail className="h-4 w-4" />
            <span className="ml-1.5">Отправить</span>
          </Button>
        )}
      </div>
      {/* Send Estimate Dialog */}
      <SendEstimateDialog
        open={sendDialogOpen}
        onOpenChange={setSendDialogOpen}
        estimateId={id!}
        clientEmail={formData.client_email || estimate.client_email || ""}
      />
    </div>
  );
};

export default EstimateEditor;
