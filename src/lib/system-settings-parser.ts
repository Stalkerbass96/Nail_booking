export const SETTING_KEYS = [
  "slot_minutes",
  "pending_auto_cancel_hours",
  "cancel_cutoff_hours",
  "point_earn_ratio_jpy",
  "point_redeem_ratio_jpy"
] as const;

export type SettingKey = (typeof SETTING_KEYS)[number];

export type RuntimeSettingsSnapshot = {
  slotMinutes: number;
  pendingAutoCancelHours: number;
  cancelCutoffHours: number;
  pointEarnRatioJpy: number;
  pointRedeemRatioJpy: number;
};

export const DEFAULT_RUNTIME_SETTINGS: RuntimeSettingsSnapshot = {
  slotMinutes: 30,
  pendingAutoCancelHours: 24,
  cancelCutoffHours: 6,
  pointEarnRatioJpy: 100,
  pointRedeemRatioJpy: 100
};

function parsePositiveInt(raw: string | undefined, fallback: number): number {
  const parsed = Number.parseInt(raw ?? "", 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function parseNonNegativeInt(raw: string | undefined, fallback: number): number {
  const parsed = Number.parseInt(raw ?? "", 10);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
}

export function parseRuntimeSettingsSnapshot(settings: Array<{ key: string; value: string }>): RuntimeSettingsSnapshot {
  const byKey = new Map(settings.map((item) => [item.key, item.value]));

  return {
    slotMinutes: parsePositiveInt(byKey.get("slot_minutes"), DEFAULT_RUNTIME_SETTINGS.slotMinutes),
    pendingAutoCancelHours: parsePositiveInt(
      byKey.get("pending_auto_cancel_hours"),
      DEFAULT_RUNTIME_SETTINGS.pendingAutoCancelHours
    ),
    cancelCutoffHours: parseNonNegativeInt(
      byKey.get("cancel_cutoff_hours"),
      DEFAULT_RUNTIME_SETTINGS.cancelCutoffHours
    ),
    pointEarnRatioJpy: parsePositiveInt(
      byKey.get("point_earn_ratio_jpy"),
      DEFAULT_RUNTIME_SETTINGS.pointEarnRatioJpy
    ),
    pointRedeemRatioJpy: parsePositiveInt(
      byKey.get("point_redeem_ratio_jpy"),
      DEFAULT_RUNTIME_SETTINGS.pointRedeemRatioJpy
    )
  };
}
