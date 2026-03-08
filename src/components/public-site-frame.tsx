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
        <div className="site-header-inner">
          <Link className="site-brand" href={withLangAndEntry("/", lang, entryToken)}>
            <span className="site-brand-badge">NB</span>
            <span>
              <strong>Nail Booking</strong>
              <small>{pickText(lang, "美甲预约", "ネイル予約")}</small>
            </span>
          </Link>

          <nav className="site-nav" aria-label="Primary">
            <Link className="site-nav-link" href={withLangAndEntry("/", lang, entryToken)}>
              {pickText(lang, "图墙", "ギャラリー")}
            </Link>
            <Link className="site-nav-link" href={withLangAndEntry("/services", lang, entryToken)}>
              {pickText(lang, "套餐", "メニュー")}
            </Link>
            <Link className="site-lang-switch" href={withLangAndEntry("/", altLang, entryToken)}>
              {altLang === "ja" ? "日本語" : "中文"}
            </Link>
          </nav>
        </div>
      </header>

      <div className="site-main">{children}</div>

      <footer className="site-footer">
        <div className="site-footer-inner">
          <div>
            <p className="site-footer-title">Nail Booking</p>
            <p className="site-footer-copy">
              {pickText(lang, "从图墙选款后直接进入预约。", "ギャラリーからデザインを選んでそのまま予約します。")}
            </p>
          </div>
          <div className="site-footer-links">
            <Link href={withLangAndEntry("/", lang, entryToken)}>{pickText(lang, "图墙", "ギャラリー")}</Link>
            <Link href={withLangAndEntry("/services", lang, entryToken)}>{pickText(lang, "套餐", "メニュー")}</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
