/** Shared constants for editable LINE notification message templates. */

export const LINE_MSG_KEYS = [
  "line_msg_welcome_1",
  "line_msg_welcome_2",
  "line_msg_gallery_1",
  "line_msg_gallery_2",
  "line_msg_pending",
  "line_msg_confirmed",
  "line_msg_rescheduled"
] as const;

export type LineMsgKey = (typeof LINE_MSG_KEYS)[number];

export type LineMsgSettings = Record<LineMsgKey, string>;

/** Fallback values used when the row is absent from SystemSetting. */
export const LINE_MSG_DEFAULTS: LineMsgSettings = {
  line_msg_welcome_1: "サロン LINE の追加ありがとうございます。",
  line_msg_welcome_2: "予約はメニューページからご希望のメニューを選んで進めてください。",
  line_msg_gallery_1: "下のリンクからメニューを見てご予約ください。",
  line_msg_gallery_2: "メニューと希望時間をそのまま選択できます。",
  line_msg_pending: "ご予約リクエストを受け付けました。店長確認をお待ちください。",
  line_msg_confirmed: "ご予約が確定しました。ご来店をお待ちしています。",
  line_msg_rescheduled: "ご予約の時間が変更されました。新しい時間をご確認ください。"
};

const LEGACY_LINE_MESSAGES = new Map<string, string>([
  ["予約はギャラリーホームからお好みのデザインを選んで進めてください。", LINE_MSG_DEFAULTS.line_msg_welcome_2],
  ["予約は定額メニューホームからお好みのデザインを選んで進めてください。", LINE_MSG_DEFAULTS.line_msg_welcome_2],
  ["下のリンクからギャラリーを見てご予約ください。", LINE_MSG_DEFAULTS.line_msg_gallery_1],
  ["下のリンクから定額メニューを見てご予約ください。", LINE_MSG_DEFAULTS.line_msg_gallery_1],
  ["デザインと希望時間をそのまま選択できます。", LINE_MSG_DEFAULTS.line_msg_gallery_2]
]);

function normalizeLegacyTerminology(value: string): string {
  const migratedDefault = LEGACY_LINE_MESSAGES.get(value);
  if (migratedDefault) return migratedDefault;

  return value
    .replaceAll("图墙", "定额款式")
    .replaceAll("定额套餐", "定额款式")
    .replaceAll("ギャラリー", "定額デザイン")
    .replaceAll("定額メニュー", "定額デザイン");
}

/** Build a LineMsgSettings from raw DB rows (missing keys → defaults). */
export function parseMsgSettings(
  rows: Array<{ key: string; value: string }>
): LineMsgSettings {
  const byKey = new Map(rows.map((r) => [r.key, r.value]));
  const result = {} as LineMsgSettings;
  for (const key of LINE_MSG_KEYS) {
    result[key] = normalizeLegacyTerminology(byKey.get(key) ?? LINE_MSG_DEFAULTS[key]);
  }
  return result;
}
