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
      <header className={`site-header ${minimalHeader ? "site-header-minimal" : ""}`}>
        <div className={`site-header-inner ${minimalHeader ? "site-header-inner-compact" : "site-header-inner-stream"}`}>
          <div className={`flex w-full ${minimalHeader ? "items-center justify-between gap-2" : "flex-col gap-3 sm:w-auto sm:flex-row sm:items-center"}`}>
            {!minimalHeader ? (
              <Link className="site-brand site-brand-stream" href={withLangAndEntry("/", lang, entryToken)}>
                <span className="brand-mark">NA</span>
                <span className="site-brand-copy">
                  <strong className="brand-wordmark">Nail Atelier</strong>
                  <small className="brand-wordmark-sub">{pickText(lang, "\u4f5c\u54c1\u9884\u7ea6", "Gallery Booking")}</small>
                </span>
              </Link>
            ) : null}

            <nav className={`site-nav ${minimalHeader ? "site-nav-compact" : "site-nav-stream"}`} aria-label="Primary">
              <Link className={`site-nav-link ${minimalHeader ? "site-nav-link-compact" : "site-nav-link-stream"}`} href={withLangAndEntry("/", lang, entryToken)}>
                {pickText(lang, "\u56fe\u5899", "\u30ae\u30e3\u30e9\u30ea\u30fc")}
              </Link>
              <Link className={`site-nav-link ${minimalHeader ? "site-nav-link-compact" : "site-nav-link-stream"}`} href={withLangAndEntry("/services", lang, entryToken)}>
                {pickText(lang, "\u5957\u9910", "\u30e1\u30cb\u30e5\u30fc")}
              </Link>
            </nav>

            {minimalHeader ? (
              <div className="site-header-tools shrink-0">
                <Link className="site-lang-switch site-lang-switch-compact" href={withLangAndEntry("/", altLang, entryToken)}>
                  {altLang === "ja" ? "\u65e5\u672c\u8a9e" : "\u4e2d\u6587"}
                </Link>
              </div>
            ) : null}
          </div>

          {!minimalHeader ? (
            <div className="site-header-tools">
              <Link className="site-lang-switch site-lang-switch-stream" href={withLangAndEntry("/", altLang, entryToken)}>
                {altLang === "ja" ? "\u65e5\u672c\u8a9e" : "\u4e2d\u6587"}
              </Link>
              {entryToken ? <span className="site-entry-pill">{pickText(lang, "LINE \u9884\u7ea6\u4e2d", "LINE \u4e88\u7d04\u4e2d")}</span> : null}
            </div>
          ) : null}
        </div>
      </header>

      <div className="site-main">{children}</div>

      {!minimalHeader ? (
        <footer className="site-footer">
          <div className="site-footer-inner site-footer-inner-stream">
            <div className="site-footer-links site-footer-links-inline">
              <Link href={withLangAndEntry("/", lang, entryToken)}>{pickText(lang, "\u56fe\u5899", "\u30ae\u30e3\u30e9\u30ea\u30fc")}</Link>
              <Link href={withLangAndEntry("/services", lang, entryToken)}>{pickText(lang, "\u5957\u9910", "\u30e1\u30cb\u30e5\u30fc")}</Link>
            </div>
          </div>
        </footer>
      ) : null}
    </div>
  );
}
