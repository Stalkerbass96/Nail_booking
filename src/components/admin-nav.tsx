"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import AdminLogoutButton from "@/components/admin-logout-button";
import type { Lang } from "@/lib/lang";

type Props = {
  lang: Lang;
};

const LINKS = [
  { href: "/admin", zh: "\u603b\u89c8", ja: "\u30c0\u30c3\u30b7\u30e5\u30dc\u30fc\u30c9" },
  { href: "/admin/showcase", zh: "\u56fe\u5899", ja: "\u30ae\u30e3\u30e9\u30ea\u30fc" },
  { href: "/admin/appointments", zh: "\u9884\u7ea6", ja: "\u4e88\u7d04" },
  { href: "/admin/schedule", zh: "\u6392\u73ed", ja: "\u55b6\u696d" },
  { href: "/admin/categories", zh: "\u5206\u7c7b", ja: "\u30ab\u30c6\u30b4\u30ea" },
  { href: "/admin/packages", zh: "\u5957\u9910", ja: "\u30e1\u30cb\u30e5\u30fc" },
  { href: "/admin/addons", zh: "\u52a0\u9879", ja: "\u8ffd\u52a0\u30aa\u30d7\u30b7\u30e7\u30f3" },
  { href: "/admin/customers", zh: "\u5ba2\u6237", ja: "\u9867\u5ba2" },
  { href: "/admin/points", zh: "\u79ef\u5206", ja: "\u30dd\u30a4\u30f3\u30c8" },
  { href: "/admin/line", zh: "LINE", ja: "LINE" },
  { href: "/admin/settings", zh: "\u8bbe\u7f6e", ja: "\u8a2d\u5b9a" }
];

const TEXT = {
  zh: {
    langZh: "\u4e2d\u6587",
    langJa: "\u65e5\u672c\u8a9e"
  },
  ja: {
    langZh: "\u4e2d\u6587",
    langJa: "\u65e5\u672c\u8a9e"
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
