export type EstimateStatus = 'draft' | 'sent' | 'viewed' | 'approved' | 'pending_prepayment' | 'prepayment_received' | 'in_progress' | 'completed' | 'closed' | 'converted' | 'rejected';
export type LineItemType = 'material' | 'labor' | 'service' | 'other';

export interface LineItem {
  id: string;
  position: number;
  item_type: LineItemType;
  item_code?: string;
  description: string;
  unit: string;
  quantity: number;
  unit_price: number;
  labor_hours: number;
  labor_rate: number;
  cost_price: number;
  markup_pct: number;
  discount_pct: number;
  tax_pct: number;
  line_total: number;
}

export interface Estimate {
  id: string;
  estimate_number: string;
  title?: string;
  status: EstimateStatus;
  
  // Client info
  client_name: string;
  client_email?: string;
  client_phone?: string;
  client_address?: string;
  
  // Linked request / project
  request_id?: string;
  project_id?: string;
  version: number;
  
  // Client comment & locking
  client_comment?: string;
  locked?: boolean;
  paid_amount?: number;

  // Currency
  currency: string;
  exchange_rate: number;
  
  // Global settings
  global_discount_pct: number;
  global_discount_amount: number;
  global_tax_pct: number;
  extra_fees: number;
  extra_fees_description?: string;
  
  // Deposit
  deposit_pct: number;
  deposit_amount: number;
  
  // Payment
  payment_method?: string;
  payment_recipient?: string;
  prepayment_confirmed: boolean;
  prepayment_confirmed_at?: string;
  prepayment_confirmed_by?: string;
  
  // Totals
  subtotal: number;
  tax_amount: number;
  total: number;
  balance_due: number;
  
  // Dates
  valid_until?: string;
  payment_due_date?: string;
  created_at: string;
  updated_at: string;
  sent_at?: string;
  viewed_at?: string;
  approved_at?: string;
  
  // Access
  public_token?: string;
  pdf_url?: string;
  
  // Audit
  created_by?: string;
  notes?: string;
  
  // CRM
  crm_lead_id?: string;
  crm_synced_at?: string;
  
  // Line items (for full load)
  line_items?: LineItem[];
}

export interface LineItemPreset {
  id: string;
  name: string;
  item_type: LineItemType;
  item_code?: string;
  description: string;
  unit: string;
  quantity: number;
  unit_price: number;
  labor_hours: number;
  labor_rate: number;
  cost_price: number;
  markup_pct: number;
  category?: string;
  is_active: boolean;
}

export interface EstimateTemplate {
  id: string;
  name: string;
  description?: string;
  template_data: {
    title?: string;
    global_discount_pct?: number;
    global_tax_pct?: number;
    extra_fees?: number;
    line_items: Omit<LineItem, 'id' | 'line_total'>[];
  };
  created_by?: string;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// WORKFLOW CONSTANTS
// ============================================================================

/** Statuses where line items and prices can be edited */
export const EDITABLE_STATUSES: EstimateStatus[] = ['draft', 'sent'];

/** Allowed status transitions */
export const ALLOWED_TRANSITIONS: Record<EstimateStatus, EstimateStatus[]> = {
  draft: ['sent'],
  sent: ['approved', 'rejected'],
  viewed: ['approved', 'rejected'],
  approved: ['pending_prepayment', 'in_progress'],
  pending_prepayment: ['prepayment_received', 'rejected'],
  prepayment_received: ['in_progress'],
  in_progress: ['completed'],
  completed: ['closed'],
  closed: [],
  rejected: ['draft'],
  converted: [],
};

/** Payment methods */
export const PAYMENT_METHODS = [
  { value: 'cash', label: 'Наличные' },
  { value: 'bank_transfer', label: 'Безналичный перевод' },
  { value: 'card', label: 'Карта' },
];

// ============================================================================
// CALCULATION HELPERS
// ============================================================================

export function calculateLineTotal(item: Partial<LineItem>): number {
  const quantity = item.quantity || 0;
  const unitPrice = item.unit_price || 0;
  const laborHours = item.labor_hours || 0;
  const laborRate = item.labor_rate || 0;
  const markupPct = item.markup_pct || 0;
  const discountPct = item.discount_pct || 0;
  const taxPct = item.tax_pct || 0;

  const lineNet = quantity * unitPrice;
  const laborCost = laborHours * laborRate;
  const lineSubtotal = lineNet + laborCost;
  const markupAmount = lineSubtotal * (markupPct / 100);
  const discountAmount = (lineSubtotal + markupAmount) * (discountPct / 100);
  const taxAmount = (lineSubtotal + markupAmount - discountAmount) * (taxPct / 100);
  
  return Math.round((lineSubtotal + markupAmount - discountAmount + taxAmount) * 100) / 100;
}

export function calculateEstimateTotals(
  lineItems: LineItem[],
  globalDiscountPct: number,
  globalDiscountAmount: number,
  globalTaxPct: number,
  extraFees: number,
  depositPct: number,
  depositAmount: number
): {
  subtotal: number;
  taxAmount: number;
  total: number;
  balanceDue: number;
} {
  const subtotal = lineItems.reduce((sum, item) => sum + item.line_total, 0);
  
  const globalDiscount = Math.max(
    subtotal * (globalDiscountPct / 100),
    globalDiscountAmount
  );
  
  const taxBase = subtotal - globalDiscount;
  const taxAmount = taxBase * (globalTaxPct / 100);
  const total = taxBase + taxAmount + extraFees;
  
  const deposit = Math.max(
    total * (depositPct / 100),
    depositAmount
  );
  
  const balanceDue = total - deposit;
  
  return {
    subtotal: Math.round(subtotal * 100) / 100,
    taxAmount: Math.round(taxAmount * 100) / 100,
    total: Math.round(total * 100) / 100,
    balanceDue: Math.round(balanceDue * 100) / 100,
  };
}

export const CURRENCIES = [
  { code: 'RUB_PMR', symbol: 'руб.', name: 'Рубль ПМР' },
  { code: 'MDL', symbol: 'лей', name: 'Молдавский лей' },
  { code: 'USD', symbol: '$', name: 'Доллар США' },
  { code: 'EUR', symbol: '€', name: 'Евро' },
  { code: 'RUB', symbol: '₽', name: 'Российский рубль' },
];

export const LINE_ITEM_TYPES: { value: LineItemType; label: string }[] = [
  { value: 'material', label: 'Материал' },
  { value: 'labor', label: 'Работа' },
  { value: 'service', label: 'Услуга' },
  { value: 'other', label: 'Прочее' },
];

export const ESTIMATE_STATUSES: { value: EstimateStatus; label: string; color: string; dotColor: string }[] = [
  { value: 'draft', label: 'Черновик', color: 'bg-muted text-muted-foreground', dotColor: 'bg-muted-foreground' },
  { value: 'sent', label: 'Отправлена', color: 'bg-blue-500/10 text-blue-600', dotColor: 'bg-blue-500' },
  { value: 'viewed', label: 'Просмотрена', color: 'bg-purple-500/10 text-purple-600', dotColor: 'bg-purple-500' },
  { value: 'approved', label: 'Согласована', color: 'bg-emerald-500/10 text-emerald-600', dotColor: 'bg-emerald-500' },
  { value: 'pending_prepayment', label: 'Ожидает предоплату', color: 'bg-amber-500/10 text-amber-600', dotColor: 'bg-amber-500' },
  { value: 'prepayment_received', label: 'Предоплата получена', color: 'bg-cyan-500/10 text-cyan-600', dotColor: 'bg-cyan-500' },
  { value: 'in_progress', label: 'В работе', color: 'bg-indigo-500/10 text-indigo-600', dotColor: 'bg-indigo-500' },
  { value: 'completed', label: 'Завершена', color: 'bg-green-500/10 text-green-700', dotColor: 'bg-green-600' },
  { value: 'closed', label: 'Закрыта', color: 'bg-green-700/10 text-green-800 dark:text-green-400', dotColor: 'bg-green-700' },
  { value: 'rejected', label: 'Отклонена', color: 'bg-destructive/10 text-destructive', dotColor: 'bg-destructive' },
  { value: 'converted', label: 'Конвертирована', color: 'bg-primary/10 text-primary', dotColor: 'bg-primary' },
];
