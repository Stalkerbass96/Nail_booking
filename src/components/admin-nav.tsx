"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import AdminLogoutButton from "@/components/admin-logout-button";
import type { Lang } from "@/lib/lang";

type Props = {
  lang: Lang;
};

const LINKS = [
  { href: "/admin", zh: "总览", ja: "ダッシュボード" },
  { href: "/admin/appointments", zh: "预约", ja: "予約" },
  { href: "/admin/schedule", zh: "排班", ja: "営業" },
  { href: "/admin/categories", zh: "分类", ja: "カテゴリ" },
  { href: "/admin/packages", zh: "套餐", ja: "メニュー" },
  { href: "/admin/addons", zh: "加项", ja: "追加オプション" },
  { href: "/admin/customers", zh: "客户", ja: "顧客" },
  { href: "/admin/points", zh: "积分", ja: "ポイント" },
  { href: "/admin/line", zh: "LINE", ja: "LINE" },
  { href: "/admin/settings", zh: "设置", ja: "設定" }
];

const TEXT = {
  zh: {
    langZh: "中文",
    langJa: "日本語"
  },
  ja: {
    langZh: "中文",
    langJa: "日本語"
  }
};

function buildHref(pathname: string, rawSearch: string, lang: Lang): string {
  const params = new URLSearchParams(rawSearch);
  params.set("lang", lang);
  const next = params.toString();
  return next ? `${pathname}?${next}` : pathname;
}

export default function AdminNav({ lang }: Props) {
  const t = TEXT[lang];
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const rawSearch = searchParams.toString();

  return (
    <nav className="mb-4 flex flex-wrap items-center gap-2 sm:mb-5">
      {LINKS.map((item) => (
        <Link
          key={item.href}
          href={buildHref(item.href, rawSearch, lang)}
          className={`inline-flex min-h-10 items-center justify-center rounded-lg border px-3 py-2 text-sm transition-colors duration-200 ${
            pathname === item.href
              ? "border-brand-700 bg-brand-700 text-white"
              : "border-brand-300 bg-white text-brand-900 hover:border-brand-500 hover:bg-brand-50"
          }`}
        >
          {lang === "ja" ? item.ja : item.zh}
        </Link>
      ))}

      <div className="ml-auto flex items-center gap-2">
        <Link
          href={buildHref(pathname, rawSearch, "zh")}
          className={`inline-flex min-h-10 items-center justify-center rounded-lg border px-3 py-2 text-sm transition-colors duration-200 ${
            lang === "zh"
              ? "border-brand-700 bg-brand-700 text-white"
              : "border-brand-300 bg-white text-brand-900 hover:border-brand-500 hover:bg-brand-50"
          }`}
        >
          {t.langZh}
        </Link>
        <Link
          href={buildHref(pathname, rawSearch, "ja")}
          className={`inline-flex min-h-10 items-center justify-center rounded-lg border px-3 py-2 text-sm transition-colors duration-200 ${
            lang === "ja"
              ? "border-brand-700 bg-brand-700 text-white"
              : "border-brand-300 bg-white text-brand-900 hover:border-brand-500 hover:bg-brand-50"
          }`}
        >
          {t.langJa}
        </Link>
        <AdminLogoutButton lang={lang} />
      </div>
    </nav>
  );
}
