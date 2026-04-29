"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import AdminLogoutButton from "@/components/admin-logout-button";
import type { Lang } from "@/lib/lang";

type Props = {
  lang: Lang;
};

const LINKS = [
  { href: "/admin",              zh: "总览",   ja: "ダッシュボード" },
  { href: "/admin/showcase",     zh: "图墙",   ja: "ギャラリー" },
  { href: "/admin/appointments", zh: "预约",   ja: "予約" },
  { href: "/admin/schedule",     zh: "排班",   ja: "営業" },
  { href: "/admin/categories",   zh: "分类",   ja: "カテゴリ" },
  { href: "/admin/packages",     zh: "套餐",   ja: "メニュー" },
  { href: "/admin/addons",       zh: "加项",   ja: "追加オプション" },
  { href: "/admin/customers",    zh: "客户",   ja: "顧客" },
  { href: "/admin/points",       zh: "积分",   ja: "ポイント" },
  { href: "/admin/line",         zh: "LINE",   ja: "LINE" },
  { href: "/admin/settings",     zh: "设置",   ja: "設定" },
];

function buildHref(pathname: string, rawSearch: string, lang: Lang): string {
  const params = new URLSearchParams(rawSearch);
  params.set("lang", lang);
  const next = params.toString();
  return next ? `${pathname}?${next}` : pathname;
}

export default function AdminNav({ lang }: Props) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const rawSearch = searchParams.toString();

  return (
    <nav
      className="sticky top-0 z-30 -mx-4 mb-5 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6"
      style={{
        borderBottom: "1px solid var(--border)",
        background: "rgba(250, 248, 245, 0.96)",
      }}
    >
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 lg:flex-row lg:items-center">
        {/* Wordmark only — no badge */}
        <Link
          href={buildHref("/admin", rawSearch, lang)}
          className="flex shrink-0 items-center gap-1.5 no-underline"
          style={{ color: "var(--text)" }}
        >
          <span style={{ fontSize: 15, fontWeight: 600, letterSpacing: "0.06em" }}>
            Tsuzuri
          </span>
          <span style={{ fontSize: 11, fontWeight: 500, color: "var(--text-3)", letterSpacing: "0.1em", textTransform: "uppercase" }}>
            Admin
          </span>
        </Link>

        {/* Page links */}
        <div className="flex min-w-0 flex-1 gap-0.5 overflow-x-auto pb-1 lg:pb-0" style={{ scrollbarWidth: "none" }}>
          {LINKS.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={buildHref(item.href, rawSearch, lang)}
                className="inline-flex min-h-8 shrink-0 items-center justify-center rounded-lg px-3 py-1.5 text-sm font-medium transition-colors duration-150"
                style={
                  active
                    ? { background: "var(--text)", color: "#fff", border: "1px solid var(--text)" }
                    : { background: "transparent", color: "var(--text-3)", border: "1px solid transparent" }
                }
              >
                {lang === "ja" ? item.ja : item.zh}
              </Link>
            );
          })}
        </div>

        {/* Lang switch + logout */}
        <div className="flex shrink-0 items-center gap-1.5 lg:ml-auto">
          {(["zh", "ja"] as const).map((l) => (
            <Link
              key={l}
              href={buildHref(pathname, rawSearch, l)}
              className="inline-flex min-h-8 items-center justify-center rounded-lg px-3 py-1.5 text-sm font-medium transition-colors duration-150"
              style={
                lang === l
                  ? { background: "var(--text)", color: "#fff", border: "1px solid var(--text)" }
                  : { background: "var(--surface)", color: "var(--text-2)", border: "1px solid var(--border-mid)" }
              }
            >
              {l === "zh" ? "中文" : "JP"}
            </Link>
          ))}
          <AdminLogoutButton lang={lang} />
        </div>
      </div>
    </nav>
  );
}
