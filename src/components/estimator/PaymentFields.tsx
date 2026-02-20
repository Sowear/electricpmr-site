import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle, CheckCircle2, CreditCard, Loader2 } from "lucide-react";
import { Estimate, PAYMENT_METHODS } from "@/types/estimator";
import FieldWithTooltip from "./FieldWithTooltip";
import { useConfirmPrepayment } from "@/hooks/useEstimateWorkflow";

interface PaymentFieldsProps {
  formData: Partial<Estimate>;
  onChange: (field: keyof Estimate, value: any) => void;
  estimate: Estimate;
  readOnly?: boolean;
}

const PaymentFields = ({ formData, onChange, estimate, readOnly: _readOnly }: PaymentFieldsProps) => {
  // Payment fields are always active even in locked estimates
  const readOnly = false;
  const confirmPrepayment = useConfirmPrepayment();
  const hasPrepayment = (formData.deposit_pct || 0) > 0;

  return (
    <div className="border rounded-lg p-3 lg:p-4">
      <div className="flex items-center gap-2 mb-3">
        <CreditCard className="h-4 w-4 text-primary" />
        <h2 className="font-semibold text-sm">Оплата</h2>
      </div>

      {/* Warning banner */}
      <Alert className="mb-3 border-amber-200 bg-amber-50 dark:bg-amber-950/30">
        <AlertTriangle className="h-4 w-4 text-amber-600" />
        <AlertDescription className="text-xs text-amber-800 dark:text-amber-200 font-medium">
          ⚠️ Электрик не принимает деньги. Оплата осуществляется только через менеджера.
        </AlertDescription>
      </Alert>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 lg:gap-3">
        <FieldWithTooltip
          label="Способ оплаты"
          tooltip="Оплата принимается ТОЛЬКО менеджером или доверенным лицом. Электрик деньги не принимает."
          bold
        >
          <Select
            value={formData.payment_method || ""}
            onValueChange={(v) => onChange("payment_method" as any, v)}
            disabled={readOnly}
          >
            <SelectTrigger className="h-8">
              <SelectValue placeholder="Выберите..." />
            </SelectTrigger>
            <SelectContent className="z-[200] bg-popover">
              {PAYMENT_METHODS.map((method) => (
                <SelectItem key={method.value} value={method.value}>
                  {method.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FieldWithTooltip>

        <FieldWithTooltip
          label="Получатель оплаты"
          tooltip="Укажите, кто принимает деньги. Электрик не может быть получателем."
          bold
        >
          <Input
            value={(formData as any).payment_recipient || ""}
            onChange={(e) => onChange("payment_recipient" as any, e.target.value)}
            placeholder="Имя менеджера"
            className="h-8"
            disabled={readOnly}
          />
        </FieldWithTooltip>
      </div>

      {/* Cash warning */}
      {formData.payment_method === 'cash' && (
        <Alert className="mt-2 border-red-200 bg-red-50 dark:bg-red-950/30">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-xs text-red-800 dark:text-red-200">
            ⚠️ Наличные принимает только менеджер или доверенное лицо. Если они недоступны — заказ откладывается или переводится на безнал.
          </AlertDescription>
        </Alert>
      )}

      {/* Prepayment confirmation */}
      {hasPrepayment && (
        <div className="mt-3 pt-3 border-t">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium">Предоплата ({formData.deposit_pct}%)</span>
              {estimate.prepayment_confirmed ? (
                <Badge className="bg-green-100 text-green-700 text-xs gap-1">
                  <CheckCircle2 className="h-3 w-3" />
                  Получена
                </Badge>
              ) : (
                <Badge variant="outline" className="text-xs text-amber-600 border-amber-300">
                  Ожидает
                </Badge>
              )}
            </div>
            {!estimate.prepayment_confirmed && !readOnly && (
              <Button
                size="sm"
                variant="outline"
                className="h-7 text-xs"
                onClick={() => confirmPrepayment.mutate(estimate.id)}
                disabled={confirmPrepayment.isPending || !formData.payment_method || !(formData as any).payment_recipient}
              >
                {confirmPrepayment.isPending ? (
                  <Loader2 className="h-3 w-3 animate-spin mr-1" />
                ) : (
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                )}
                Подтвердить получение
              </Button>
            )}
          </div>
          {!estimate.prepayment_confirmed && (!formData.payment_method || !(formData as any).payment_recipient) && (
            <p className="text-xs text-muted-foreground mt-1">
              Для подтверждения укажите способ и получателя оплаты
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default PaymentFields;
