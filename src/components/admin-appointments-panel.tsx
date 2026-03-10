"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { Lang } from "@/lib/lang";

type AppointmentItem = {
  id: string;
  bookingNo: string;
  status: "pending" | "confirmed" | "completed" | "canceled";
  startAt: string;
  endAt: string;
  sourceChannel: "line_showcase" | "admin_manual" | "legacy_web";
  customer: {
    name: string;
    email: string | null;
    customerType: "lead" | "active";
    lineUser: {
      id: string;
      lineUserId: string;
      displayName: string | null;
      isFollowing: boolean;
    } | null;
  };
  package: {
    id: string;
    name: string;
  };
  showcaseItem: {
    id: string;
    title: string;
  } | null;
  addons: Array<{
    id: string;
    name: string;
  }>;
};

type CompleteDraft = {
  actualPaidJpy: string;
  usePoints: string;
  note: string;
};

type SourceFilter = "all" | AppointmentItem["sourceChannel"];

type Props = {
  lang: Lang;
};

const TEXT = {
  zh: {
    title: "\u9884\u7ea6\u7ba1\u7406",
    subtitle: "\u6309\u65e5\u671f\u3001\u72b6\u6001\u3001\u5165\u53e3\u548c\u56fe\u5899\u6b3e\u5f0f\u5feb\u901f\u7b5b\u9009\u9884\u7ea6\uff0c\u5e76\u5728\u4e00\u4e2a\u9875\u9762\u91cc\u5b8c\u6210\u786e\u8ba4\u3001\u53d6\u6d88\u548c\u5b8c\u7ed3\u3002",
    date: "\u65e5\u671f",
    status: "\u72b6\u6001",
    source: "\u9884\u7ea6\u5165\u53e3",
    showcase: "\u56fe\u5899\u6b3e\u5f0f",
    keyword: "\u5173\u952e\u8bcd",
    keywordPlaceholder: "\u641c\u7d22\u9884\u7ea6\u53f7\u3001\u987e\u5ba2\u59d3\u540d\u3001LINE \u6635\u79f0\u3001\u56fe\u5899\u6b3e\u5f0f\u6216\u5957\u9910",
    refresh: "\u5237\u65b0",
    reset: "\u91cd\u7f6e\u7b5b\u9009",
    pending: "\u5f85\u786e\u8ba4",
    confirmed: "\u5df2\u786e\u8ba4",
    completed: "\u5df2\u5b8c\u6210",
    canceled: "\u5df2\u53d6\u6d88",
    all: "\u5168\u90e8",
    allSources: "\u5168\u90e8\u5165\u53e3",
    allShowcase: "\u5168\u90e8\u6b3e\u5f0f",
    noShowcase: "\u975e\u56fe\u5899\u6d41\u7a0b",
    customer: "\u987e\u5ba2",
    time: "\u65f6\u95f4",
    service: "\u670d\u52a1",
    confirm: "\u786e\u8ba4\u9884\u7ea6",
    cancel: "\u53d6\u6d88\u9884\u7ea6",
    complete: "\u5b8c\u6210\u9884\u7ea6",
    loading: "\u52a0\u8f7d\u4e2d...",
    empty: "\u5f53\u524d\u7b5b\u9009\u6761\u4ef6\u4e0b\u6ca1\u6709\u9884\u7ea6\u8bb0\u5f55\u3002",
    loadFailed: "\u52a0\u8f7d\u9884\u7ea6\u5931\u8d25",
    actionFailed: "\u64cd\u4f5c\u5931\u8d25",
    confirmCancel: "\u786e\u5b9a\u8981\u53d6\u6d88\u8fd9\u7b14\u9884\u7ea6\u5417\uff1f\u53d6\u6d88\u540e\u5c06\u7acb\u5373\u91ca\u653e\u65f6\u95f4\u6bb5\u3002",
    countSuffix: "\u7b14\u9884\u7ea6",
    completeTitle: "\u5b8c\u6210\u9884\u7ea6",
    actualPaid: "\u5b9e\u4ed8\u91d1\u989d (JPY)",
    usePoints: "\u4f7f\u7528\u79ef\u5206",
    note: "\u5907\u6ce8",
    notePlaceholder: "\u8bb0\u5f55\u5b9e\u6536\u60c5\u51b5\u3001\u5e97\u5185\u5907\u6ce8\u6216\u8865\u5145\u8bf4\u660e",
    saveComplete: "\u4fdd\u5b58\u5b8c\u6210\u8bb0\u5f55",
    close: "\u5173\u95ed",
    invalidComplete: "\u8bf7\u586b\u5199\u6709\u6548\u7684\u5b9e\u4ed8\u91d1\u989d\u548c\u79ef\u5206\u6570\uff0c\u4e14\u90fd\u4e0d\u80fd\u5c0f\u4e8e 0\u3002",
    addons: "\u52a0\u9879",
    filtersTitle: "\u7b5b\u9009\u6761\u4ef6",
    overviewTitle: "\u9884\u7ea6\u6982\u89c8",
    noAddons: "\u65e0",
    visibleCount: "\u5f53\u524d\u53ef\u89c1",
    quickActions: "\u4f18\u5148\u5904\u7406\u5f85\u786e\u8ba4\u9884\u7ea6\uff0c\u518d\u5173\u6ce8\u5f53\u5929\u5df2\u786e\u8ba4\u548c\u5df2\u5b8c\u6210\u8bb0\u5f55\u3002",
    pendingHint: "\u65b0\u9884\u7ea6\u63d0\u4ea4\u540e\u7b49\u5f85\u5e97\u957f\u786e\u8ba4\u3002",
    confirmedHint: "\u5df2\u786e\u8ba4\uff0c\u5c06\u6309\u9884\u7ea6\u65f6\u95f4\u5360\u7528\u6863\u671f\u3002",
    completedHint: "\u670d\u52a1\u5df2\u5b8c\u6210\uff0c\u53ef\u7528\u4e8e\u79ef\u5206\u7ed3\u7b97\u3002",
    canceledHint: "\u5df2\u53d6\u6d88\uff0c\u6863\u671f\u5df2\u91ca\u653e\u3002",
    allHint: "\u663e\u793a\u5f53\u524d\u7b5b\u9009\u6761\u4ef6\u4e0b\u7684\u5168\u90e8\u9884\u7ea6\u3002",
    openLineConversation: "\u6253\u5f00 LINE \u4f1a\u8bdd"
  },
  ja: {
    title: "\u4e88\u7d04\u7ba1\u7406",
    subtitle: "\u65e5\u4ed8\u3001\u72b6\u614b\u3001\u5c0e\u7dda\u3001\u30ae\u30e3\u30e9\u30ea\u30fc\u9805\u76ee\u3067\u4e88\u7d04\u3092\u7d5e\u308a\u8fbc\u307f\u3001\u78ba\u8a8d\u30fb\u30ad\u30e3\u30f3\u30bb\u30eb\u30fb\u5b8c\u4e86\u51e6\u7406\u3092\u4e00\u753b\u9762\u3067\u9032\u3081\u3089\u308c\u307e\u3059\u3002",
    date: "\u65e5\u4ed8",
    status: "\u72b6\u614b",
    source: "\u4e88\u7d04\u5c0e\u7dda",
    showcase: "\u30ae\u30e3\u30e9\u30ea\u30fc\u9805\u76ee",
    keyword: "\u30ad\u30fc\u30ef\u30fc\u30c9",
    keywordPlaceholder: "\u4e88\u7d04\u756a\u53f7\u3001\u9867\u5ba2\u540d\u3001LINE \u540d\u3001\u30ae\u30e3\u30e9\u30ea\u30fc\u540d\u3001\u30e1\u30cb\u30e5\u30fc\u540d\u3067\u691c\u7d22",
    refresh: "\u518d\u8aad\u8fbc",
    reset: "\u6761\u4ef6\u3092\u30ea\u30bb\u30c3\u30c8",
    pending: "\u672a\u78ba\u8a8d",
    confirmed: "\u78ba\u5b9a\u6e08\u307f",
    completed: "\u5b8c\u4e86",
    canceled: "\u30ad\u30e3\u30f3\u30bb\u30eb",
    all: "\u3059\u3079\u3066",
    allSources: "\u3059\u3079\u3066\u306e\u5c0e\u7dda",
    allShowcase: "\u3059\u3079\u3066\u306e\u30ae\u30e3\u30e9\u30ea\u30fc",
    noShowcase: "\u30ae\u30e3\u30e9\u30ea\u30fc\u7d4c\u7531\u3067\u306f\u306a\u3044",
    customer: "\u9867\u5ba2",
    time: "\u65e5\u6642",
    service: "\u30e1\u30cb\u30e5\u30fc",
    confirm: "\u4e88\u7d04\u78ba\u5b9a",
    cancel: "\u4e88\u7d04\u53d6\u6d88",
    complete: "\u65bd\u8853\u5b8c\u4e86",
    loading: "\u8aad\u307f\u8fbc\u307f\u4e2d...",
    empty: "\u6761\u4ef6\u306b\u4e00\u81f4\u3059\u308b\u4e88\u7d04\u306f\u3042\u308a\u307e\u305b\u3093\u3002",
    loadFailed: "\u4e88\u7d04\u4e00\u89a7\u306e\u53d6\u5f97\u306b\u5931\u6557\u3057\u307e\u3057\u305f",
    actionFailed: "\u64cd\u4f5c\u306b\u5931\u6557\u3057\u307e\u3057\u305f",
    confirmCancel: "\u3053\u306e\u4e88\u7d04\u3092\u30ad\u30e3\u30f3\u30bb\u30eb\u3057\u307e\u3059\u304b\u3002\u30ad\u30e3\u30f3\u30bb\u30eb\u3059\u308b\u3068\u67a0\u306f\u5373\u6642\u89e3\u653e\u3055\u308c\u307e\u3059\u3002",
    countSuffix: "\u4ef6\u306e\u4e88\u7d04",
    completeTitle: "\u65bd\u8853\u5b8c\u4e86",
    actualPaid: "\u5b9f\u652f\u6255\u984d (JPY)",
    usePoints: "\u5229\u7528\u30dd\u30a4\u30f3\u30c8",
    note: "\u30e1\u30e2",
    notePlaceholder: "\u4f1a\u8a08\u5185\u5bb9\u3001\u5e97\u5185\u30e1\u30e2\u3001\u88dc\u8db3\u4e8b\u9805\u3092\u8a18\u9332",
    saveComplete: "\u5b8c\u4e86\u5185\u5bb9\u3092\u4fdd\u5b58",
    close: "\u9589\u3058\u308b",
    invalidComplete: "\u5b9f\u652f\u6255\u984d\u3068\u5229\u7528\u30dd\u30a4\u30f3\u30c8\u306f 0 \u4ee5\u4e0a\u306e\u6709\u52b9\u306a\u6570\u5024\u3092\u5165\u529b\u3057\u3066\u304f\u3060\u3055\u3044\u3002",
    addons: "\u8ffd\u52a0\u9805\u76ee",
    filtersTitle: "\u7d5e\u308a\u8fbc\u307f",
    overviewTitle: "\u4e88\u7d04\u30b5\u30de\u30ea\u30fc",
    noAddons: "\u306a\u3057",
    visibleCount: "\u8868\u793a\u4ef6\u6570",
    quickActions: "\u307e\u305a\u672a\u78ba\u8a8d\u4e88\u7d04\u3092\u51e6\u7406\u3057\u3001\u305d\u306e\u5f8c\u306b\u5f53\u65e5\u306e\u78ba\u5b9a\u30fb\u5b8c\u4e86\u72b6\u6cc1\u3092\u78ba\u8a8d\u3059\u308b\u60f3\u5b9a\u3067\u3059\u3002",
    pendingHint: "\u65b0\u898f\u4e88\u7d04\u304c\u5165\u308a\u3001\u5e97\u9577\u78ba\u8a8d\u5f85\u3061\u3067\u3059\u3002",
    confirmedHint: "\u78ba\u5b9a\u6e08\u307f\u3067\u3001\u4e88\u7d04\u6642\u9593\u3092\u78ba\u4fdd\u3057\u3066\u3044\u307e\u3059\u3002",
    completedHint: "\u65bd\u8853\u5b8c\u4e86\u6e08\u307f\u3067\u3001\u30dd\u30a4\u30f3\u30c8\u8a08\u7b97\u5bfe\u8c61\u3067\u3059\u3002",
    canceledHint: "\u30ad\u30e3\u30f3\u30bb\u30eb\u6e08\u307f\u3067\u3001\u67a0\u306f\u89e3\u653e\u6e08\u307f\u3067\u3059\u3002",
    allHint: "\u73fe\u5728\u306e\u6761\u4ef6\u3067\u53d6\u5f97\u3057\u305f\u4e88\u7d04\u3092\u3059\u3079\u3066\u8868\u793a\u3057\u307e\u3059\u3002",
    openLineConversation: "LINE \u4f1a\u8a71\u3092\u958b\u304f"
  }
} as const;

const STATUS_VALUES = ["all", "pending", "confirmed", "completed", "canceled"] as const;

function createEmptyDraft(): CompleteDraft {
  return {
    actualPaidJpy: "0",
    usePoints: "0",
    note: ""
  };
}

function statusLabel(lang: Lang, status: AppointmentItem["status"]) {
  const t = TEXT[lang];
  if (status === "pending") return t.pending;
  if (status === "confirmed") return t.confirmed;
  if (status === "completed") return t.completed;
  return t.canceled;
}

function statusClass(status: AppointmentItem["status"]) {
  if (status === "pending") return "bg-amber-50 text-amber-700 border-amber-200";
  if (status === "confirmed") return "bg-sky-50 text-sky-700 border-sky-200";
  if (status === "completed") return "bg-emerald-50 text-emerald-700 border-emerald-200";
  return "bg-slate-100 text-slate-700 border-slate-200";
}

function sourceChannelLabel(lang: Lang, sourceChannel: AppointmentItem["sourceChannel"]) {
  if (lang === "ja") {
    if (sourceChannel === "line_showcase") return "LINE \u30ae\u30e3\u30e9\u30ea\u30fc";
    if (sourceChannel === "admin_manual") return "\u7ba1\u7406\u753b\u9762\u624b\u52d5";
    return "\u65e7 Web";
  }

  if (sourceChannel === "line_showcase") return "LINE \u56fe\u5899";
  if (sourceChannel === "admin_manual") return "\u540e\u53f0\u624b\u52a8";
  return "\u65e7\u7f51\u9875";
}

export default function AdminAppointmentsPanel({ lang }: Props) {
  const t = TEXT[lang];
  const locale = lang === "ja" ? "ja-JP" : "zh-CN";

  const [date, setDate] = useState("");
  const [status, setStatus] = useState<(typeof STATUS_VALUES)[number]>("all");
  const [sourceChannel, setSourceChannel] = useState<SourceFilter>("all");
  const [showcaseItemId, setShowcaseItemId] = useState("all");
  const [keyword, setKeyword] = useState("");
  const [items, setItems] = useState<AppointmentItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [openCompleteId, setOpenCompleteId] = useState<string | null>(null);
  const [completeDraft, setCompleteDraft] = useState<CompleteDraft>(createEmptyDraft());

  useEffect(() => {
    if (sourceChannel !== "line_showcase" && showcaseItemId !== "all") {
      setShowcaseItemId("all");
    }
  }, [showcaseItemId, sourceChannel]);

  const queryString = useMemo(() => {
    const qs = new URLSearchParams({ lang, limit: "200" });
    if (date) qs.set("date", date);
    if (sourceChannel !== "all") qs.set("sourceChannel", sourceChannel);
    if (showcaseItemId !== "all") qs.set("showcaseItemId", showcaseItemId);
    return qs.toString();
  }, [date, lang, showcaseItemId, sourceChannel]);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/appointments?" + queryString);
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || t.loadFailed);
      }
      setItems(data.items ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : t.loadFailed);
    } finally {
      setLoading(false);
    }
  }, [queryString, t.loadFailed]);

  useEffect(() => {
    void fetchItems();
  }, [fetchItems]);

  const keywordFilteredItems = useMemo(() => {
    const q = keyword.trim().toLowerCase();
    if (!q) return items;
    return items.filter((item) => {
      const haystack = [
        item.bookingNo,
        item.customer.name,
        item.customer.email ?? "",
        item.customer.lineUser?.displayName ?? "",
        item.customer.lineUser?.lineUserId ?? "",
        item.package.name,
        item.showcaseItem?.title ?? "",
        ...item.addons.map((addon) => addon.name)
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [items, keyword]);

  const filteredItems = useMemo(() => {
    if (status === "all") return keywordFilteredItems;
    return keywordFilteredItems.filter((item) => item.status === status);
  }, [keywordFilteredItems, status]);

  const statusCounts = useMemo(() => {
    return keywordFilteredItems.reduce(
      (acc, item) => {
        acc[item.status] += 1;
        return acc;
      },
      { pending: 0, confirmed: 0, completed: 0, canceled: 0 }
    );
  }, [keywordFilteredItems]);

  const showcaseOptions = useMemo(() => {
    const map = new Map<string, string>();
    for (const item of items) {
      if (item.showcaseItem) {
        map.set(item.showcaseItem.id, item.showcaseItem.title);
      }
    }
    return [...map.entries()]
      .map(([id, title]) => ({ id, title }))
      .sort((a, b) => a.title.localeCompare(b.title, locale));
  }, [items, locale]);

  const overviewCards = [
    { key: "all", label: t.all, value: keywordFilteredItems.length, hint: t.allHint, tone: "from-brand-100 via-white to-white" },
    { key: "pending", label: t.pending, value: statusCounts.pending, hint: t.pendingHint, tone: "from-amber-100 via-white to-white" },
    { key: "confirmed", label: t.confirmed, value: statusCounts.confirmed, hint: t.confirmedHint, tone: "from-sky-100 via-white to-white" },
    { key: "completed", label: t.completed, value: statusCounts.completed, hint: t.completedHint, tone: "from-emerald-100 via-white to-white" },
    { key: "canceled", label: t.canceled, value: statusCounts.canceled, hint: t.canceledHint, tone: "from-slate-100 via-white to-white" }
  ] as const;

  async function doPatch(path: string, body?: unknown) {
    setError("");
    try {
      const res = await fetch(path, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: body === undefined ? undefined : JSON.stringify(body)
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || t.actionFailed);
      }
      await fetchItems();
    } catch (err) {
      setError(err instanceof Error ? err.message : t.actionFailed);
    }
  }

  function openComplete(item: AppointmentItem) {
    setOpenCompleteId(item.id);
    setCompleteDraft(createEmptyDraft());
  }

  function closeComplete() {
    setOpenCompleteId(null);
    setCompleteDraft(createEmptyDraft());
  }

  async function submitComplete(itemId: string) {
    const actualPaidJpy = Number.parseInt(completeDraft.actualPaidJpy, 10);
    const usePoints = Number.parseInt(completeDraft.usePoints, 10);

    if (!Number.isFinite(actualPaidJpy) || actualPaidJpy < 0 || !Number.isFinite(usePoints) || usePoints < 0) {
      setError(t.invalidComplete);
      return;
    }

    await doPatch("/api/admin/appointments/" + itemId + "/complete", {
      actualPaidJpy,
      usePoints,
      note: completeDraft.note.trim() || "Completed from admin page"
    });

    closeComplete();
  }

  function resetFilters() {
    setDate("");
    setStatus("all");
    setSourceChannel("all");
    setShowcaseItemId("all");
    setKeyword("");
  }

  return (
    <section className="admin-panel-shell">
      <div className="mb-5 flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <h2 className="admin-section-title">{t.title}</h2>
          <p className="admin-note mt-2 max-w-3xl">{t.subtitle}</p>
        </div>
        <div className="rounded-2xl border border-brand-100 bg-brand-50/60 px-4 py-3 text-sm text-brand-800">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-500">{t.visibleCount}</p>
          <strong className="mt-1 block text-2xl text-brand-900">{filteredItems.length}</strong>
          <span>{t.countSuffix}</span>
        </div>
      </div>

      <div className="grid gap-3 lg:grid-cols-[1.15fr_0.85fr]">
        <section className="rounded-[1.6rem] border border-brand-100 bg-[linear-gradient(145deg,rgba(255,248,243,0.95),rgba(255,255,255,0.82))] p-4 shadow-[0_14px_34px_rgba(120,25,55,0.06)]">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-500">{t.overviewTitle}</p>
              <p className="mt-1 text-sm text-brand-700">{t.quickActions}</p>
            </div>
            <button type="button" className="admin-btn-secondary" onClick={() => void fetchItems()}>
              {t.refresh}
            </button>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
            {overviewCards.map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() => setStatus(item.key as (typeof STATUS_VALUES)[number])}
                className={"rounded-[1.25rem] border border-brand-100 bg-gradient-to-br " + item.tone + " p-4 text-left shadow-sm transition-transform duration-200 hover:-translate-y-0.5 " + (status === item.key ? "ring-2 ring-brand-300" : "")}
              >
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-500">{item.label}</p>
                <strong className="mt-3 block text-3xl font-semibold text-brand-900">{item.value}</strong>
                <p className="mt-2 text-xs leading-6 text-brand-700">{item.hint}</p>
              </button>
            ))}
          </div>
        </section>

        <section className="rounded-[1.6rem] border border-brand-100 bg-white/85 p-4 shadow-[0_14px_34px_rgba(120,25,55,0.06)]">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-500">{t.filtersTitle}</p>
          <div className="mt-4 grid gap-3">
            <label className="grid gap-1 text-sm text-brand-800">
              <span>{t.date}</span>
              <input type="date" value={date} onChange={(event) => setDate(event.target.value)} className="admin-input" />
            </label>
            <label className="grid gap-1 text-sm text-brand-800">
              <span>{t.status}</span>
              <select value={status} onChange={(event) => setStatus(event.target.value as (typeof STATUS_VALUES)[number])} className="admin-input">
                <option value="all">{t.all}</option>
                <option value="pending">{t.pending}</option>
                <option value="confirmed">{t.confirmed}</option>
                <option value="completed">{t.completed}</option>
                <option value="canceled">{t.canceled}</option>
              </select>
            </label>
            <label className="grid gap-1 text-sm text-brand-800">
              <span>{t.source}</span>
              <select value={sourceChannel} onChange={(event) => setSourceChannel(event.target.value as SourceFilter)} className="admin-input">
                <option value="all">{t.allSources}</option>
                <option value="line_showcase">{sourceChannelLabel(lang, "line_showcase")}</option>
                <option value="admin_manual">{sourceChannelLabel(lang, "admin_manual")}</option>
                <option value="legacy_web">{sourceChannelLabel(lang, "legacy_web")}</option>
              </select>
            </label>
            <label className="grid gap-1 text-sm text-brand-800">
              <span>{t.showcase}</span>
              <select value={showcaseItemId} onChange={(event) => setShowcaseItemId(event.target.value)} className="admin-input" disabled={sourceChannel !== "line_showcase"}>
                <option value="all">{t.allShowcase}</option>
                {showcaseOptions.map((item) => (
                  <option key={item.id} value={item.id}>{item.title}</option>
                ))}
              </select>
            </label>
            <label className="grid gap-1 text-sm text-brand-800">
              <span>{t.keyword}</span>
              <input className="admin-input" value={keyword} onChange={(event) => setKeyword(event.target.value)} placeholder={t.keywordPlaceholder} />
            </label>
            <div className="flex flex-wrap gap-2 pt-1">
              <button type="button" className="admin-btn-secondary" onClick={resetFilters}>{t.reset}</button>
              <button type="button" className="admin-btn-primary" onClick={() => void fetchItems()}>{t.refresh}</button>
            </div>
          </div>
        </section>
      </div>

      {error ? <p className="admin-danger" aria-live="assertive">{error}</p> : null}
      {loading ? <p className="ui-state-info" aria-live="polite">{t.loading}</p> : null}

      <div className="mt-5 grid gap-3">
        {filteredItems.length === 0 && !loading ? <p className="ui-state-info">{t.empty}</p> : null}

        {filteredItems.map((item) => (
          <article key={item.id} className="rounded-[1.6rem] border border-brand-100 bg-white/92 p-4 shadow-[0_12px_28px_rgba(120,25,55,0.05)]">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
              <div className="grid flex-1 gap-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-semibold tracking-[0.12em] text-brand-900">#{item.bookingNo}</span>
                  <span className={"rounded-full border px-2.5 py-1 text-xs font-semibold " + statusClass(item.status)}>
                    {statusLabel(lang, item.status)}
                  </span>
                </div>

                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                  <div className="rounded-2xl border border-brand-100 bg-brand-50/45 p-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-500">{t.customer}</p>
                    <p className="mt-2 text-sm font-semibold text-brand-900">{item.customer.name}</p>
                    <p className="text-sm text-brand-700">{item.customer.email || "-"}</p>
                    <p className="text-xs text-brand-600">{lang === "ja" ? "LINE \u9867\u5ba2" : "LINE \u5ba2\u6237"}: {item.customer.lineUser?.displayName || item.customer.lineUser?.lineUserId || "-"}</p>
                    {item.customer.lineUser ? (
                      <div className="pt-2">
                        <Link className="admin-btn-secondary inline-flex" href={"/admin/line?lang=" + lang + "&userId=" + item.customer.lineUser.id}>
                          {t.openLineConversation}
                        </Link>
                      </div>
                    ) : null}
                  </div>
                  <div className="rounded-2xl border border-brand-100 bg-brand-50/45 p-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-500">{t.time}</p>
                    <p className="mt-2 text-sm font-semibold text-brand-900">
                      {new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short" }).format(new Date(item.startAt))}
                    </p>
                    <p className="text-sm text-brand-700">
                      {new Intl.DateTimeFormat(locale, { hour: "2-digit", minute: "2-digit" }).format(new Date(item.endAt))}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-brand-100 bg-brand-50/45 p-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-500">{t.service}</p>
                    <p className="mt-2 text-sm font-semibold text-brand-900">{item.package.name}</p>
                    <p className="text-xs text-brand-600">{lang === "ja" ? "\u30ae\u30e3\u30e9\u30ea\u30fc\u9805\u76ee" : "\u56fe\u5899\u6b3e\u5f0f"}: {item.showcaseItem?.title || t.noShowcase}</p>
                    <p className="text-xs text-brand-600">{lang === "ja" ? "\u4e88\u7d04\u5165\u53e3" : "\u9884\u7ea6\u5165\u53e3"}: {sourceChannelLabel(lang, item.sourceChannel)}</p>
                  </div>
                  <div className="rounded-2xl border border-brand-100 bg-brand-50/45 p-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-500">{t.addons}</p>
                    <p className="mt-2 text-sm text-brand-800">{item.addons.length ? item.addons.map((addon) => addon.name).join(", ") : t.noAddons}</p>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 xl:max-w-[15rem] xl:justify-end">
                {item.status === "pending" ? (
                  <button type="button" className="admin-btn-primary min-h-10 px-3 py-2" onClick={() => void doPatch("/api/admin/appointments/" + item.id + "/confirm")}>
                    {t.confirm}
                  </button>
                ) : null}

                {(item.status === "pending" || item.status === "confirmed") ? (
                  <button
                    type="button"
                    className="admin-btn-ghost px-3 py-2"
                    onClick={() => {
                      if (!window.confirm(t.confirmCancel)) return;
                      void doPatch("/api/admin/appointments/" + item.id + "/cancel", {
                        reason: "Canceled by admin page"
                      });
                    }}
                  >
                    {t.cancel}
                  </button>
                ) : null}

                {item.status === "confirmed" ? (
                  <button type="button" className="admin-btn-primary min-h-10 bg-brand-800 px-3 py-2 hover:bg-brand-900" onClick={() => openComplete(item)}>
                    {t.complete}
                  </button>
                ) : null}
              </div>
            </div>

            {openCompleteId === item.id ? (
              <div className="admin-subsection mt-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-medium text-brand-900">{t.completeTitle}</p>
                  <button type="button" className="admin-btn-ghost" onClick={closeComplete}>
                    {t.close}
                  </button>
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  <label className="grid gap-1 text-sm text-brand-800">
                    <span>{t.actualPaid}</span>
                    <input className="admin-input-sm" inputMode="numeric" value={completeDraft.actualPaidJpy} onChange={(event) => setCompleteDraft((prev) => ({ ...prev, actualPaidJpy: event.target.value }))} />
                  </label>

                  <label className="grid gap-1 text-sm text-brand-800">
                    <span>{t.usePoints}</span>
                    <input className="admin-input-sm" inputMode="numeric" value={completeDraft.usePoints} onChange={(event) => setCompleteDraft((prev) => ({ ...prev, usePoints: event.target.value }))} />
                  </label>
                </div>

                <label className="grid gap-1 text-sm text-brand-800">
                  <span>{t.note}</span>
                  <textarea className="admin-input min-h-24" value={completeDraft.note} onChange={(event) => setCompleteDraft((prev) => ({ ...prev, note: event.target.value }))} placeholder={t.notePlaceholder} />
                </label>

                <div className="flex flex-wrap gap-2">
                  <button type="button" className="admin-btn-primary" onClick={() => void submitComplete(item.id)}>
                    {t.saveComplete}
                  </button>
                  <button type="button" className="admin-btn-ghost" onClick={closeComplete}>
                    {t.close}
                  </button>
                </div>
              </div>
            ) : null}
          </article>
        ))}
      </div>
    </section>
  );
}
