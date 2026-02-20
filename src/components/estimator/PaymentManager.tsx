import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Plus, CheckCircle2, Clock, Loader2, Receipt, DollarSign, Undo2, AlertTriangle } from "lucide-react";
import { Estimate, PAYMENT_METHODS } from "@/types/estimator";
import { usePayments, useCreatePayment, useConfirmPayment, useRefundPayment } from "@/hooks/usePayments";
import { format } from "date-fns";
import { ru } from "date-fns/locale";

interface PaymentManagerProps {
  estimate: Estimate;
  canConfirm: boolean;
}

const PaymentManager = ({ estimate, canConfirm }: PaymentManagerProps) => {
  const { data: payments, isLoading } = usePayments(estimate.id);
  const createPayment = useCreatePayment();
  const confirmPayment = useConfirmPayment();
  const refundPayment = useRefundPayment();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [refundDialogOpen, setRefundDialogOpen] = useState(false);
  const [refundPaymentId, setRefundPaymentId] = useState<string | null>(null);
  const [refundReason, setRefundReason] = useState("");

  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("");
  const [recipient, setRecipient] = useState("");
  const [reference, setReference] = useState("");

  const handleCreate = async () => {
    if (!amount || parseFloat(amount) <= 0) return;
    await createPayment.mutateAsync({
      estimate_id: estimate.id,
      amount: parseFloat(amount),
      currency: estimate.currency,
      method: method || undefined,
      recipient: recipient || undefined,
      reference: reference || undefined,
    });
    setDialogOpen(false);
    setAmount("");
    setMethod("");
    setRecipient("");
    setReference("");
  };

  const handleRefund = async () => {
    if (!refundPaymentId) return;
    await refundPayment.mutateAsync({
      paymentId: refundPaymentId,
      reason: refundReason || undefined,
    });
    setRefundDialogOpen(false);
    setRefundPaymentId(null);
    setRefundReason("");
  };

  const totalPaid = (payments || [])
    .filter((p) => p.status === "confirmed")
    .reduce((sum, p) => sum + p.amount, 0);
  const remaining = (estimate.total || 0) - totalPaid;

  const statusBadge = (status: string) => {
    switch (status) {
      case "confirmed":
        return (
          <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 text-xs gap-1">
            <CheckCircle2 className="h-3 w-3" />
            Подтверждён
          </Badge>
        );
      case "refunded":
        return (
          <Badge variant="outline" className="text-xs text-muted-foreground gap-1">
            <Undo2 className="h-3 w-3" />
            Возврат
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="text-xs text-amber-600 border-amber-300 gap-1">
            <Clock className="h-3 w-3" />
            Ожидает
          </Badge>
        );
    }
  };

  return (
    <div className="border rounded-lg p-3 lg:p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <DollarSign className="h-4 w-4 text-primary" />
          <h2 className="font-semibold text-sm">Платежи</h2>
        </div>
        <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => setDialogOpen(true)}>
          <Plus className="h-3 w-3 mr-1" />
          Добавить
        </Button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="bg-muted rounded-md p-2">
          <p className="text-xs text-muted-foreground">Итого</p>
          <p className="text-sm font-bold">{(estimate.total || 0).toLocaleString("ru-RU")}</p>
        </div>
        <div className="bg-emerald-50 dark:bg-emerald-950/30 rounded-md p-2">
          <p className="text-xs text-muted-foreground">Оплачено</p>
          <p className="text-sm font-bold text-emerald-600">{totalPaid.toLocaleString("ru-RU")}</p>
        </div>
        <div className="bg-amber-50 dark:bg-amber-950/30 rounded-md p-2">
          <p className="text-xs text-muted-foreground">Остаток</p>
          <p className="text-sm font-bold text-amber-600">{remaining.toLocaleString("ru-RU")}</p>
        </div>
      </div>

      {/* Payment list */}
      {isLoading ? (
        <div className="flex justify-center py-4"><Loader2 className="h-4 w-4 animate-spin" /></div>
      ) : payments && payments.length > 0 ? (
        <div className="space-y-2">
          {payments.map((p) => (
            <div key={p.id} className="flex items-center justify-between p-2 border rounded-md text-sm gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <Receipt className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                <span className={`font-medium ${p.status === "refunded" ? "line-through text-muted-foreground" : ""}`}>
                  {p.amount.toLocaleString("ru-RU")} {estimate.currency === "RUB_PMR" ? "₽" : estimate.currency}
                </span>
                {p.method && <Badge variant="outline" className="text-xs">{PAYMENT_METHODS.find(m => m.value === p.method)?.label || p.method}</Badge>}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {statusBadge(p.status)}
                {p.status === "pending" && canConfirm && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-6 text-xs"
                    onClick={() => confirmPayment.mutate(p.id)}
                    disabled={confirmPayment.isPending}
                  >
                    {confirmPayment.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : "Подтвердить"}
                  </Button>
                )}
                {p.status === "confirmed" && canConfirm && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-6 text-xs text-destructive hover:text-destructive"
                    onClick={() => {
                      setRefundPaymentId(p.id);
                      setRefundDialogOpen(true);
                    }}
                  >
                    <Undo2 className="h-3 w-3" />
                  </Button>
                )}
                <span className="text-xs text-muted-foreground">
                  {format(new Date(p.created_at), "d MMM", { locale: ru })}
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-xs text-muted-foreground text-center py-2">Нет платежей</p>
      )}

      {/* Add Payment Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Добавить платёж</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium mb-1 block">Сумма *</label>
              <Input
                type="number"
                min="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Способ оплаты</label>
              <Select value={method} onValueChange={setMethod}>
                <SelectTrigger>
                  <SelectValue placeholder="Выберите..." />
                </SelectTrigger>
                <SelectContent>
                  {PAYMENT_METHODS.map((m) => (
                    <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Получатель</label>
              <Input value={recipient} onChange={(e) => setRecipient(e.target.value)} placeholder="Имя менеджера" />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Ссылка / номер чека</label>
              <Input value={reference} onChange={(e) => setReference(e.target.value)} placeholder="Номер транзакции" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Отмена</Button>
            <Button onClick={handleCreate} disabled={!amount || createPayment.isPending}>
              {createPayment.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
              Добавить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Refund Dialog */}
      <Dialog open={refundDialogOpen} onOpenChange={setRefundDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Возврат платежа
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Будет создана запись расхода (сторно) и обновлена оплаченная сумма сметы.
            </p>
            <div>
              <label className="text-sm font-medium mb-1 block">Причина возврата</label>
              <Textarea
                value={refundReason}
                onChange={(e) => setRefundReason(e.target.value)}
                placeholder="Укажите причину..."
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRefundDialogOpen(false)}>Отмена</Button>
            <Button
              variant="destructive"
              onClick={handleRefund}
              disabled={refundPayment.isPending}
            >
              {refundPayment.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Undo2 className="h-4 w-4 mr-2" />}
              Подтвердить возврат
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PaymentManager;
