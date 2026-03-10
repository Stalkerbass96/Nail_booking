import Link from "next/link";
import type { ReactNode } from "react";
import type { Lang } from "@/lib/lang";
import { pickText } from "@/lib/lang";

type Props = {
  lang: Lang;
  children: ReactNode;
  entryToken?: string;
  minimalHeader?: boolean;
};

function withLangAndEntry(pathname: string, lang: Lang, entryToken?: string) {
  const params = new URLSearchParams({ lang });
  if (entryToken) {
    params.set("entry", entryToken);
  }
  return `${pathname}?${params.toString()}`;
}

export default function PublicSiteFrame({ lang, children, entryToken, minimalHeader = false }: Props) {
  const altLang = lang === "ja" ? "zh" : "ja";

  return (
    <div className="site-shell">
      <div className="site-orb site-orb-left" aria-hidden="true" />
      <div className="site-orb site-orb-right" aria-hidden="true" />
      <header className="site-header">
        <div className={`site-header-inner ${minimalHeader ? "site-header-inner-compact" : "site-header-inner-stream"}`}>
          <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-center">
            {!minimalHeader ? (
              <Link className="site-brand site-brand-stream" href={withLangAndEntry("/", lang, entryToken)}>
                <span className="brand-mark">NA</span>
                <span className="site-brand-copy">
                  <strong className="brand-wordmark">Nail Atelier</strong>
                  <small className="brand-wordmark-sub">{pickText(lang, "作品预约", "Gallery Booking")}</small>
                </span>
              </Link>
            ) : null}

            <nav className="site-nav site-nav-stream" aria-label="Primary">
              <Link className="site-nav-link site-nav-link-stream" href={withLangAndEntry("/", lang, entryToken)}>
                {pickText(lang, "图墙", "ギャラリー")}
              </Link>
              <Link className="site-nav-link site-nav-link-stream" href={withLangAndEntry("/services", lang, entryToken)}>
                {pickText(lang, "套餐", "メニュー")}
              </Link>
            </nav>
          </div>

          <div className="site-header-tools">
            <Link className="site-lang-switch site-lang-switch-stream" href={withLangAndEntry("/", altLang, entryToken)}>
              {altLang === "ja" ? "日本語" : "中文"}
            </Link>
            {entryToken && !minimalHeader ? <span className="site-entry-pill">{pickText(lang, "LINE 预约中", "LINE 予約中")}</span> : null}
          </div>
        </div>
      </header>

      <div className="site-main">{children}</div>

      <footer className="site-footer">
        <div className="site-footer-inner site-footer-inner-stream">
          <div className="site-footer-links site-footer-links-inline">
            <Link href={withLangAndEntry("/", lang, entryToken)}>{pickText(lang, "图墙", "ギャラリー")}</Link>
            <Link href={withLangAndEntry("/services", lang, entryToken)}>{pickText(lang, "套餐", "メニュー")}</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
