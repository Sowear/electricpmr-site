import jsPDF from "jspdf";
import html2canvas from "html2canvas";

export interface EstimateData {
  estimate_number: string;
  title?: string;
  client_name: string;
  client_email?: string;
  client_phone?: string;
  client_address?: string;
  notes?: string;
  subtotal: number;
  tax_amount: number;
  total: number;
  balance_due: number;
  deposit_amount?: number;
  deposit_pct?: number;
  currency: string;
  valid_until?: string;
  created_at: string;
  line_items: LineItemData[];
}

export interface LineItemData {
  description: string;
  quantity: number;
  unit: string;
  unit_price: number;
  labor_hours?: number;
  labor_rate?: number;
  line_total: number;
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function formatCurrency(amount: number, currency: string): string {
  const currencySymbol = currency === "RUB_PMR" ? "₽" : currency === "MDL" ? "MDL" : currency;
  return (
    new Intl.NumberFormat("ru-RU", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount) +
    " " +
    currencySymbol
  );
}

export function generatePDFPreviewHTML(estimate: EstimateData): string {
  const lineItemsHTML = estimate.line_items
    .map(
      (item, index) => `
    <tr>
      <td class="col-num">${index + 1}</td>
      <td class="col-desc">${item.description}</td>
      <td class="col-qty">${item.quantity}</td>
      <td class="col-unit">${item.unit || "шт"}</td>
      <td class="col-price">${formatCurrency(item.unit_price, estimate.currency)}</td>
      <td class="col-total">${formatCurrency(item.line_total || 0, estimate.currency)}</td>
    </tr>
  `
    )
    .join("");

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    @page { 
      size: A4; 
      margin: 15mm 20mm; 
    }
    @media print {
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { 
      font-family: 'Segoe UI', Arial, sans-serif; 
      font-size: 11pt;
      line-height: 1.4;
      color: #000;
      background: #fff;
      width: 100%;
      padding: 0;
    }
    
    /* ===== DOCUMENT CONTAINER ===== */
    .document {
      width: 100%;
      max-width: 100%;
      padding: 40px 50px;
    }
    
    /* ===== HEADER ===== */
    .header {
      display: table;
      width: 100%;
      margin-bottom: 30px;
      border-bottom: 3px solid #eab308;
      padding-bottom: 20px;
    }
    .header-left {
      display: table-cell;
      vertical-align: middle;
      width: 50%;
    }
    .header-right {
      display: table-cell;
      vertical-align: middle;
      width: 50%;
      text-align: right;
    }
    .logo {
      display: inline-block;
      vertical-align: middle;
    }
    .logo-icon {
      display: inline-block;
      width: 40px;
      height: 40px;
      background: #eab308;
      border-radius: 8px;
      text-align: center;
      line-height: 40px;
      font-size: 20px;
      vertical-align: middle;
      margin-right: 12px;
    }
    .logo-text {
      display: inline-block;
      font-size: 22pt;
      font-weight: 700;
      vertical-align: middle;
      color: #000;
    }
    .doc-number {
      font-size: 14pt;
      font-weight: 600;
      font-family: 'Consolas', 'Courier New', monospace;
      color: #000;
    }
    .doc-date {
      font-size: 10pt;
      color: #555;
      margin-top: 4px;
    }
    
    /* ===== TITLE ===== */
    .doc-title {
      font-size: 14pt;
      font-weight: 600;
      margin-bottom: 25px;
      padding: 12px 16px;
      background: #f5f5f5;
      border-left: 4px solid #eab308;
    }
    
    /* ===== CLIENT SECTION ===== */
    .client-section {
      margin-bottom: 25px;
      padding: 15px 20px;
      background: #fafafa;
      border: 1px solid #e5e5e5;
    }
    .client-label {
      font-size: 9pt;
      text-transform: uppercase;
      letter-spacing: 1px;
      color: #666;
      margin-bottom: 8px;
    }
    .client-name {
      font-size: 12pt;
      font-weight: 600;
      margin-bottom: 6px;
    }
    .client-info {
      font-size: 10pt;
      color: #333;
      line-height: 1.6;
    }
    
    /* ===== TABLE ===== */
    .items-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 25px;
      font-size: 10pt;
    }
    .items-table th {
      background: #1a1a1a;
      color: #fff;
      font-weight: 500;
      padding: 10px 8px;
      text-align: left;
      font-size: 9pt;
    }
    .items-table th:first-child { width: 5%; text-align: center; }
    .items-table th.col-desc { width: 45%; }
    .items-table th.col-qty { width: 10%; text-align: center; }
    .items-table th.col-unit { width: 10%; text-align: center; }
    .items-table th.col-price { width: 15%; text-align: right; }
    .items-table th.col-total { width: 15%; text-align: right; }
    
    .items-table td {
      padding: 10px 8px;
      border-bottom: 1px solid #ddd;
      vertical-align: top;
    }
    .items-table tr:nth-child(even) { background: #fafafa; }
    .items-table .col-num { text-align: center; color: #666; }
    .items-table .col-desc { }
    .items-table .col-qty { text-align: center; }
    .items-table .col-unit { text-align: center; color: #666; }
    .items-table .col-price { text-align: right; }
    .items-table .col-total { text-align: right; font-weight: 500; }
    
    /* ===== TOTALS ===== */
    .totals-section {
      width: 100%;
      margin-bottom: 25px;
    }
    .totals-table {
      margin-left: auto;
      width: 300px;
      border-collapse: collapse;
    }
    .totals-table td {
      padding: 8px 12px;
      font-size: 10pt;
    }
    .totals-table .label { text-align: left; color: #555; }
    .totals-table .value { text-align: right; }
    .totals-table .grand-total td {
      border-top: 2px solid #000;
      padding-top: 12px;
      font-size: 14pt;
      font-weight: 700;
    }
    .totals-table .grand-total .value { color: #eab308; }
    
    /* ===== NOTES ===== */
    .notes-section {
      margin-bottom: 25px;
      padding: 15px 20px;
      background: #fffbeb;
      border-left: 4px solid #eab308;
    }
    .notes-title {
      font-size: 10pt;
      font-weight: 600;
      margin-bottom: 6px;
    }
    .notes-text {
      font-size: 10pt;
      color: #333;
      line-height: 1.5;
    }
    
    /* ===== FOOTER ===== */
    .footer {
      margin-top: 30px;
      padding-top: 20px;
      border-top: 1px solid #ddd;
      text-align: center;
    }
    .validity-badge {
      display: inline-block;
      background: #eab308;
      color: #000;
      padding: 8px 20px;
      border-radius: 20px;
      font-size: 10pt;
      font-weight: 600;
      margin-bottom: 15px;
    }
    .footer-contacts {
      font-size: 10pt;
      color: #333;
      margin-bottom: 10px;
    }
    .footer-contacts a {
      color: #000;
      text-decoration: none;
      margin: 0 15px;
    }
    .footer-brand {
      font-size: 9pt;
      color: #666;
    }
    .footer-brand a { color: #eab308; }
  </style>
</head>
<body>
  <div class="document">
    <!-- HEADER -->
    <div class="header">
      <div class="header-left">
        <div class="logo">
          <span class="logo-icon">⚡</span>
          <span class="logo-text">ЭлектроМастер</span>
        </div>
      </div>
      <div class="header-right">
        <div class="doc-number">${estimate.estimate_number}</div>
        <div class="doc-date">от ${formatDate(estimate.created_at)}</div>
      </div>
    </div>

    <!-- TITLE -->
    ${estimate.title ? `<div class="doc-title">${estimate.title}</div>` : ""}

    <!-- CLIENT -->
    <div class="client-section">
      <div class="client-label">Заказчик</div>
      <div class="client-name">${estimate.client_name}</div>
      <div class="client-info">
        ${estimate.client_phone ? `Тел: ${estimate.client_phone}<br>` : ""}
        ${estimate.client_email ? `Email: ${estimate.client_email}<br>` : ""}
        ${estimate.client_address ? `Адрес: ${estimate.client_address}` : ""}
      </div>
    </div>

    <!-- ITEMS TABLE -->
    <table class="items-table">
      <thead>
        <tr>
          <th>№</th>
          <th class="col-desc">Наименование работ / материалов</th>
          <th class="col-qty">Кол-во</th>
          <th class="col-unit">Ед.</th>
          <th class="col-price">Цена</th>
          <th class="col-total">Сумма</th>
        </tr>
      </thead>
      <tbody>
        ${lineItemsHTML}
      </tbody>
    </table>

    <!-- TOTALS -->
    <div class="totals-section">
      <table class="totals-table">
        <tr>
          <td class="label">Подытог:</td>
          <td class="value">${formatCurrency(estimate.subtotal || 0, estimate.currency)}</td>
        </tr>
        ${estimate.tax_amount ? `
        <tr>
          <td class="label">Налог:</td>
          <td class="value">${formatCurrency(estimate.tax_amount, estimate.currency)}</td>
        </tr>
        ` : ""}
        ${estimate.deposit_amount ? `
        <tr>
          <td class="label">Предоплата (${estimate.deposit_pct || 0}%):</td>
          <td class="value">${formatCurrency(estimate.deposit_amount, estimate.currency)}</td>
        </tr>
        ` : ""}
        <tr class="grand-total">
          <td class="label">ИТОГО:</td>
          <td class="value">${formatCurrency(estimate.total || 0, estimate.currency)}</td>
        </tr>
        ${estimate.balance_due && estimate.deposit_amount ? `
        <tr>
          <td class="label">К оплате:</td>
          <td class="value">${formatCurrency(estimate.balance_due, estimate.currency)}</td>
        </tr>
        ` : ""}
      </table>
    </div>

    <!-- NOTES -->
    ${estimate.notes ? `
    <div class="notes-section">
      <div class="notes-title">Примечания</div>
      <div class="notes-text">${estimate.notes}</div>
    </div>
    ` : ""}

    <!-- FOOTER -->
    <div class="footer">
      ${estimate.valid_until ? `<div class="validity-badge">✓ Действительна до ${formatDate(estimate.valid_until)}</div>` : ""}
      <div class="footer-contacts">
        <a href="tel:+37377746642">+373 777 46642</a>
        <a href="mailto:mmxxnon@gmail.com">mmxxnon@gmail.com</a>
      </div>
      <div class="footer-brand">
        ЭлектроМастер — профессиональный электромонтаж в Приднестровье<br>
        <a href="https://electricpmr.lovable.app">electricpmr.lovable.app</a>
      </div>
    </div>
  </div>
</body>
</html>
  `;
}

export async function generatePDFFromHTML(htmlContent: string): Promise<Blob | null> {
  try {
    // Create a temporary container for rendering
    const container = document.createElement("div");
    container.style.cssText = `
      position: absolute;
      left: -9999px;
      top: 0;
      width: 794px;
      background: white;
    `;
    container.innerHTML = htmlContent;
    document.body.appendChild(container);

    // Wait for styles to apply
    await new Promise(resolve => setTimeout(resolve, 100));

    // Render to canvas at high quality
    const canvas = await html2canvas(container, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: "#ffffff",
      width: 794, // A4 width at 96 DPI
      windowWidth: 794,
    });

    // Clean up
    document.body.removeChild(container);

    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF("p", "mm", "a4");

    const pdfWidth = pdf.internal.pageSize.getWidth(); // 210mm
    const pdfHeight = pdf.internal.pageSize.getHeight(); // 297mm

    // Calculate image dimensions to fit A4
    const imgWidth = pdfWidth;
    const imgHeight = (canvas.height * pdfWidth) / canvas.width;

    // Handle multi-page if content is too long
    let heightLeft = imgHeight;
    let position = 0;

    while (heightLeft > 0) {
      if (position > 0) {
        pdf.addPage();
      }
      
      pdf.addImage(imgData, "PNG", 0, position > 0 ? 0 : 0, imgWidth, imgHeight, undefined, "FAST");
      
      heightLeft -= pdfHeight;
      position -= pdfHeight;
    }

    return pdf.output("blob");
  } catch (error) {
    console.error("Error generating PDF:", error);
    return null;
  }
}

// Legacy function for backward compatibility
export async function generatePDF(elementId: string, filename: string): Promise<Blob | null> {
  const element = document.getElementById(elementId);
  if (!element) {
    console.error("Element not found for PDF generation:", elementId);
    return null;
  }

  try {
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: "#ffffff",
    });

    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF("p", "mm", "a4");

    const pdfWidth = pdf.internal.pageSize.getWidth();
    const imgWidth = pdfWidth;
    const imgHeight = (canvas.height * pdfWidth) / canvas.width;

    pdf.addImage(imgData, "PNG", 0, 0, imgWidth, imgHeight);

    return pdf.output("blob");
  } catch (error) {
    console.error("Error generating PDF:", error);
    return null;
  }
}

export function downloadPDF(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function printPDF(htmlContent: string): void {
  const printWindow = window.open("", "_blank");
  if (printWindow) {
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    printWindow.onload = () => {
      printWindow.print();
    };
  }
}
