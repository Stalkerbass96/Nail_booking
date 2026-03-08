"use client";

import { useEffect, useState } from "react";
import type { Lang } from "@/lib/lang";

type CustomerItem = {
  id: string;
  name: string;
  email: string | null;
  totalSpentJpy: number;
  currentPoints: number;
  appointmentCount: number;
  customerType: "lead" | "active";
  createdFrom: "line" | "admin" | "legacy_web";
  firstBookedAt: string | null;
  lineUser: {
    lineUserId: string;
    displayName: string | null;
    isFollowing: boolean;
    lastSeenAt: string | null;
  } | null;
};

type CustomerDetail = {
  id: string;
  name: string;
  email: string | null;
  notes: string | null;
  totalSpentJpy: number;
  currentPoints: number;
  customerType: "lead" | "active";
  createdFrom: "line" | "admin" | "legacy_web";
  firstBookedAt: string | null;
  lineUser: {
    id: string;
    lineUserId: string;
    displayName: string | null;
    isFollowing: boolean;
    linkedAt: string | null;
    lastSeenAt: string | null;
    createdAt: string;
  } | null;
  appointments: Array<{
    id: string;
    bookingNo: string;
    status: string;
    startAt: string;
    sourceChannel: "line_showcase" | "admin_manual" | "legacy_web";
    package: {
      id: string;
      nameZh: string;
      nameJa: string;
    };
    showcaseItem: {
      id: string;
      titleZh: string;
      titleJa: string;
    } | null;
  }>;
};

type PointItem = {
  id: string;
  type: string;
  points: number;
  jpyValue: number;
  note?: string | null;
  createdAt: string;
};

type EditDraft = {
  name: string;
  email: string;
  notes: string;
};

type Props = {
  lang: Lang;
};

const TEXT = {
  zh: {
    title: "\u5ba2\u6237\u4e0e LINE \u6863\u6848",
    placeholder: "\u59d3\u540d\u3001LINE \u6635\u79f0\u3001LINE ID \u6216\u90ae\u7bb1",
    search: "\u67e5\u8be2",
    searchFailed: "\u67e5\u8be2\u5931\u8d25",
    detailFailed: "\u52a0\u8f7d\u5ba2\u6237\u8be6\u60c5\u5931\u8d25",
    pointsFailed: "\u52a0\u8f7d\u79ef\u5206\u5931\u8d25",
    loadFailed: "\u52a0\u8f7d\u5931\u8d25",
    saveFailed: "\u4fdd\u5b58\u5ba2\u6237\u4fe1\u606f\u5931\u8d25",
    saveSuccess: "\u5ba2\u6237\u4fe1\u606f\u5df2\u66f4\u65b0",
    invalidName: "\u5ba2\u6237\u59d3\u540d\u4e0d\u80fd\u4e3a\u7a7a",
    summary: "\u9884\u7ea6",
    spent: "\u6d88\u8d39",
    points: "\u79ef\u5206",
    selectHint: "\u9009\u62e9\u5de6\u4fa7\u5ba2\u6237\u67e5\u770b LINE \u6863\u6848\u4e0e\u9884\u7ea6\u5386\u53f2",
    currentPoints: "\u5f53\u524d\u79ef\u5206",
    recentAppointments: "\u6700\u8fd1\u9884\u7ea6",
    pointLedger: "\u79ef\u5206\u6d41\u6c34",
    loading: "\u52a0\u8f7d\u4e2d...",
    saving: "\u4fdd\u5b58\u4e2d...",
    empty: "\u6682\u65e0\u5ba2\u6237\u8bb0\u5f55",
    noAppointments: "\u6682\u65e0\u9884\u7ea6\u8bb0\u5f55",
    noPoints: "\u6682\u65e0\u79ef\u5206\u6d41\u6c34",
    lead: "\u6f5c\u5728\u5ba2\u6237",
    active: "\u6b63\u5f0f\u5ba2\u6237",
    source: "\u521b\u5efa\u6765\u6e90",
    sourceLine: "LINE \u52a0\u597d\u53cb",
    sourceAdmin: "\u540e\u53f0\u521b\u5efa",
    sourceLegacy: "\u65e7\u7f51\u9875\u6d41\u7a0b",
    lineProfile: "LINE \u6863\u6848",
    lineId: "LINE ID",
    lineName: "LINE \u6635\u79f0",
    lineFollowing: "\u5df2\u5173\u6ce8",
    lineInactive: "\u5df2\u53d6\u6d88\u5173\u6ce8",
    lastSeen: "\u6700\u540e\u4ea4\u4e92",
    firstBookedAt: "\u9996\u6b21\u9884\u7ea6\u65f6\u95f4",
    email: "\u90ae\u7bb1",
    noEmail: "\u672a\u586b\u5199",
    packageLabel: "\u5957\u9910",
    showcaseLabel: "\u6765\u81ea\u56fe\u5899",
    directBooking: "\u975e\u56fe\u5899\u6d41\u7a0b",
    channelLine: "LINE \u56fe\u5899",
    channelAdmin: "\u540e\u53f0\u624b\u52a8",
    channelLegacy: "\u65e7\u7f51\u9875",
    connected: "\u5df2\u7ed1\u5b9a",
    disconnected: "\u672a\u7ed1\u5b9a",
    createdAt: "\u5efa\u6863\u65f6\u95f4",
    editTitle: "\u5ba2\u6237\u7ef4\u62a4",
    name: "\u59d3\u540d",
    notes: "\u5907\u6ce8",
    notesPlaceholder: "\u8bb0\u5f55\u5ba2\u6237\u504f\u597d\u3001\u6c9f\u901a\u91cd\u70b9\u6216\u5230\u5e97\u60c5\u51b5",
    save: "\u4fdd\u5b58\u5ba2\u6237\u4fe1\u606f"
  },
  ja: {
    title: "\u9867\u5ba2\u3068 LINE \u30d7\u30ed\u30d5\u30a3\u30fc\u30eb",
    placeholder: "\u540d\u524d\u3001LINE \u8868\u793a\u540d\u3001LINE ID \u307e\u305f\u306f\u30e1\u30fc\u30eb",
    search: "\u691c\u7d22",
    searchFailed: "\u691c\u7d22\u306b\u5931\u6557\u3057\u307e\u3057\u305f",
    detailFailed: "\u9867\u5ba2\u8a73\u7d30\u306e\u8aad\u307f\u8fbc\u307f\u306b\u5931\u6557\u3057\u307e\u3057\u305f",
    pointsFailed: "\u30dd\u30a4\u30f3\u30c8\u306e\u8aad\u307f\u8fbc\u307f\u306b\u5931\u6557\u3057\u307e\u3057\u305f",
    loadFailed: "\u8aad\u307f\u8fbc\u307f\u306b\u5931\u6557\u3057\u307e\u3057\u305f",
    saveFailed: "\u9867\u5ba2\u60c5\u5831\u306e\u4fdd\u5b58\u306b\u5931\u6557\u3057\u307e\u3057\u305f",
    saveSuccess: "\u9867\u5ba2\u60c5\u5831\u3092\u66f4\u65b0\u3057\u307e\u3057\u305f",
    invalidName: "\u9867\u5ba2\u540d\u306f\u5fc5\u9808\u3067\u3059",
    summary: "\u4e88\u7d04",
    spent: "\u5229\u7528\u984d",
    points: "\u30dd\u30a4\u30f3\u30c8",
    selectHint: "\u5de6\u5074\u3067\u9867\u5ba2\u3092\u9078\u3076\u3068 LINE \u60c5\u5831\u3068\u4e88\u7d04\u5c65\u6b74\u3092\u78ba\u8a8d\u3067\u304d\u307e\u3059",
    currentPoints: "\u73fe\u5728\u30dd\u30a4\u30f3\u30c8",
    recentAppointments: "\u6700\u8fd1\u306e\u4e88\u7d04",
    pointLedger: "\u30dd\u30a4\u30f3\u30c8\u5c65\u6b74",
    loading: "\u8aad\u307f\u8fbc\u307f\u4e2d...",
    saving: "\u4fdd\u5b58\u4e2d...",
    empty: "\u9867\u5ba2\u30c7\u30fc\u30bf\u304c\u3042\u308a\u307e\u305b\u3093",
    noAppointments: "\u4e88\u7d04\u5c65\u6b74\u306f\u3042\u308a\u307e\u305b\u3093",
    noPoints: "\u30dd\u30a4\u30f3\u30c8\u5c65\u6b74\u306f\u3042\u308a\u307e\u305b\u3093",
    lead: "\u898b\u8fbc\u307f\u9867\u5ba2",
    active: "\u6765\u5e97\u4e88\u5b9a\u30fb\u65e2\u5b58\u9867\u5ba2",
    source: "\u4f5c\u6210\u5143",
    sourceLine: "LINE \u53cb\u3060\u3061\u8ffd\u52a0",
    sourceAdmin: "\u7ba1\u7406\u753b\u9762\u4f5c\u6210",
    sourceLegacy: "\u65e7 Web \u4e88\u7d04",
    lineProfile: "LINE \u30d7\u30ed\u30d5\u30a3\u30fc\u30eb",
    lineId: "LINE ID",
    lineName: "LINE \u8868\u793a\u540d",
    lineFollowing: "\u53cb\u3060\u3061\u8ffd\u52a0\u4e2d",
    lineInactive: "\u53cb\u3060\u3061\u89e3\u9664\u6e08\u307f",
    lastSeen: "\u6700\u5f8c\u30a2\u30af\u30c6\u30a3\u30d6",
    firstBookedAt: "\u521d\u56de\u4e88\u7d04\u65e5\u6642",
    email: "\u30e1\u30fc\u30eb",
    noEmail: "\u672a\u767b\u9332",
    packageLabel: "\u30d1\u30c3\u30b1\u30fc\u30b8",
    showcaseLabel: "\u30ae\u30e3\u30e9\u30ea\u30fc\u7531\u6765",
    directBooking: "\u30ae\u30e3\u30e9\u30ea\u30fc\u7d4c\u7531\u3067\u306f\u306a\u3044",
    channelLine: "LINE \u30ae\u30e3\u30e9\u30ea\u30fc",
    channelAdmin: "\u7ba1\u7406\u753b\u9762\u624b\u52d5",
    channelLegacy: "\u65e7 Web \u7d4c\u7531",
    connected: "\u9023\u643a\u6e08\u307f",
    disconnected: "\u672a\u9023\u643a",
    createdAt: "\u4f5c\u6210\u65e5\u6642",
    editTitle: "\u9867\u5ba2\u30e1\u30f3\u30c6\u30ca\u30f3\u30b9",
    name: "\u540d\u524d",
    notes: "\u30e1\u30e2",
    notesPlaceholder: "\u597d\u307f\u3001\u30d2\u30a2\u30ea\u30f3\u30b0\u5185\u5bb9\u3001\u6765\u5e97\u6642\u306e\u88dc\u8db3\u3092\u8a18\u9332",
    save: "\u9867\u5ba2\u60c5\u5831\u3092\u4fdd\u5b58"
  }
} as const;

function customerTypeLabel(lang: Lang, customerType: CustomerItem["customerType"]) {
  const t = TEXT[lang];
  return customerType === "active" ? t.active : t.lead;
}

function createdFromLabel(lang: Lang, createdFrom: CustomerItem["createdFrom"]) {
  const t = TEXT[lang];
  if (createdFrom === "line") return t.sourceLine;
  if (createdFrom === "admin") return t.sourceAdmin;
  return t.sourceLegacy;
}

function sourceChannelLabel(lang: Lang, sourceChannel: CustomerDetail["appointments"][number]["sourceChannel"]) {
  const t = TEXT[lang];
  if (sourceChannel === "line_showcase") return t.channelLine;
  if (sourceChannel === "admin_manual") return t.channelAdmin;
  return t.channelLegacy;
}

function createDraft(detail: CustomerDetail | null): EditDraft {
  return {
    name: detail?.name || "",
    email: detail?.email || "",
    notes: detail?.notes || ""
  };
}

export default function AdminCustomersPanel({ lang }: Props) {
  const t = TEXT[lang];
  const locale = lang === "ja" ? "ja-JP" : "zh-CN";

  const [q, setQ] = useState("");
  const [items, setItems] = useState<CustomerItem[]>([]);
  const [detail, setDetail] = useState<CustomerDetail | null>(null);
  const [points, setPoints] = useState<PointItem[]>([]);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeCustomerId, setActiveCustomerId] = useState("");
  const [draft, setDraft] = useState<EditDraft>(createDraft(null));

  useEffect(() => {
    setDraft(createDraft(detail));
  }, [detail]);

  async function search() {
    setError("");
    setNotice("");
    setLoading(true);
    try {
      const qs = new URLSearchParams({ q, limit: "100" });
      const res = await fetch("/api/admin/customers?" + qs.toString());
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || t.searchFailed);
      setItems(data.items ?? []);
      setDetail(null);
      setPoints([]);
      setActiveCustomerId("");
    } catch (err) {
      setError(err instanceof Error ? err.message : t.searchFailed);
    } finally {
      setLoading(false);
    }
  }

  async function openCustomer(customerId: string) {
    setError("");
    setNotice("");
    setLoading(true);
    try {
      const [detailRes, pointsRes] = await Promise.all([
        fetch("/api/admin/customers/" + customerId),
        fetch("/api/admin/customers/" + customerId + "/points")
      ]);
      const [detailData, pointsData] = await Promise.all([detailRes.json(), pointsRes.json()]);
      if (!detailRes.ok) throw new Error(detailData?.error || t.detailFailed);
      if (!pointsRes.ok) throw new Error(pointsData?.error || t.pointsFailed);

      setDetail(detailData);
      setPoints(pointsData.items ?? []);
      setActiveCustomerId(customerId);
    } catch (err) {
      setError(err instanceof Error ? err.message : t.loadFailed);
    } finally {
      setLoading(false);
    }
  }

  async function saveCustomer() {
    if (!detail) return;
    if (!draft.name.trim()) {
      setError(t.invalidName);
      return;
    }

    setError("");
    setNotice("");
    setSaving(true);
    try {
      const res = await fetch("/api/admin/customers/" + detail.id, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: draft.name,
          email: draft.email,
          notes: draft.notes
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || t.saveFailed);

      setDetail((prev) => prev
        ? {
            ...prev,
            name: data.name,
            email: data.email,
            notes: data.notes,
            updatedAt: data.updatedAt
          }
        : prev);
      setItems((prev) => prev.map((item) => item.id === detail.id ? { ...item, name: data.name, email: data.email } : item));
      setNotice(t.saveSuccess);
    } catch (err) {
      setError(err instanceof Error ? err.message : t.saveFailed);
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="admin-panel-shell">
      <h2 className="admin-section-title">{t.title}</h2>

      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
        <label htmlFor="customer-search-input" className="sr-only">{t.placeholder}</label>
        <input id="customer-search-input" className="admin-input w-full" placeholder={t.placeholder} value={q} onChange={(e) => setQ(e.target.value)} />
        <button className="admin-btn-primary w-full sm:w-auto" onClick={() => void search()} type="button">
          {t.search}
        </button>
      </div>

      {error ? <p className="admin-danger" aria-live="assertive">{error}</p> : null}
      {notice ? <p className="admin-success" aria-live="polite">{notice}</p> : null}
      {loading ? <p className="ui-state-info" aria-live="polite">{t.loading}</p> : null}
      {saving ? <p className="ui-state-info" aria-live="polite">{t.saving}</p> : null}

      <div className="mt-4 grid gap-3 md:grid-cols-[0.92fr_1.08fr]">
        <div className="grid gap-2">
          {!loading && items.length === 0 ? <p className="ui-state-info">{t.empty}</p> : null}
          {items.map((item) => (
            <button
              key={item.id}
              className={"admin-item text-left transition duration-200 hover:-translate-y-0.5 hover:shadow-md " + (activeCustomerId === item.id ? "border-brand-300 bg-brand-50/60" : "")}
              onClick={() => void openCustomer(item.id)}
              type="button"
            >
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-medium text-brand-900">{item.name}</p>
                <span className={"rounded-full px-2 py-0.5 text-xs font-semibold " + (item.customerType === "active" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700")}>
                  {customerTypeLabel(lang, item.customerType)}
                </span>
                <span className={"rounded-full px-2 py-0.5 text-xs font-semibold " + (item.lineUser ? "bg-sky-100 text-sky-700" : "bg-slate-100 text-slate-600")}>
                  {item.lineUser ? t.connected : t.disconnected}
                </span>
              </div>
              <p className="mt-1 text-sm text-brand-700">{item.lineUser?.displayName || item.lineUser?.lineUserId || item.email || t.noEmail}</p>
              <p className="text-xs text-brand-700">
                {t.summary} {item.appointmentCount} ? {t.spent} {item.totalSpentJpy} JPY ? {t.points} {item.currentPoints}
              </p>
              <p className="mt-1 text-xs text-brand-500">{t.source}: {createdFromLabel(lang, item.createdFrom)}</p>
            </button>
          ))}
        </div>

        <div className="rounded-2xl border border-brand-100/90 bg-white p-4">
          {!detail ? <p className="ui-state-info mt-0">{t.selectHint}</p> : (
            <div className="grid gap-4">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-lg font-semibold text-brand-900">{detail.name}</p>
                  <span className={"rounded-full px-2 py-0.5 text-xs font-semibold " + (detail.customerType === "active" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700")}>
                    {customerTypeLabel(lang, detail.customerType)}
                  </span>
                </div>
                <p className="mt-1 text-sm text-brand-700">{t.email}: {detail.email || t.noEmail}</p>
                <p className="text-sm text-brand-700">{t.source}: {createdFromLabel(lang, detail.createdFrom)}</p>
                <p className="text-sm text-brand-700">{t.spent} {detail.totalSpentJpy} JPY ? {t.currentPoints} {detail.currentPoints}</p>
                <p className="text-sm text-brand-700">{t.firstBookedAt}: {detail.firstBookedAt ? new Date(detail.firstBookedAt).toLocaleString(locale) : "-"}</p>
              </div>

              <div className="rounded-2xl border border-brand-100 bg-brand-50/45 p-3">
                <p className="font-medium text-brand-900">{t.lineProfile}</p>
                {detail.lineUser ? (
                  <div className="mt-2 grid gap-1 text-sm text-brand-700">
                    <p>{t.lineId}: {detail.lineUser.lineUserId}</p>
                    <p>{t.lineName}: {detail.lineUser.displayName || detail.name}</p>
                    <p>{detail.lineUser.isFollowing ? t.lineFollowing : t.lineInactive}</p>
                    <p>{t.createdAt}: {new Date(detail.lineUser.createdAt).toLocaleString(locale)}</p>
                    <p>{t.lastSeen}: {detail.lineUser.lastSeenAt ? new Date(detail.lineUser.lastSeenAt).toLocaleString(locale) : "-"}</p>
                  </div>
                ) : <p className="mt-2 text-sm text-brand-700">{t.disconnected}</p>}
              </div>

              <div className="rounded-2xl border border-brand-100 bg-white p-3">
                <p className="font-medium text-brand-900">{t.editTitle}</p>
                <div className="mt-3 grid gap-3">
                  <label className="grid gap-1 text-sm text-brand-800">
                    <span>{t.name}</span>
                    <input className="admin-input-sm" value={draft.name} onChange={(event) => setDraft((prev) => ({ ...prev, name: event.target.value }))} />
                  </label>
                  <label className="grid gap-1 text-sm text-brand-800">
                    <span>{t.email}</span>
                    <input className="admin-input-sm" value={draft.email} onChange={(event) => setDraft((prev) => ({ ...prev, email: event.target.value }))} />
                  </label>
                  <label className="grid gap-1 text-sm text-brand-800">
                    <span>{t.notes}</span>
                    <textarea className="admin-input min-h-24" value={draft.notes} onChange={(event) => setDraft((prev) => ({ ...prev, notes: event.target.value }))} placeholder={t.notesPlaceholder} />
                  </label>
                  <button type="button" className="admin-btn-primary w-full sm:w-auto" onClick={() => void saveCustomer()}>
                    {t.save}
                  </button>
                </div>
              </div>

              <div>
                <p className="font-medium text-brand-900">{t.recentAppointments}</p>
                <div className="mt-2 grid gap-2 text-sm text-brand-700">
                  {detail.appointments.slice(0, 8).map((appt) => (
                    <div key={appt.id} className="rounded-2xl border border-brand-100 bg-white px-3 py-2">
                      <p className="font-medium text-brand-900">#{appt.bookingNo}</p>
                      <p>{sourceChannelLabel(lang, appt.sourceChannel)}</p>
                      <p>{t.packageLabel}: {lang === "ja" ? appt.package.nameJa : appt.package.nameZh}</p>
                      <p>{t.showcaseLabel}: {appt.showcaseItem ? (lang === "ja" ? appt.showcaseItem.titleJa : appt.showcaseItem.titleZh) : t.directBooking}</p>
                      <p>{new Date(appt.startAt).toLocaleString(locale)}</p>
                    </div>
                  ))}
                  {detail.appointments.length === 0 ? <p>{t.noAppointments}</p> : null}
                </div>
              </div>

              <div>
                <p className="font-medium text-brand-900">{t.pointLedger}</p>
                <div className="mt-1 grid max-h-48 gap-1 overflow-auto text-sm text-brand-700">
                  {points.slice(0, 20).map((point) => (
                    <p key={point.id}>{point.type} ? {point.points}pt ? {point.jpyValue}JPY ? {new Date(point.createdAt).toLocaleString(locale)}</p>
                  ))}
                  {points.length === 0 ? <p>{t.noPoints}</p> : null}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
