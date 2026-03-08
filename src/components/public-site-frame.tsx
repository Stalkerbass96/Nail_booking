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
              <small>{pickText(lang, "LINE \u5bfc\u6d41\u7f8e\u7532\u9884\u7ea6", "LINE \u5c0e\u7dda\u30cd\u30a4\u30eb\u4e88\u7d04")}</small>
            </span>
          </Link>

          <nav className="site-nav" aria-label="Primary">
            <Link className="site-nav-link" href={withLangAndEntry("/", lang, entryToken)}>
              {pickText(lang, "\u56fe\u5899", "\u30ae\u30e3\u30e9\u30ea\u30fc")}
            </Link>
            <Link className="site-nav-link" href={`/services?lang=${lang}`}>
              {pickText(lang, "\u5957\u9910", "\u30e1\u30cb\u30e5\u30fc")}
            </Link>
            <Link className="site-nav-link" href={`/admin/login?lang=${lang}`}>
              {pickText(lang, "\u5e97\u957f\u540e\u53f0", "\u7ba1\u7406\u753b\u9762")}
            </Link>
            <Link className="site-lang-switch" href={withLangAndEntry("/", altLang, entryToken)}>
              {altLang === "ja" ? "\u65e5\u672c\u8a9e" : "\u4e2d\u6587"}
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
              {pickText(
                lang,
                "\u987e\u5ba2\u4ece LINE \u8fdb\u5165\u56fe\u5899\u9009\u6b3e\uff0c\u5e97\u957f\u5728\u540e\u53f0\u786e\u8ba4\u9884\u7ea6\u5e76\u7ee7\u7eed 1 \u5bf9 1 \u6c9f\u901a\u3002",
                "\u304a\u5ba2\u69d8\u306f LINE \u304b\u3089\u30ae\u30e3\u30e9\u30ea\u30fc\u3067\u30c7\u30b6\u30a4\u30f3\u3092\u9078\u3073\u3001\u5e97\u9577\u306f\u7ba1\u7406\u753b\u9762\u3067\u4e88\u7d04\u78ba\u8a8d\u3068 1 \u5bfe 1 \u5bfe\u5fdc\u3092\u884c\u3044\u307e\u3059\u3002"
              )}
            </p>
          </div>
          <div className="site-footer-links">
            <Link href={withLangAndEntry("/", lang, entryToken)}>{pickText(lang, "\u8fd4\u56de\u56fe\u5899", "\u30ae\u30e3\u30e9\u30ea\u30fc\u3078")}</Link>
            <Link href={`/services?lang=${lang}`}>{pickText(lang, "\u67e5\u770b\u5957\u9910", "\u30e1\u30cb\u30e5\u30fc\u4e00\u89a7")}</Link>
            <Link href={`/admin/login?lang=${lang}`}>{pickText(lang, "\u540e\u53f0\u767b\u5f55", "\u7ba1\u7406\u30ed\u30b0\u30a4\u30f3")}</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
