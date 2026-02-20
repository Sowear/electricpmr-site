import { useMemo, useRef, forwardRef, useImperativeHandle } from "react";
import { Estimate } from "@/types/estimator";
import { generatePreviewHTML, PDFEstimateData, PDFLineItem } from "@/lib/pdfDocumentGenerator";

interface EstimatePDFPreviewProps {
  estimate: Estimate;
  formData: Partial<Estimate>;
}

export interface EstimatePDFPreviewRef {
  getElement: () => HTMLDivElement | null;
}

const EstimatePDFPreview = forwardRef<EstimatePDFPreviewRef, EstimatePDFPreviewProps>(
  ({ estimate, formData }, ref) => {
    const containerRef = useRef<HTMLDivElement>(null);

    useImperativeHandle(ref, () => ({
      getElement: () => containerRef.current,
    }));

    const lineItems: PDFLineItem[] = useMemo(() => {
      return (estimate.line_items || []).map((item) => ({
        description: item.description,
        quantity: item.quantity,
        unit: item.unit || "шт",
        unit_price: item.unit_price,
        line_total: item.line_total || 0,
      }));
    }, [estimate.line_items]);

    const estimateData: PDFEstimateData = useMemo(() => ({
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
    }), [estimate, formData, lineItems]);

    const htmlContent = useMemo(() => generatePreviewHTML(estimateData), [estimateData]);

    return (
      <div className="border rounded-xl overflow-hidden bg-white shadow-sm">
        <div className="bg-muted/50 px-4 py-3 border-b flex items-center justify-between">
          <span className="text-sm font-medium text-muted-foreground">
            Предпросмотр PDF
          </span>
          <span className="text-xs text-muted-foreground">
            A4 • {lineItems.length} позиций
          </span>
        </div>
        <div 
          className="overflow-auto bg-muted/30"
          style={{ maxHeight: "calc(100vh - 250px)", minHeight: "400px" }}
        >
          <div 
            ref={containerRef}
            id="estimate-pdf-preview"
            className="estimate-preview-content"
            dangerouslySetInnerHTML={{ __html: htmlContent }}
          />
        </div>
      </div>
    );
  }
);

EstimatePDFPreview.displayName = "EstimatePDFPreview";

export default EstimatePDFPreview;
