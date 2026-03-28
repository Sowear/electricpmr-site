import { describe, expect, it } from "vitest";

function canApprove(participantCount: number) {
  if (participantCount <= 0) {
    return {
      ok: false,
      reason: "Нельзя согласовать смету без назначенных участников. Добавьте хотя бы одного участника.",
    };
  }
  return { ok: true };
}

describe("participant approval validation", () => {
  it("blocks approval without participants", () => {
    const result = canApprove(0);
    expect(result.ok).toBe(false);
  });

  it("allows approval with participants", () => {
    const result = canApprove(1);
    expect(result.ok).toBe(true);
  });
});
