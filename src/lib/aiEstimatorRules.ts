export type AIDraftLineForCalculation = {
  quantity: number | null;
  unit_price: number;
};

export const canSaveAIDraft = (lines: AIDraftLineForCalculation[]) =>
  lines.length > 0 && lines.every((line) =>
    typeof line.quantity === "number" && Number.isFinite(line.quantity) && line.quantity > 0,
  );

export const calculateAIDraftTotal = (lines: AIDraftLineForCalculation[]) =>
  Math.round(lines.reduce((total, line) => {
    const quantity = typeof line.quantity === "number" && Number.isFinite(line.quantity) && line.quantity > 0
      ? line.quantity
      : 0;
    const price = Number.isFinite(line.unit_price) && line.unit_price > 0 ? line.unit_price : 0;
    return total + quantity * price;
  }, 0) * 100) / 100;
