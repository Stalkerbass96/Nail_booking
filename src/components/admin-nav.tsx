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
  { href: "/admin/categories", zh: "分类", ja: "カテゴリ" },
  { href: "/admin/packages", zh: "套餐", ja: "メニュー" },
  { href: "/admin/addons", zh: "加项", ja: "追加オプション" },
  { href: "/admin/customers", zh: "客户", ja: "顧客" },
  { href: "/admin/points", zh: "积分", ja: "ポイント" }
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
    <nav className="mb-4 flex flex-wrap items-center gap-2">
      {LINKS.map((item) => (
        <Link
          key={item.href}
          href={buildHref(item.href, rawSearch, lang)}
          className="rounded-lg border border-brand-300 px-3 py-1 text-sm text-brand-900"
        >
          {lang === "ja" ? item.ja : item.zh}
        </Link>
      ))}

      <div className="ml-auto flex items-center gap-2">
        <Link
          href={buildHref(pathname, rawSearch, "zh")}
          className={`rounded-lg border px-3 py-1 text-sm ${lang === "zh" ? "border-brand-700 bg-brand-700 text-white" : "border-brand-300 text-brand-900"}`}
        >
          {t.langZh}
        </Link>
        <Link
          href={buildHref(pathname, rawSearch, "ja")}
          className={`rounded-lg border px-3 py-1 text-sm ${lang === "ja" ? "border-brand-700 bg-brand-700 text-white" : "border-brand-300 text-brand-900"}`}
        >
          {t.langJa}
        </Link>
        <AdminLogoutButton lang={lang} />
      </div>
    </nav>
  );
}
