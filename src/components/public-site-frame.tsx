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
  if (entryToken) params.set("entry", entryToken);
  return `${pathname}?${params.toString()}`;
}

export default function PublicSiteFrame({
  lang,
  children,
  entryToken,
  minimalHeader = false,
}: Props) {
  const altLang = lang === "ja" ? "zh" : "ja";

  return (
    <div className="site-shell">
      <header className={`site-header${minimalHeader ? " site-header-minimal" : ""}`}>
        <div className="site-header-inner">
          {/* Brand wordmark only — no badge */}
          <div className="flex min-w-0 items-center gap-3">
            <Link
              className="site-brand"
              href={withLangAndEntry("/", lang, entryToken)}
            >
              <strong className="brand-wordmark">Tsuzuri</strong>
            </Link>

            {!minimalHeader && (
              <>
                <span
                  aria-hidden="true"
                  style={{
                    width: 1,
                    height: 16,
                    background: "var(--border-mid)",
                    flexShrink: 0,
                  }}
                />
                <nav className="site-nav" aria-label="Primary">
                  <Link
                    className="site-nav-link"
                    href={withLangAndEntry("/", lang, entryToken)}
                  >
                    {pickText(lang, "图墙", "ギャラリー")}
                  </Link>
                  <Link
                    className="site-nav-link"
                    href={withLangAndEntry("/services", lang, entryToken)}
                  >
                    {pickText(lang, "套餐", "メニュー")}
                  </Link>
                  <Link
                    className="site-nav-link"
                    href={withLangAndEntry("/addons", lang, entryToken)}
                  >
                    {pickText(lang, "加项", "オプション")}
                  </Link>
                </nav>
              </>
            )}
          </div>

          <div className="site-header-tools shrink-0">
            {entryToken && !minimalHeader && (
              <span className="site-entry-pill">LINE</span>
            )}
            <Link
              className="site-lang-switch"
              href={withLangAndEntry("/", altLang, entryToken)}
            >
              {altLang === "ja" ? "JP" : "中文"}
            </Link>
          </div>
        </div>
      </header>

      <div className="site-main">{children}</div>

      {!minimalHeader && (
        <footer className="site-footer">
          <div className="site-footer-inner site-footer-inner-stream">
            <div className="site-footer-links site-footer-links-inline">
              <Link href={withLangAndEntry("/", lang, entryToken)}>
                {pickText(lang, "图墙", "ギャラリー")}
              </Link>
              <Link href={withLangAndEntry("/services", lang, entryToken)}>
                {pickText(lang, "套餐", "メニュー")}
              </Link>
              <Link href={withLangAndEntry("/addons", lang, entryToken)}>
                {pickText(lang, "加项", "オプション")}
              </Link>
              <span style={{ color: "var(--border-mid)" }}>·</span>
              <span>© 2025 Tsuzuri</span>
            </div>
          </div>
        </footer>
      )}
    </div>
  );
}
