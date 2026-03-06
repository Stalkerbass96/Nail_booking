import { describe, expect, it } from "vitest";
import { calculateEarnedPoints, calculateRedeemJpy } from "./points";

describe("points rules", () => {
  it("calculateEarnedPoints should follow configurable ratio", () => {
    expect(calculateEarnedPoints(999, 100)).toBe(9);
    expect(calculateEarnedPoints(999, 250)).toBe(3);
  });

  it("calculateRedeemJpy should follow configurable ratio", () => {
    expect(calculateRedeemJpy(12, 100)).toBe(1200);
    expect(calculateRedeemJpy(12, 80)).toBe(960);
  });

  it("falls back to defaults for invalid ratios", () => {
    expect(calculateEarnedPoints(200, 0)).toBe(2);
    expect(calculateRedeemJpy(2, -1)).toBe(200);
  });
});
