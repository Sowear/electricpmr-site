import { Estimate, CURRENCIES, calculateEstimateTotals } from "@/types/estimator";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { Separator } from "@/components/ui/separator";

interface EstimatePreviewProps {
  estimate: Estimate;
  formData: Partial<Estimate>;
}

const EstimatePreview = ({ estimate, formData }: EstimatePreviewProps) => {
  const currency = CURRENCIES.find(c => c.code === (formData.currency || estimate.currency));
  const currencySymbol = currency?.symbol || "руб.";

  const lineItems = estimate.line_items || [];
  
  const totals = calculateEstimateTotals(
    lineItems,
    formData.global_discount_pct ?? estimate.global_discount_pct,
    formData.global_discount_amount ?? estimate.global_discount_amount,
    formData.global_tax_pct ?? estimate.global_tax_pct,
    formData.extra_fees ?? estimate.extra_fees,
    formData.deposit_pct ?? estimate.deposit_pct,
    formData.deposit_amount ?? estimate.deposit_amount
  );

  return (
    <div className="border rounded-lg bg-white dark:bg-card overflow-hidden">
      {/* Header */}
      <div className="bg-primary text-primary-foreground p-6">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-2xl font-bold">ЭлектроМастер</h2>
            <p className="text-primary-foreground/80 text-sm">
              Электромонтажные работы
            </p>
          </div>
          <div className="text-right">
            <p className="font-mono text-lg font-semibold">
              {estimate.estimate_number}
            </p>
            <p className="text-primary-foreground/80 text-sm">
              от {format(new Date(estimate.created_at), "d MMMM yyyy", { locale: ru })}
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6 space-y-6">
        {/* Title */}
        {formData.title && (
          <div>
            <h3 className="text-lg font-semibold">{formData.title}</h3>
          </div>
        )}

        {/* Client Info */}
        <div className="bg-muted/30 rounded-lg p-4">
          <p className="text-sm text-muted-foreground mb-1">Клиент:</p>
          <p className="font-medium">{formData.client_name || estimate.client_name}</p>
          {(formData.client_phone || estimate.client_phone) && (
            <p className="text-sm">{formData.client_phone || estimate.client_phone}</p>
          )}
          {(formData.client_address || estimate.client_address) && (
            <p className="text-sm text-muted-foreground">
              {formData.client_address || estimate.client_address}
            </p>
          )}
        </div>

        {/* Line Items */}
        {lineItems.length > 0 && (
          <div>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 font-medium">Наименование</th>
                  <th className="text-right py-2 font-medium w-20">Кол-во</th>
                  <th className="text-right py-2 font-medium w-24">Цена</th>
                  <th className="text-right py-2 font-medium w-24">Сумма</th>
                </tr>
              </thead>
              <tbody>
                {lineItems.map((item, idx) => (
                  <tr key={item.id} className="border-b border-muted">
                    <td className="py-2">
                      <span className="text-muted-foreground mr-2">{idx + 1}.</span>
                      {item.description}
                    </td>
                    <td className="text-right py-2">
                      {item.quantity} {item.unit}
                    </td>
                    <td className="text-right py-2">
                      {item.unit_price.toLocaleString("ru-RU")}
                    </td>
                    <td className="text-right py-2 font-medium">
                      {item.line_total.toLocaleString("ru-RU")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Totals */}
        <div className="space-y-2 pt-4">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Подитого:</span>
            <span>{totals.subtotal.toLocaleString("ru-RU")} {currencySymbol}</span>
          </div>
          
          {(formData.global_discount_pct || 0) > 0 && (
            <div className="flex justify-between text-sm text-success">
              <span>Скидка ({formData.global_discount_pct}%):</span>
              <span>-{((totals.subtotal * (formData.global_discount_pct || 0)) / 100).toLocaleString("ru-RU")} {currencySymbol}</span>
            </div>
          )}
          
          {(formData.global_tax_pct || 0) > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Налог ({formData.global_tax_pct}%):</span>
              <span>{totals.taxAmount.toLocaleString("ru-RU")} {currencySymbol}</span>
            </div>
          )}
          
          {(formData.extra_fees || 0) > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">
                {formData.extra_fees_description || "Доп. расходы"}:
              </span>
              <span>{(formData.extra_fees || 0).toLocaleString("ru-RU")} {currencySymbol}</span>
            </div>
          )}
          
          <Separator />
          
          <div className="flex justify-between text-lg font-bold">
            <span>Итого:</span>
            <span className="text-primary">
              {totals.total.toLocaleString("ru-RU")} {currencySymbol}
            </span>
          </div>
          
          {(formData.deposit_pct || 0) > 0 && (
            <>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">
                  Предоплата ({formData.deposit_pct}%):
                </span>
                <span>
                  {((totals.total * (formData.deposit_pct || 0)) / 100).toLocaleString("ru-RU")} {currencySymbol}
                </span>
              </div>
              <div className="flex justify-between font-medium">
                <span>К оплате:</span>
                <span>{totals.balanceDue.toLocaleString("ru-RU")} {currencySymbol}</span>
              </div>
            </>
          )}
        </div>

        {/* Valid Until */}
        {formData.valid_until && (
          <div className="text-sm text-muted-foreground pt-4 border-t">
            Смета действительна до:{" "}
            <span className="font-medium">
              {format(new Date(formData.valid_until), "d MMMM yyyy", { locale: ru })}
            </span>
          </div>
        )}

        {/* Notes */}
        {formData.notes && (
          <div className="text-sm bg-muted/30 p-4 rounded-lg">
            <p className="font-medium mb-1">Примечания:</p>
            <p className="text-muted-foreground whitespace-pre-wrap">{formData.notes}</p>
          </div>
        )}

        {/* Footer */}
        <div className="pt-4 border-t text-center text-sm text-muted-foreground">
          <p>ЭлектроМастер | +373 777 46642</p>
          <p>mmxxnon@gmail.com | electricpmr.lovable.app</p>
        </div>
      </div>
    </div>
  );
};

export default EstimatePreview;
