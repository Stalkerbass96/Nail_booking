export type Lang = "zh" | "ja";

export function resolveLang(input?: string | null): Lang {
  return input === "zh" ? "zh" : "ja";
}

export function pickText(lang: Lang, zh: string, ja: string): string {
  return lang === "ja" ? ja : zh;
}