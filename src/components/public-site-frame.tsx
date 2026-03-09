import Link from "next/link";
import type { ReactNode } from "react";
import type { Lang } from "@/lib/lang";
import { pickText } from "@/lib/lang";

type Props = {
  lang: Lang;
  children: ReactNode;
  entryToken?: string;
};

function withLangAndEntry(pathname: string, lang: Lang, entryToken?: string) {
  const params = new URLSearchParams({ lang });
  if (entryToken) {
    params.set("entry", entryToken);
  }
  return `${pathname}?${params.toString()}`;
}

export default function PublicSiteFrame({ lang, children, entryToken }: Props) {
  const altLang = lang === "ja" ? "zh" : "ja";

  return (
    <div className="site-shell">
      <div className="site-orb site-orb-left" aria-hidden="true" />
      <div className="site-orb site-orb-right" aria-hidden="true" />
      <header className="site-header">
        <div className="site-header-inner site-header-inner-compact">
          <Link className="site-brand site-brand-compact" href={withLangAndEntry("/", lang, entryToken)}>
            <span className="site-brand-badge site-brand-badge-compact">NB</span>
            <span>
              <strong>Nail Booking</strong>
              <small>{pickText(lang, "美甲预约", "ネイル予約")}</small>
            </span>
          </Link>

          <nav className="site-nav site-nav-compact" aria-label="Primary">
            <Link className="site-nav-link site-nav-link-compact" href={withLangAndEntry("/", lang, entryToken)}>
              {pickText(lang, "图墙", "ギャラリー")}
            </Link>
            <Link className="site-nav-link site-nav-link-compact" href={withLangAndEntry("/services", lang, entryToken)}>
              {pickText(lang, "套餐", "メニュー")}
            </Link>
            <Link className="site-lang-switch site-lang-switch-compact" href={withLangAndEntry("/", altLang, entryToken)}>
              {altLang === "ja" ? "日本語" : "中文"}
            </Link>
          </nav>
        </div>
      </header>

      <div className="site-main">{children}</div>

      <footer className="site-footer">
        <div className="site-footer-inner site-footer-inner-compact">
          <p className="site-footer-copy m-0">
            {pickText(lang, "核心路径：图墙选款 -> 选时间 -> 提交预约。", "ギャラリー -> 時間選択 -> 予約送信。")}
          </p>
          <div className="site-footer-links site-footer-links-inline">
            <Link href={withLangAndEntry("/", lang, entryToken)}>{pickText(lang, "图墙", "ギャラリー")}</Link>
            <Link href={withLangAndEntry("/services", lang, entryToken)}>{pickText(lang, "套餐", "メニュー")}</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
