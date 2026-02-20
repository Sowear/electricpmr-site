/**
 * PDF Estimate Generator v3.0
 * 
 * Полностью пересобранный генератор PDF-смет.
 * Чистый, минималистичный, профессиональный дизайн.
 * 
 * Особенности:
 * - Прямой рендеринг через jsPDF
 * - A4 формат (210×297 мм)
 * - Отступы: 20 мм по бокам, 15 мм сверху/снизу
 * - Реальный логотип компании
 * - Много воздуха, строгая визуальная иерархия
 * - Жёлтый — только как акцент (итого, маркеры)
 */

import jsPDF from "jspdf";

// ============================================================================
// TYPES
// ============================================================================

export interface PDFLineItem {
  description: string;
  quantity: number;
  unit: string;
  unit_price: number;
  line_total: number;
}

export interface PDFEstimateData {
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
  line_items: PDFLineItem[];
}

export interface PDFOptions {
  /** If true, hides all price/total columns — tech copy */
  hidePrices?: boolean;
}

// ============================================================================
// DESIGN TOKENS
// ============================================================================

const PAGE = {
  width: 210,
  height: 297,
  marginTop: 15,
  marginBottom: 15,
  marginLeft: 20,
  marginRight: 20,
};

const CONTENT_WIDTH = PAGE.width - PAGE.marginLeft - PAGE.marginRight; // 170mm

const COLORS = {
  black: "#1a1a1a",
  darkGray: "#374151",
  gray: "#6b7280",
  lightGray: "#9ca3af",
  veryLightGray: "#f9fafb",
  border: "#e5e7eb",
  accent: "#eab308",
  white: "#ffffff",
};

// ============================================================================
// HELPERS
// ============================================================================

function hexToRgb(hex: string): [number, number, number] {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? [parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16)]
    : [0, 0, 0];
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
  const symbols: Record<string, string> = {
    RUB_PMR: "₽",
    MDL: "лей",
    USD: "$",
    EUR: "€",
    RUB: "₽",
  };
  const symbol = symbols[currency] || currency;
  return (
    new Intl.NumberFormat("ru-RU", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount) + " " + symbol
  );
}

// ============================================================================
// LOGO LOADER
// ============================================================================

let logoDataUrl: string | null = null;

async function loadLogo(): Promise<string | null> {
  if (logoDataUrl) return logoDataUrl;
  
  try {
    const logoModule = await import("@/assets/logo-icon.png");
    const response = await fetch(logoModule.default);
    const blob = await response.blob();
    
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        logoDataUrl = reader.result as string;
        resolve(logoDataUrl);
      };
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

// ============================================================================
// FONT LOADER (Cyrillic support)
// ============================================================================

let fontCache: { regular: string; bold: string } | null = null;

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  const chunkSize = 8192;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize);
    binary += String.fromCharCode(...Array.from(chunk));
  }
  return btoa(binary);
}

async function loadFonts(): Promise<{ regular: string; bold: string } | null> {
  if (fontCache) return fontCache;
  
  try {
    const [regularRes, boldRes] = await Promise.all([
      fetch('/fonts/Roboto-Regular.ttf'),
      fetch('/fonts/Roboto-Bold.ttf'),
    ]);
    
    if (!regularRes.ok || !boldRes.ok) {
      console.warn('Custom fonts not available, using defaults');
      return null;
    }
    
    const [regularBuf, boldBuf] = await Promise.all([
      regularRes.arrayBuffer(),
      boldRes.arrayBuffer(),
    ]);
    
    fontCache = {
      regular: arrayBufferToBase64(regularBuf),
      bold: arrayBufferToBase64(boldBuf),
    };
    
    return fontCache;
  } catch (e) {
    console.warn('Font loading error:', e);
    return null;
  }
}

// ============================================================================
// PDF BUILDER CLASS
// ============================================================================

class PDFBuilder {
  private pdf: jsPDF;
  private y: number;
  private pageNum: number;
  private data: PDFEstimateData;
  private logoData: string | null = null;
  private fontName = "helvetica";
  private hidePrices: boolean;

  constructor(data: PDFEstimateData, logoData: string | null = null, fonts: { regular: string; bold: string } | null = null, options?: PDFOptions) {
    this.pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    this.data = data;
    this.y = PAGE.marginTop;
    this.pageNum = 1;
    this.logoData = logoData;
    this.hidePrices = options?.hidePrices ?? false;
    
    // Register Cyrillic fonts if available
    if (fonts) {
      try {
        this.pdf.addFileToVFS('Roboto-Regular.ttf', fonts.regular);
        this.pdf.addFont('Roboto-Regular.ttf', 'Roboto', 'normal');
        this.pdf.addFileToVFS('Roboto-Bold.ttf', fonts.bold);
        this.pdf.addFont('Roboto-Bold.ttf', 'Roboto', 'bold');
        this.fontName = 'Roboto';
      } catch (e) {
        console.warn('Failed to register custom fonts:', e);
      }
    }
  }

  // ---------------------------------------------------------------------------
  // Utilities
  // ---------------------------------------------------------------------------

  private setColor(hex: string): void {
    const [r, g, b] = hexToRgb(hex);
    this.pdf.setTextColor(r, g, b);
  }

  private setFillColor(hex: string): void {
    const [r, g, b] = hexToRgb(hex);
    this.pdf.setFillColor(r, g, b);
  }

  private setDrawColor(hex: string): void {
    const [r, g, b] = hexToRgb(hex);
    this.pdf.setDrawColor(r, g, b);
  }

  private setFont(style: "normal" | "bold", size: number): void {
    this.pdf.setFont(this.fontName, style);
    this.pdf.setFontSize(size);
  }

  private wrapText(text: string, maxWidth: number): string[] {
    if (!text) return [""];
    return this.pdf.splitTextToSize(text, maxWidth);
  }

  private checkPageBreak(needed: number): void {
    if (this.y + needed > PAGE.height - PAGE.marginBottom) {
      this.pdf.addPage();
      this.pageNum++;
      this.y = PAGE.marginTop;
      this.renderContinuationHeader();
    }
  }

  private renderContinuationHeader(): void {
    this.setFont("normal", 8);
    this.setColor(COLORS.lightGray);
    this.pdf.text(
      `${this.data.estimate_number} — стр. ${this.pageNum}`,
      PAGE.marginLeft,
      this.y
    );
    this.y += 8;
  }

  // ---------------------------------------------------------------------------
  // Header: Logo + Company Name | Estimate Number Badge
  // ---------------------------------------------------------------------------

  private renderHeader(): void {
    const startY = this.y;
    const logoSize = 12;

    // Logo image or fallback
    if (this.logoData) {
      try {
        this.pdf.addImage(this.logoData, "PNG", PAGE.marginLeft, startY, logoSize, logoSize);
      } catch {
        // Fallback to yellow square with icon
        this.renderLogoFallback(startY, logoSize);
      }
    } else {
      this.renderLogoFallback(startY, logoSize);
    }

    // Company name aligned with logo center
    this.setFont("bold", 18);
    this.setColor(COLORS.black);
    this.pdf.text("ЭлектроМастер", PAGE.marginLeft + logoSize + 5, startY + 8);

    // Right side: Gray badge with estimate number + date
    const badgeWidth = 55;
    const badgeHeight = 16;
    const badgeX = PAGE.width - PAGE.marginRight - badgeWidth;
    const badgeY = startY;

    this.setFillColor("#f3f4f6");
    this.pdf.roundedRect(badgeX, badgeY, badgeWidth, badgeHeight, 3, 3, "F");

    // Estimate number
    this.setFont("bold", 11);
    this.setColor(COLORS.black);
    this.pdf.text(
      this.data.estimate_number,
      badgeX + badgeWidth / 2,
      badgeY + 6,
      { align: "center" }
    );

    // Date
    this.setFont("normal", 9);
    this.setColor(COLORS.gray);
    this.pdf.text(
      `от ${formatDate(this.data.created_at)}`,
      badgeX + badgeWidth / 2,
      badgeY + 12,
      { align: "center" }
    );

    // Thin separator line
    this.y = startY + Math.max(logoSize, badgeHeight) + 6;
    this.setDrawColor(COLORS.border);
    this.pdf.setLineWidth(0.3);
    this.pdf.line(PAGE.marginLeft, this.y, PAGE.width - PAGE.marginRight, this.y);
    this.y += 10;
  }

  private renderLogoFallback(startY: number, logoSize: number): void {
    this.setFillColor(COLORS.accent);
    this.pdf.roundedRect(PAGE.marginLeft, startY, logoSize, logoSize, 2, 2, "F");
    this.setFont("bold", 14);
    this.setColor(COLORS.white);
    this.pdf.text("⚡", PAGE.marginLeft + 3.5, startY + 8.5);
  }

  // ---------------------------------------------------------------------------
  // Title (if present)
  // ---------------------------------------------------------------------------

  private renderTitle(): void {
    if (!this.data.title) return;

    this.checkPageBreak(12);
    this.setFont("bold", 14);
    this.setColor(COLORS.black);
    const lines = this.wrapText(this.data.title, CONTENT_WIDTH);
    lines.forEach((line) => {
      this.pdf.text(line, PAGE.marginLeft, this.y);
      this.y += 6;
    });
    this.y += 4;
  }

  // ---------------------------------------------------------------------------
  // Client Card
  // ---------------------------------------------------------------------------

  private renderClientCard(): void {
    this.checkPageBreak(40);

    const cardX = PAGE.marginLeft;
    const cardY = this.y;
    const padding = 5;

    // Calculate content height
    let lineCount = 1; // name
    if (this.data.client_phone) lineCount++;
    if (this.data.client_email) lineCount++;
    if (this.data.client_address) lineCount++;

    const lineHeight = 6;
    const labelHeight = 6;
    const cardHeight = labelHeight + lineCount * lineHeight + padding * 2 + 4;

    // Card with border and subtle shadow
    this.setDrawColor(COLORS.border);
    this.pdf.setLineWidth(0.5);
    this.pdf.roundedRect(cardX, cardY, CONTENT_WIDTH, cardHeight, 4, 4, "S");

    // Shadow effect
    this.setDrawColor("#d1d5db");
    this.pdf.setLineWidth(0.2);
    this.pdf.line(cardX + 4, cardY + cardHeight + 0.8, cardX + CONTENT_WIDTH - 4, cardY + cardHeight + 0.8);

    let textY = cardY + padding + 4;

    // Label
    this.setFont("bold", 8);
    this.setColor(COLORS.lightGray);
    this.pdf.text("ЗАКАЗЧИК", cardX + padding, textY);
    textY += 7;

    // Client name
    this.setFont("bold", 12);
    this.setColor(COLORS.black);
    this.pdf.text(this.data.client_name, cardX + padding, textY);
    textY += lineHeight;

    // Contact details
    this.setFont("normal", 10);
    this.setColor(COLORS.darkGray);

    if (this.data.client_phone) {
      this.pdf.text(`Тел: ${this.data.client_phone}`, cardX + padding, textY);
      textY += lineHeight;
    }
    if (this.data.client_email) {
      this.pdf.text(`Email: ${this.data.client_email}`, cardX + padding, textY);
      textY += lineHeight;
    }
    if (this.data.client_address) {
      this.pdf.text(`Адрес: ${this.data.client_address}`, cardX + padding, textY);
    }

    this.y = cardY + cardHeight + 10;
  }

  // ---------------------------------------------------------------------------
  // Table
  // ---------------------------------------------------------------------------

  private renderTable(): void {
    const items = this.data.line_items;
    if (!items.length) return;

    // Column layout — adjust if hiding prices
    const cols = this.hidePrices
      ? {
          num: { x: PAGE.marginLeft, w: 12 },
          desc: { x: PAGE.marginLeft + 12, w: 120 },
          qty: { x: PAGE.marginLeft + 132, w: 19 },
          unit: { x: PAGE.marginLeft + 151, w: 19 },
        }
      : {
          num: { x: PAGE.marginLeft, w: 10 },
          desc: { x: PAGE.marginLeft + 10, w: 85 },
          qty: { x: PAGE.marginLeft + 95, w: 17 },
          unit: { x: PAGE.marginLeft + 112, w: 17 },
          price: { x: PAGE.marginLeft + 129, w: 20 },
          total: { x: PAGE.marginLeft + 149, w: 21 },
        };

    const headerHeight = 10;
    const rowPadding = 3;

    // Header row
    this.checkPageBreak(headerHeight + 20);

    this.setFillColor("#f3f4f6");
    this.pdf.rect(PAGE.marginLeft, this.y, CONTENT_WIDTH, headerHeight, "F");

    this.setFont("bold", 9);
    this.setColor(COLORS.darkGray);

    const headerY = this.y + 7;
    this.pdf.text("№", cols.num.x + 3, headerY);
    this.pdf.text("Наименование", cols.desc.x + 2, headerY);
    this.pdf.text("Кол-во", cols.qty.x + cols.qty.w / 2, headerY, { align: "center" });
    this.pdf.text("Ед.", cols.unit.x + cols.unit.w / 2, headerY, { align: "center" });
    if (!this.hidePrices) {
      this.pdf.text("Цена", (cols as any).price.x + (cols as any).price.w - 2, headerY, { align: "right" });
      this.pdf.text("Сумма", (cols as any).total.x + (cols as any).total.w - 2, headerY, { align: "right" });
    }

    this.y += headerHeight;

    // Line after header
    this.setDrawColor(COLORS.border);
    this.pdf.setLineWidth(0.4);
    this.pdf.line(PAGE.marginLeft, this.y, PAGE.width - PAGE.marginRight, this.y);

    // Data rows
    items.forEach((item, idx) => {
      this.setFont("normal", 9);
      const descLines = this.wrapText(item.description, cols.desc.w - 4);
      const lineH = 4.5;
      const rowH = Math.max(10, descLines.length * lineH + rowPadding * 2);

      this.checkPageBreak(rowH);

      // Alternating background
      if (idx % 2 === 1) {
        this.setFillColor(COLORS.veryLightGray);
        this.pdf.rect(PAGE.marginLeft, this.y, CONTENT_WIDTH, rowH, "F");
      }

      const textY = this.y + rowPadding + 4;

      // Row number
      this.setFont("normal", 9);
      this.setColor(COLORS.lightGray);
      this.pdf.text(String(idx + 1), cols.num.x + 3, textY);

      // Description
      this.setFont("normal", 10);
      this.setColor(COLORS.black);
      descLines.forEach((line, i) => {
        this.pdf.text(line, cols.desc.x + 2, textY + i * lineH);
      });

      // Quantity
      this.setFont("normal", 9);
      this.setColor(COLORS.gray);
      this.pdf.text(
        String(item.quantity),
        cols.qty.x + cols.qty.w / 2,
        textY,
        { align: "center" }
      );

      // Unit
      this.pdf.text(
        item.unit || "шт",
        cols.unit.x + cols.unit.w / 2,
        textY,
        { align: "center" }
      );

      // Price & Total — only if showing prices
      if (!this.hidePrices) {
        this.setFont("normal", 10);
        this.setColor(COLORS.darkGray);
        this.pdf.text(
          formatCurrency(item.unit_price, this.data.currency),
          (cols as any).price.x + (cols as any).price.w - 2,
          textY,
          { align: "right" }
        );

        // Total (bold)
        this.setFont("bold", 10);
        this.setColor(COLORS.black);
        this.pdf.text(
          formatCurrency(item.line_total, this.data.currency),
          (cols as any).total.x + (cols as any).total.w - 2,
          textY,
          { align: "right" }
        );
      }

      this.y += rowH;

      // Separator line
      this.setDrawColor(COLORS.border);
      this.pdf.setLineWidth(0.15);
      this.pdf.line(PAGE.marginLeft, this.y, PAGE.width - PAGE.marginRight, this.y);
    });

    this.y += 8;
  }

  // ---------------------------------------------------------------------------
  // Totals
  // ---------------------------------------------------------------------------

  private renderTotals(): void {
    if (this.hidePrices) return; // No totals in tech copy
    this.checkPageBreak(50);

    const totalsWidth = 75;
    const totalsX = PAGE.width - PAGE.marginRight - totalsWidth;
    const rowH = 7;

    // Subtotal
    this.setFont("normal", 10);
    this.setColor(COLORS.gray);
    this.pdf.text("Подытог:", totalsX, this.y);
    this.setColor(COLORS.darkGray);
    this.pdf.text(
      formatCurrency(this.data.subtotal, this.data.currency),
      PAGE.width - PAGE.marginRight,
      this.y,
      { align: "right" }
    );
    this.y += rowH;

    // Tax
    if (this.data.tax_amount > 0) {
      this.setColor(COLORS.gray);
      this.pdf.text("Налог:", totalsX, this.y);
      this.setColor(COLORS.darkGray);
      this.pdf.text(
        formatCurrency(this.data.tax_amount, this.data.currency),
        PAGE.width - PAGE.marginRight,
        this.y,
        { align: "right" }
      );
      this.y += rowH;
    }

    // Deposit
    if (this.data.deposit_amount && this.data.deposit_amount > 0) {
      this.setColor(COLORS.gray);
      this.pdf.text(`Предоплата (${this.data.deposit_pct || 0}%):`, totalsX, this.y);
      this.setColor(COLORS.darkGray);
      this.pdf.text(
        formatCurrency(this.data.deposit_amount, this.data.currency),
        PAGE.width - PAGE.marginRight,
        this.y,
        { align: "right" }
      );
      this.y += rowH;
    }

    this.y += 5;

    // ИТОГО - Yellow accent box
    const boxH = 12;
    const boxW = totalsWidth + 15;
    const boxX = PAGE.width - PAGE.marginRight - boxW;

    this.setFillColor(COLORS.accent);
    this.pdf.roundedRect(boxX, this.y - 2, boxW, boxH, 3, 3, "F");

    this.setFont("bold", 12);
    this.setColor(COLORS.black);
    this.pdf.text("ИТОГО:", boxX + 5, this.y + 6);
    this.pdf.text(
      formatCurrency(this.data.total, this.data.currency),
      PAGE.width - PAGE.marginRight - 5,
      this.y + 6,
      { align: "right" }
    );

    this.y += boxH + 8;

    // Balance due
    if (this.data.deposit_amount && this.data.deposit_amount > 0 && this.data.balance_due > 0) {
      this.setFont("normal", 10);
      this.setColor(COLORS.gray);
      this.pdf.text("К оплате:", totalsX, this.y);
      this.setFont("bold", 11);
      this.setColor(COLORS.black);
      this.pdf.text(
        formatCurrency(this.data.balance_due, this.data.currency),
        PAGE.width - PAGE.marginRight,
        this.y,
        { align: "right" }
      );
      this.y += 10;
    }
  }

  // ---------------------------------------------------------------------------
  // Notes
  // ---------------------------------------------------------------------------

  private renderNotes(): void {
    if (!this.data.notes) return;

    this.checkPageBreak(25);
    this.y += 5;

    this.setFont("bold", 10);
    this.setColor(COLORS.darkGray);
    this.pdf.text("Примечания:", PAGE.marginLeft, this.y);
    this.y += 6;

    this.setFont("normal", 10);
    this.setColor(COLORS.gray);
    const lines = this.wrapText(this.data.notes, CONTENT_WIDTH);
    lines.forEach((line) => {
      this.checkPageBreak(5);
      this.pdf.text(line, PAGE.marginLeft, this.y);
      this.y += 5;
    });

    this.y += 8;
  }

  // ---------------------------------------------------------------------------
  // Footer
  // ---------------------------------------------------------------------------

  private renderFooter(): void {
    this.checkPageBreak(35);

    // Separator
    this.setDrawColor(COLORS.border);
    this.pdf.setLineWidth(0.3);
    this.pdf.line(PAGE.marginLeft, this.y, PAGE.width - PAGE.marginRight, this.y);
    this.y += 8;

    // Validity badge
    if (this.data.valid_until) {
      const badgeText = `Смета действительна до ${formatDate(this.data.valid_until)}`;
      const badgeW = 70;
      const badgeH = 8;

      this.setFillColor(COLORS.accent);
      this.pdf.roundedRect(PAGE.marginLeft, this.y - 2, badgeW, badgeH, 3, 3, "F");

      this.setFont("bold", 9);
      this.setColor(COLORS.black);
      this.pdf.text(badgeText, PAGE.marginLeft + 4, this.y + 3);
      this.y += 12;
    }

    // Guarantee
    this.setFont("normal", 9);
    this.setColor(COLORS.gray);
    this.pdf.text("Гарантия на работы — 12 месяцев", PAGE.marginLeft, this.y);
    this.y += 6;

    // Contacts
    this.setFont("normal", 10);
    this.setColor(COLORS.darkGray);
    this.pdf.text(
      "+373 777 46642  •  mmxxnon@gmail.com  •  Telegram: @ElectricPMR",
      PAGE.marginLeft,
      this.y
    );
    this.y += 6;

    // Website
    this.setFont("normal", 8);
    this.setColor(COLORS.lightGray);
    this.pdf.text("electricpmr.lovable.app", PAGE.marginLeft, this.y);
  }

  // ---------------------------------------------------------------------------
  // Build
  // ---------------------------------------------------------------------------

  public build(): Blob {
    this.renderHeader();
    this.renderTitle();
    this.renderClientCard();
    this.renderTable();
    this.renderTotals();
    this.renderNotes();
    this.renderFooter();

    return this.pdf.output("blob");
  }
}

// ============================================================================
// PUBLIC API
// ============================================================================

export async function generateEstimatePDF(data: PDFEstimateData, options?: PDFOptions): Promise<Blob> {
  const [logo, fonts] = await Promise.all([loadLogo(), loadFonts()]);
  const builder = new PDFBuilder(data, logo, fonts, options);
  return builder.build();
}

export async function downloadEstimatePDF(data: PDFEstimateData, filename?: string, options?: PDFOptions): Promise<void> {
  const blob = await generateEstimatePDF(data, options);
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename || `${data.estimate_number}.pdf`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// ============================================================================
// PREVIEW HTML GENERATOR (for in-browser preview matching PDF layout)
// ============================================================================

export function generatePreviewHTML(data: PDFEstimateData): string {
  const currency = data.currency;
  
  const formatPrice = (amount: number) => {
    const symbols: Record<string, string> = {
      RUB_PMR: "₽",
      MDL: "лей",
      USD: "$",
      EUR: "€",
      RUB: "₽",
    };
    const symbol = symbols[currency] || currency;
    return new Intl.NumberFormat("ru-RU", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount) + " " + symbol;
  };

  const formatDateStr = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("ru-RU", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const lineItemsHTML = data.line_items.map((item, idx) => `
    <tr style="background: ${idx % 2 === 1 ? '#f9fafb' : 'white'};">
      <td style="padding: 10px 8px; color: #9ca3af; font-size: 13px;">${idx + 1}</td>
      <td style="padding: 10px 8px; font-size: 14px; color: #1a1a1a;">${item.description}</td>
      <td style="padding: 10px 8px; text-align: center; color: #6b7280; font-size: 13px;">${item.quantity}</td>
      <td style="padding: 10px 8px; text-align: center; color: #6b7280; font-size: 13px;">${item.unit || 'шт'}</td>
      <td style="padding: 10px 8px; text-align: right; color: #374151; font-size: 14px;">${formatPrice(item.unit_price)}</td>
      <td style="padding: 10px 8px; text-align: right; font-weight: 600; color: #1a1a1a; font-size: 14px;">${formatPrice(item.line_total)}</td>
    </tr>
  `).join('');

  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 800px; margin: 0 auto; padding: 40px; background: white; color: #1a1a1a;">
      <!-- Header -->
      <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px;">
        <div style="display: flex; align-items: center; gap: 12px;">
          <div style="width: 48px; height: 48px; background: #eab308; border-radius: 8px; display: flex; align-items: center; justify-content: center;">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
            </svg>
          </div>
          <span style="font-size: 24px; font-weight: 700; color: #1a1a1a;">ЭлектроМастер</span>
        </div>
        <div style="background: #f3f4f6; padding: 12px 20px; border-radius: 8px; text-align: center;">
          <div style="font-weight: 700; font-size: 15px; color: #1a1a1a;">${data.estimate_number}</div>
          <div style="font-size: 13px; color: #6b7280; margin-top: 2px;">от ${formatDateStr(data.created_at)}</div>
        </div>
      </div>

      <!-- Separator -->
      <div style="border-bottom: 1px solid #e5e7eb; margin-bottom: 24px;"></div>

      <!-- Title -->
      ${data.title ? `<h2 style="font-size: 18px; font-weight: 600; margin: 0 0 20px 0; color: #1a1a1a;">${data.title}</h2>` : ''}

      <!-- Client Card -->
      <div style="border: 1px solid #e5e7eb; border-radius: 12px; padding: 20px; margin-bottom: 28px; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
        <div style="font-size: 11px; font-weight: 600; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 10px;">Заказчик</div>
        <div style="font-size: 16px; font-weight: 600; color: #1a1a1a; margin-bottom: 8px;">${data.client_name}</div>
        ${data.client_phone ? `<div style="font-size: 14px; color: #374151; margin-bottom: 4px;">Тел: ${data.client_phone}</div>` : ''}
        ${data.client_email ? `<div style="font-size: 14px; color: #374151; margin-bottom: 4px;">Email: ${data.client_email}</div>` : ''}
        ${data.client_address ? `<div style="font-size: 14px; color: #374151;">Адрес: ${data.client_address}</div>` : ''}
      </div>

      <!-- Table -->
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
        <thead>
          <tr style="background: #f3f4f6;">
            <th style="padding: 12px 8px; text-align: left; font-weight: 600; font-size: 13px; color: #374151; width: 40px;">№</th>
            <th style="padding: 12px 8px; text-align: left; font-weight: 600; font-size: 13px; color: #374151;">Наименование</th>
            <th style="padding: 12px 8px; text-align: center; font-weight: 600; font-size: 13px; color: #374151; width: 70px;">Кол-во</th>
            <th style="padding: 12px 8px; text-align: center; font-weight: 600; font-size: 13px; color: #374151; width: 60px;">Ед.</th>
            <th style="padding: 12px 8px; text-align: right; font-weight: 600; font-size: 13px; color: #374151; width: 100px;">Цена</th>
            <th style="padding: 12px 8px; text-align: right; font-weight: 600; font-size: 13px; color: #374151; width: 110px;">Сумма</th>
          </tr>
        </thead>
        <tbody>
          ${lineItemsHTML || '<tr><td colspan="6" style="padding: 20px; text-align: center; color: #9ca3af;">Нет позиций</td></tr>'}
        </tbody>
      </table>

      <!-- Totals -->
      <div style="display: flex; justify-content: flex-end; margin-bottom: 24px;">
        <div style="width: 280px;">
          <div style="display: flex; justify-content: space-between; padding: 8px 0; font-size: 14px;">
            <span style="color: #6b7280;">Подытог:</span>
            <span style="color: #374151;">${formatPrice(data.subtotal)}</span>
          </div>
          ${data.tax_amount > 0 ? `
            <div style="display: flex; justify-content: space-between; padding: 8px 0; font-size: 14px;">
              <span style="color: #6b7280;">Налог:</span>
              <span style="color: #374151;">${formatPrice(data.tax_amount)}</span>
            </div>
          ` : ''}
          ${data.deposit_amount && data.deposit_amount > 0 ? `
            <div style="display: flex; justify-content: space-between; padding: 8px 0; font-size: 14px;">
              <span style="color: #6b7280;">Предоплата (${data.deposit_pct || 0}%):</span>
              <span style="color: #374151;">${formatPrice(data.deposit_amount)}</span>
            </div>
          ` : ''}
          <div style="background: #eab308; border-radius: 8px; padding: 14px 16px; margin-top: 12px; display: flex; justify-content: space-between; align-items: center;">
            <span style="font-weight: 700; font-size: 16px; color: #1a1a1a;">ИТОГО:</span>
            <span style="font-weight: 700; font-size: 18px; color: #1a1a1a;">${formatPrice(data.total)}</span>
          </div>
          ${data.deposit_amount && data.deposit_amount > 0 && data.balance_due > 0 ? `
            <div style="display: flex; justify-content: space-between; padding: 12px 0; font-size: 14px;">
              <span style="color: #6b7280;">К оплате:</span>
              <span style="font-weight: 600; color: #1a1a1a;">${formatPrice(data.balance_due)}</span>
            </div>
          ` : ''}
        </div>
      </div>

      <!-- Notes -->
      ${data.notes ? `
        <div style="margin-bottom: 24px;">
          <div style="font-weight: 600; font-size: 14px; color: #374151; margin-bottom: 8px;">Примечания:</div>
          <div style="font-size: 14px; color: #6b7280; line-height: 1.5;">${data.notes}</div>
        </div>
      ` : ''}

      <!-- Footer -->
      <div style="border-top: 1px solid #e5e7eb; padding-top: 20px;">
        ${data.valid_until ? `
          <div style="display: inline-block; background: #eab308; color: #1a1a1a; padding: 8px 16px; border-radius: 6px; font-weight: 600; font-size: 13px; margin-bottom: 16px;">
            Смета действительна до ${formatDateStr(data.valid_until)}
          </div>
        ` : ''}
        <div style="font-size: 13px; color: #6b7280; margin-bottom: 8px;">Гарантия на работы — 12 месяцев</div>
        <div style="font-size: 14px; color: #374151; margin-bottom: 6px;">+373 777 46642  •  mmxxnon@gmail.com  •  Telegram: @ElectricPMR</div>
        <div style="font-size: 12px; color: #9ca3af;">electricpmr.lovable.app</div>
      </div>
    </div>
  `;
}
