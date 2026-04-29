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
    <nav className="sticky top-0 z-30 -mx-4 mb-5 border-b border-neutral-200 bg-stone-50/95 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 lg:flex-row lg:items-center">
        <Link href={buildHref("/admin", rawSearch, lang)} className="flex items-center gap-3 text-neutral-950 no-underline">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-neutral-950 text-[11px] font-semibold tracking-[0.12em] text-white">TS</span>
          <span className="text-sm font-semibold">Tsuzuri Admin</span>
        </Link>

        <div className="flex min-w-0 flex-1 gap-1 overflow-x-auto pb-1 lg:pb-0">
          {LINKS.map((item) => (
            <Link
              key={item.href}
              href={buildHref(item.href, rawSearch, lang)}
              className={`inline-flex min-h-9 shrink-0 items-center justify-center rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors duration-150 ${
                pathname === item.href
                  ? "border-neutral-950 bg-neutral-950 text-white"
                  : "border-transparent bg-transparent text-neutral-600 hover:bg-white hover:text-neutral-950"
              }`}
            >
              {lang === "ja" ? item.ja : item.zh}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-2 lg:ml-auto">
          <Link
            href={buildHref(pathname, rawSearch, "zh")}
            className={`inline-flex min-h-9 items-center justify-center rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors duration-150 ${
              lang === "zh"
                ? "border-neutral-950 bg-neutral-950 text-white"
                : "border-neutral-200 bg-white text-neutral-700 hover:border-neutral-400"
            }`}
          >
            {"\u4e2d\u6587"}
          </Link>
          <Link
            href={buildHref(pathname, rawSearch, "ja")}
            className={`inline-flex min-h-9 items-center justify-center rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors duration-150 ${
              lang === "ja"
                ? "border-neutral-950 bg-neutral-950 text-white"
                : "border-neutral-200 bg-white text-neutral-700 hover:border-neutral-400"
            }`}
          >
            JP
          </Link>
          <AdminLogoutButton lang={lang} />
        </div>
      </div>
    </nav>
  );
}
