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
      <header className={`site-header ${minimalHeader ? "site-header-minimal" : ""}`}>
        <div className={`site-header-inner ${minimalHeader ? "site-header-inner-compact" : "site-header-inner-stream"}`}>
          <div className="flex min-w-0 items-center gap-3">
            <Link className="site-brand site-brand-stream" href={withLangAndEntry("/", lang, entryToken)}>
              <span className="brand-mark">TS</span>
              {!minimalHeader ? (
                <span className="site-brand-copy">
                  <strong className="brand-wordmark">Tsuzuri</strong>
                </span>
              ) : null}
            </Link>

            <nav className={`site-nav ${minimalHeader ? "site-nav-compact" : "site-nav-stream"}`} aria-label="Primary">
              <Link className={`site-nav-link ${minimalHeader ? "site-nav-link-compact" : "site-nav-link-stream"}`} href={withLangAndEntry("/", lang, entryToken)}>
                {pickText(lang, "\u56fe\u5899", "\u30ae\u30e3\u30e9\u30ea\u30fc")}
              </Link>
              <Link className={`site-nav-link ${minimalHeader ? "site-nav-link-compact" : "site-nav-link-stream"}`} href={withLangAndEntry("/services", lang, entryToken)}>
                {pickText(lang, "\u5957\u9910", "\u30e1\u30cb\u30e5\u30fc")}
              </Link>
            </nav>
          </div>

          <div className="site-header-tools shrink-0">
            {entryToken && !minimalHeader ? <span className="site-entry-pill">LINE</span> : null}
            <Link className={`site-lang-switch ${minimalHeader ? "site-lang-switch-compact" : "site-lang-switch-stream"}`} href={withLangAndEntry("/", altLang, entryToken)}>
              {altLang === "ja" ? "JP" : "\u4e2d\u6587"}
            </Link>
          </div>
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
