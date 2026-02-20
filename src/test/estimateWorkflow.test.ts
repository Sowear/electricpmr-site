import { describe, it, expect } from "vitest";
import { validateTransition, getAvailableTransitions } from "@/hooks/useEstimateWorkflow";
import { Estimate, EstimateStatus, calculateLineTotal, calculateEstimateTotals, LineItem } from "@/types/estimator";

// ── validateTransition ──

describe("validateTransition", () => {
  const base: Partial<Estimate> = {
    status: "draft" as EstimateStatus,
    deposit_pct: 0,
    prepayment_confirmed: false,
    payment_method: "",
    payment_recipient: "",
  };

  it("allows draft → sent", () => {
    expect(validateTransition(base, "sent")).toEqual({ valid: true });
  });

  it("disallows draft → approved", () => {
    const result = validateTransition(base, "approved");
    expect(result.valid).toBe(false);
  });

  it("disallows in_progress without prepayment when deposit > 0", () => {
    const est: Partial<Estimate> = {
      ...base,
      status: "prepayment_received",
      deposit_pct: 30,
      prepayment_confirmed: false,
      payment_method: "cash",
      payment_recipient: "John",
    };
    const result = validateTransition(est, "in_progress");
    expect(result.valid).toBe(false);
  });

  it("allows in_progress when prepayment confirmed", () => {
    const est: Partial<Estimate> = {
      ...base,
      status: "prepayment_received",
      deposit_pct: 30,
      prepayment_confirmed: true,
      payment_method: "cash",
      payment_recipient: "John",
    };
    const result = validateTransition(est, "in_progress");
    expect(result.valid).toBe(true);
  });

  it("disallows in_progress without payment_method", () => {
    const est: Partial<Estimate> = {
      ...base,
      status: "prepayment_received",
      deposit_pct: 0,
      prepayment_confirmed: true,
      payment_method: "",
      payment_recipient: "John",
    };
    const result = validateTransition(est, "in_progress");
    expect(result.valid).toBe(false);
  });

  it("disallows prepayment_received without payment fields", () => {
    const est: Partial<Estimate> = {
      ...base,
      status: "pending_prepayment",
      payment_method: "",
      payment_recipient: "",
    };
    const result = validateTransition(est, "prepayment_received");
    expect(result.valid).toBe(false);
  });
});

// ── getAvailableTransitions ──

describe("getAvailableTransitions", () => {
  it("returns [sent] for draft", () => {
    expect(getAvailableTransitions({ status: "draft" })).toEqual(["sent"]);
  });

  it("returns [] for closed", () => {
    expect(getAvailableTransitions({ status: "closed" })).toEqual([]);
  });

  it("returns [completed] for in_progress", () => {
    expect(getAvailableTransitions({ status: "in_progress" })).toEqual(["completed"]);
  });
});

// ── calculateLineTotal ──

describe("calculateLineTotal", () => {
  it("calculates basic line total", () => {
    expect(calculateLineTotal({ quantity: 2, unit_price: 100 })).toBe(200);
  });

  it("includes labor cost", () => {
    expect(calculateLineTotal({ quantity: 1, unit_price: 100, labor_hours: 2, labor_rate: 50 })).toBe(200);
  });

  it("applies markup", () => {
    // 1 * 100 = 100, markup 10% = 10, total = 110
    expect(calculateLineTotal({ quantity: 1, unit_price: 100, markup_pct: 10 })).toBe(110);
  });

  it("applies discount", () => {
    // 1 * 100 = 100, discount 10% = 10, total = 90
    expect(calculateLineTotal({ quantity: 1, unit_price: 100, discount_pct: 10 })).toBe(90);
  });
});

// ── calculateEstimateTotals ──

describe("calculateEstimateTotals", () => {
  const items: LineItem[] = [
    { id: "1", position: 1, item_type: "service", description: "Test", unit: "шт", quantity: 1, unit_price: 1000, labor_hours: 0, labor_rate: 0, cost_price: 0, markup_pct: 0, discount_pct: 0, tax_pct: 0, line_total: 1000 },
    { id: "2", position: 2, item_type: "material", description: "Mat", unit: "шт", quantity: 2, unit_price: 500, labor_hours: 0, labor_rate: 0, cost_price: 0, markup_pct: 0, discount_pct: 0, tax_pct: 0, line_total: 1000 },
  ];

  it("calculates subtotal correctly", () => {
    const result = calculateEstimateTotals(items, 0, 0, 0, 0, 0, 0);
    expect(result.subtotal).toBe(2000);
    expect(result.total).toBe(2000);
  });

  it("applies global discount", () => {
    const result = calculateEstimateTotals(items, 10, 0, 0, 0, 0, 0);
    expect(result.total).toBe(1800);
  });

  it("applies tax after discount", () => {
    const result = calculateEstimateTotals(items, 0, 0, 20, 0, 0, 0);
    expect(result.taxAmount).toBe(400);
    expect(result.total).toBe(2400);
  });

  it("applies deposit to balance", () => {
    const result = calculateEstimateTotals(items, 0, 0, 0, 0, 30, 0);
    expect(result.balanceDue).toBe(1400);
  });
});
