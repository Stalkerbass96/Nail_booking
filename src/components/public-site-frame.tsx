import Link from "next/link";
import type { ReactNode } from "react";
import type { Lang } from "@/lib/lang";
import { pickText } from "@/lib/lang";

type Props = {
  lang: Lang;
  children: ReactNode;
};

export default function PublicSiteFrame({ lang, children }: Props) {
  const altLang = lang === "ja" ? "zh" : "ja";

  return (
    <div className="site-shell">
      <div className="site-orb site-orb-left" aria-hidden="true" />
      <div className="site-orb site-orb-right" aria-hidden="true" />
      <header className="site-header">
        <div className="site-header-inner">
          <Link className="site-brand" href={`/?lang=${lang}`}>
            <span className="site-brand-badge">NB</span>
            <span>
              <strong>Nail Booking</strong>
              <small>{pickText(lang, "单店美甲预约系统", "単店ネイル予約システム")}</small>
            </span>
          </Link>

          <nav className="site-nav" aria-label="Primary">
            <Link className="site-nav-link" href={`/services?lang=${lang}`}>
              {pickText(lang, "服务", "メニュー")}
            </Link>
            <Link className="site-nav-link" href={`/booking?lang=${lang}`}>
              {pickText(lang, "预约", "予約")}
            </Link>
            <Link className="site-nav-link" href={`/booking/lookup?lang=${lang}`}>
              {pickText(lang, "查询预约", "予約確認")}
            </Link>
            <Link className="site-nav-link" href={`/admin/login?lang=${lang}`}>
              {pickText(lang, "店长后台", "管理画面")}
            </Link>
            <Link className="site-lang-switch" href={`${altLang === "ja" ? "/?lang=ja" : "/?lang=zh"}`}>
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
              {pickText(
                lang,
                "适合单店预约、套餐管理和顾客维护的轻量化系统。",
                "単店サロンの予約、メニュー管理、顧客管理に向いた軽量システムです。"
              )}
            </p>
          </div>
          <div className="site-footer-links">
            <Link href={`/services?lang=${lang}`}>{pickText(lang, "浏览服务", "メニュー一覧")}</Link>
            <Link href={`/booking/lookup?lang=${lang}`}>{pickText(lang, "查询预约", "予約確認")}</Link>
            <Link href={`/admin/login?lang=${lang}`}>{pickText(lang, "后台登录", "管理ログイン")}</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
