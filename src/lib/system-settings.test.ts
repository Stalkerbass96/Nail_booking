import { describe, expect, it } from "vitest";
import { DEFAULT_RUNTIME_SETTINGS, parseRuntimeSettingsSnapshot } from "./system-settings-parser";

describe("system settings parser", () => {
  it("parses configured settings", () => {
    const parsed = parseRuntimeSettingsSnapshot([
      { key: "slot_minutes", value: "15" },
      { key: "pending_auto_cancel_hours", value: "12" },
      { key: "cancel_cutoff_hours", value: "3" },
      { key: "point_earn_ratio_jpy", value: "200" },
      { key: "point_redeem_ratio_jpy", value: "80" }
    ]);

    expect(parsed).toEqual({
      slotMinutes: 15,
      pendingAutoCancelHours: 12,
      cancelCutoffHours: 3,
      pointEarnRatioJpy: 200,
      pointRedeemRatioJpy: 80
    });
  });

  it("falls back for invalid values", () => {
    const parsed = parseRuntimeSettingsSnapshot([
      { key: "slot_minutes", value: "-1" },
      { key: "pending_auto_cancel_hours", value: "abc" },
      { key: "cancel_cutoff_hours", value: "-2" },
      { key: "point_earn_ratio_jpy", value: "0" }
    ]);

    expect(parsed.slotMinutes).toBe(DEFAULT_RUNTIME_SETTINGS.slotMinutes);
    expect(parsed.pendingAutoCancelHours).toBe(DEFAULT_RUNTIME_SETTINGS.pendingAutoCancelHours);
    expect(parsed.cancelCutoffHours).toBe(DEFAULT_RUNTIME_SETTINGS.cancelCutoffHours);
    expect(parsed.pointEarnRatioJpy).toBe(DEFAULT_RUNTIME_SETTINGS.pointEarnRatioJpy);
    expect(parsed.pointRedeemRatioJpy).toBe(DEFAULT_RUNTIME_SETTINGS.pointRedeemRatioJpy);
  });
});
