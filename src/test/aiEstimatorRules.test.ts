import { describe, expect, it } from "vitest";
import { calculateAIDraftTotal, canSaveAIDraft } from "@/lib/aiEstimatorRules";

describe("AI estimator draft rules", () => {
  it("does not allow saving an empty or unmeasured draft", () => {
    expect(canSaveAIDraft([])).toBe(false);
    expect(canSaveAIDraft([{ quantity: null, unit_price: 450 }])).toBe(false);
    expect(canSaveAIDraft([{ quantity: 0, unit_price: 450 }])).toBe(false);
  });

  it("allows only positive measured quantities and calculates their total", () => {
    const lines = [
      { quantity: 3, unit_price: 450 },
      { quantity: 12.5, unit_price: 18.4 },
    ];
    expect(canSaveAIDraft(lines)).toBe(true);
    expect(calculateAIDraftTotal(lines)).toBe(1580);
  });

  it("does not include an unknown quantity in the displayed total", () => {
    expect(calculateAIDraftTotal([
      { quantity: 2, unit_price: 100 },
      { quantity: null, unit_price: 999 },
    ])).toBe(200);
  });
});
