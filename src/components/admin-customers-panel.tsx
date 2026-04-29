"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { Lang } from "@/lib/lang";

type CustomerItem = {
  id: string;
  name: string;
  email: string | null;
  totalSpentJpy: number;
  currentPoints: number;
  appointmentCount: number;
  pointLedgerCount: number;
  deletable: boolean;
  customerType: "lead" | "active";
  createdFrom: "line" | "admin" | "legacy_web";
  firstBookedAt: string | null;
  lineUser: {
    id: string;
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
    title: "客户与 LINE 档案",
    placeholder: "姓名、LINE 昵称、LINE ID 或邮箱",
    search: "查询",
    tabAll: "全部",
    tabLineFollowers: "LINE 关注者",
    syncFollowers: "同步 LINE 关注者",
    syncSuccess: "同步完成",
    syncFailed: "同步失败",
    cleanupLeads: "清理可删除潜在客户",
    cleanupHint: "只会删除没有预约和积分记录的潜在客户。",
    searchFailed: "查询失败",
    detailFailed: "加载客户详情失败",
    pointsFailed: "加载积分失败",
    loadFailed: "加载失败",
    saveFailed: "保存客户信息失败",
    saveSuccess: "客户信息已更新",
    cleanupFailed: "清理潜在客户失败",
    cleanupSuccess: "已清理可删除潜在客户",
    invalidName: "客户姓名不能为空",
    summary: "预约",
    spent: "消费",
    points: "积分",
    selectHint: "选择左侧客户查看 LINE 档案与预约历史",
    currentPoints: "当前积分",
    recentAppointments: "最近预约",
    pointLedger: "积分流水",
    loading: "加载中...",
    saving: "保存中...",
    empty: "暂无客户记录",
    noAppointments: "暂无预约记录",
    noPoints: "暂无积分流水",
    lead: "潜在客户",
    active: "正式客户",
    source: "创建来源",
    sourceLine: "LINE 加好友",
    sourceAdmin: "后台创建",
    sourceLegacy: "旧网页流程",
    lineProfile: "LINE 档案",
    lineId: "LINE ID",
    lineName: "LINE 昵称",
    lineFollowing: "已关注",
    lineInactive: "已取消关注",
    lastSeen: "最后互动",
    firstBookedAt: "首次预约时间",
    email: "邮箱",
    noEmail: "未填写",
    packageLabel: "套餐",
    showcaseLabel: "来自图墙",
    directBooking: "非图墙流程",
    channelLine: "LINE 图墙",
    channelAdmin: "后台手动",
    channelLegacy: "旧网页",
    connected: "已绑定",
    disconnected: "未绑定",
    createdAt: "建档时间",
    editTitle: "客户维护",
    name: "姓名",
    notes: "备注",
    notesPlaceholder: "记录客户偏好、沟通重点或到店情况",
    save: "保存客户信息",
    openLineConversation: "打开 LINE 会话",
    remove: "删除客户",
    deleteFailed: "删除客户失败",
    deleteSuccess: "客户已删除",
    deleteConfirm: "确定要删除这个客户档案吗？如果已有预约或积分记录，系统会拒绝删除。",
    cannotDeleteHistory: "该客户已有预约或积分历史，不能删除。",
    batchCount: "本次清理数量"
  },
  ja: {
    title: "顧客と LINE プロフィール",
    placeholder: "名前、LINE 表示名、LINE ID またはメール",
    search: "検索",
    tabAll: "すべて",
    tabLineFollowers: "LINE フォロワー",
    syncFollowers: "LINE フォロワーを同期",
    syncSuccess: "同期完了",
    syncFailed: "同期に失敗しました",
    cleanupLeads: "削除可能な見込み顧客を整理",
    cleanupHint: "予約履歴もポイント履歴もない見込み顧客だけを削除します。",
    searchFailed: "検索に失敗しました",
    detailFailed: "顧客詳細の読み込みに失敗しました",
    pointsFailed: "ポイントの読み込みに失敗しました",
    loadFailed: "読み込みに失敗しました",
    saveFailed: "顧客情報の保存に失敗しました",
    saveSuccess: "顧客情報を更新しました",
    cleanupFailed: "見込み顧客の整理に失敗しました",
    cleanupSuccess: "削除可能な見込み顧客を整理しました",
    invalidName: "顧客名は必須です",
    summary: "予約",
    spent: "利用額",
    points: "ポイント",
    selectHint: "左側で顧客を選ぶと LINE 情報と予約履歴を確認できます",
    currentPoints: "現在ポイント",
    recentAppointments: "最近の予約",
    pointLedger: "ポイント履歴",
    loading: "読み込み中...",
    saving: "保存中...",
    empty: "顧客データがありません",
    noAppointments: "予約履歴はありません",
    noPoints: "ポイント履歴はありません",
    lead: "見込み顧客",
    active: "既存顧客",
    source: "作成元",
    sourceLine: "LINE 友だち追加",
    sourceAdmin: "管理画面作成",
    sourceLegacy: "旧 Web 予約",
    lineProfile: "LINE プロフィール",
    lineId: "LINE ID",
    lineName: "LINE 表示名",
    lineFollowing: "友だち追加中",
    lineInactive: "友だち解除済み",
    lastSeen: "最終アクティブ",
    firstBookedAt: "初回予約日時",
    email: "メール",
    noEmail: "未登録",
    packageLabel: "パッケージ",
    showcaseLabel: "ギャラリー由来",
    directBooking: "ギャラリー経由ではない",
    channelLine: "LINE ギャラリー",
    channelAdmin: "管理画面手動",
    channelLegacy: "旧 Web 経由",
    connected: "連携済み",
    disconnected: "未連携",
    createdAt: "作成日時",
    editTitle: "顧客メンテナンス",
    name: "名前",
    notes: "メモ",
    notesPlaceholder: "好み、ヒアリング内容、来店時の補足を記録",
    save: "顧客情報を保存",
    openLineConversation: "LINE 会話を開く",
    remove: "顧客を削除",
    deleteFailed: "顧客の削除に失敗しました",
    deleteSuccess: "顧客を削除しました",
    deleteConfirm: "この顧客プロフィールを削除しますか？予約履歴またはポイント履歴がある場合は削除できません。",
    cannotDeleteHistory: "この顧客には予約またはポイント履歴があるため削除できません。",
    batchCount: "今回の整理件数"
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

function mapDeleteError(lang: Lang, fallback: string, message?: string) {
  const t = TEXT[lang];
  if (!message) return fallback;
  if (message.includes("appointment or points history")) return t.cannotDeleteHistory;
  return message;
}

export default function AdminCustomersPanel({ lang }: Props) {
  const t = TEXT[lang];
  const locale = lang === "ja" ? "ja-JP" : "zh-CN";

  const [q, setQ] = useState("");
  const [tab, setTab] = useState<"all" | "line_followers">("line_followers");
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

  useEffect(() => {
    if (tab === "line_followers") void loadLineFollowers();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  const cleanupCandidates = useMemo(
    () => items.filter((item) => item.customerType === "lead" && item.deletable).length,
    [items]
  );

  async function syncFollowers() {
    setError("");
    setNotice("");
    setSaving(true);
    try {
      const res = await fetch("/api/admin/line/sync-followers", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        const detail = data?.details || data?.error || t.syncFailed;
        if (detail?.includes("403") || detail?.includes("not available")) {
          throw new Error(lang === "ja"
            ? "LINE API の制限により一括同期できません。既存フォロワーにメッセージを送るよう依頼してください。"
            : "LINE 免费账号不支持批量同步。请让已关注的用户向你发一条消息，系统会自动建档。");
        }
        throw new Error(detail);
      }
      setNotice(`${t.syncSuccess} · +${data.synced}`);
      await loadLineFollowers();
    } catch (err) {
      setError(err instanceof Error ? err.message : t.syncFailed);
    } finally {
      setSaving(false);
    }
  }

  async function loadLineFollowers() {
    setError("");
    setNotice("");
    setLoading(true);
    setDetail(null);
    setPoints([]);
    setActiveCustomerId("");
    try {
      const res = await fetch("/api/admin/customers?filter=line_followers&limit=200");
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || t.searchFailed);
      setItems(data.items ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : t.searchFailed);
    } finally {
      setLoading(false);
    }
  }

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

      setDetail((prev) =>
        prev
          ? {
              ...prev,
              name: data.name,
              email: data.email,
              notes: data.notes,
              updatedAt: data.updatedAt
            }
          : prev
      );
      setItems((prev) => prev.map((item) => (item.id === detail.id ? { ...item, name: data.name, email: data.email } : item)));
      setNotice(t.saveSuccess);
    } catch (err) {
      setError(err instanceof Error ? err.message : t.saveFailed);
    } finally {
      setSaving(false);
    }
  }

  async function deleteCustomer() {
    if (!detail) return;
    if (!window.confirm(t.deleteConfirm)) return;

    setError("");
    setNotice("");
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/customers/${detail.id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(mapDeleteError(lang, t.deleteFailed, data?.error));

      setItems((prev) => prev.filter((item) => item.id !== detail.id));
      setDetail(null);
      setPoints([]);
      setActiveCustomerId("");
      setDraft(createDraft(null));
      setNotice(t.deleteSuccess);
    } catch (err) {
      setError(err instanceof Error ? err.message : t.deleteFailed);
    } finally {
      setSaving(false);
    }
  }

  async function cleanupLeadCustomers() {
    setError("");
    setNotice("");
    setSaving(true);
    try {
      const res = await fetch("/api/admin/customers?mode=cleanup-leads", { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || t.cleanupFailed);

      setItems((prev) => prev.filter((item) => !(item.customerType === "lead" && item.deletable)));
      if (detail && detail.customerType === "lead") {
        setDetail(null);
        setPoints([]);
        setActiveCustomerId("");
        setDraft(createDraft(null));
      }
      setNotice(`${t.cleanupSuccess} · ${t.batchCount}: ${data?.deletedCount ?? 0}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : t.cleanupFailed);
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="admin-panel-shell">
      <h2 className="admin-section-title">{t.title}</h2>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        {(["line_followers", "all"] as const).map((t_key) => (
          <button
            key={t_key}
            type="button"
            onClick={() => {
              setTab(t_key);
              if (t_key === "all") { setItems([]); setDetail(null); setPoints([]); setActiveCustomerId(""); }
            }}
            className={"inline-flex min-h-8 items-center rounded-lg px-3 py-1.5 text-sm font-medium transition-colors duration-150 " +
              (tab === t_key
                ? "bg-brand-800 text-white"
                : "bg-brand-50 text-brand-600 hover:bg-brand-100")}
          >
            {t_key === "line_followers" ? t.tabLineFollowers : t.tabAll}
          </button>
        ))}
        <button
          type="button"
          disabled={saving}
          onClick={() => void syncFollowers()}
          className="inline-flex min-h-8 items-center rounded-lg border border-brand-200 px-3 py-1.5 text-sm font-medium text-brand-700 transition-colors duration-150 hover:bg-brand-50 disabled:opacity-40 ml-auto"
        >
          {t.syncFollowers}
        </button>
      </div>

      <div className="mt-3 flex flex-col gap-2 xl:flex-row xl:items-start xl:justify-between">
        <div className={"flex w-full flex-col gap-2 sm:flex-row xl:max-w-2xl " + (tab === "line_followers" ? "opacity-40 pointer-events-none" : "")}>
          <label htmlFor="customer-search-input" className="sr-only">{t.placeholder}</label>
          <input id="customer-search-input" className="admin-input w-full" placeholder={t.placeholder} value={q} onChange={(e) => setQ(e.target.value)} />
          <button className="admin-btn-primary w-full sm:w-auto" onClick={() => { setTab("all"); void search(); }} type="button">
            {t.search}
          </button>
        </div>
        <div className="rounded-2xl border border-brand-100 bg-brand-50/50 px-4 py-3 text-sm text-brand-800 xl:max-w-sm">
          <p className="font-medium text-brand-900">{t.cleanupLeads}</p>
          <p className="mt-1 text-xs leading-6 text-brand-700">{t.cleanupHint}</p>
          <div className="mt-3 flex items-center justify-between gap-3">
            <span className="text-xs text-brand-600">{cleanupCandidates}</span>
            <button className="admin-btn-danger" type="button" onClick={() => void cleanupLeadCustomers()} disabled={cleanupCandidates === 0 || saving}>
              {t.cleanupLeads}
            </button>
          </div>
        </div>
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
                {item.deletable ? <span className="rounded-full bg-red-50 px-2 py-0.5 text-xs font-semibold text-red-700">{t.remove}</span> : null}
              </div>
              <p className="mt-1 text-sm text-brand-700">{item.lineUser?.displayName || item.lineUser?.lineUserId || item.email || t.noEmail}</p>
              <p className="text-xs text-brand-700">
                {t.summary} {item.appointmentCount} · {t.spent} {item.totalSpentJpy} JPY · {t.points} {item.currentPoints}
              </p>
              <p className="mt-1 text-xs text-brand-500">{t.source}: {createdFromLabel(lang, item.createdFrom)}</p>
            </button>
          ))}
        </div>

        <div className="rounded-2xl border border-brand-100/90 bg-white p-4">
          {!detail ? (
            <p className="ui-state-info mt-0">{t.selectHint}</p>
          ) : (
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
                <p className="text-sm text-brand-700">{t.spent} {detail.totalSpentJpy} JPY · {t.currentPoints} {detail.currentPoints}</p>
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
                    <div className="pt-2">
                      <Link className="admin-btn-secondary inline-flex" href={`/admin/line?lang=${lang}&userId=${detail.lineUser.id}`}>
                        {t.openLineConversation}
                      </Link>
                    </div>
                  </div>
                ) : (
                  <p className="mt-2 text-sm text-brand-700">{t.disconnected}</p>
                )}
              </div>

              <div className="rounded-2xl border border-brand-100 bg-white p-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="font-medium text-brand-900">{t.editTitle}</p>
                  <button type="button" className="admin-btn-danger" onClick={() => void deleteCustomer()}>
                    {t.remove}
                  </button>
                </div>
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
                    <p key={point.id}>{point.type} · {point.points}pt · {point.jpyValue}JPY · {new Date(point.createdAt).toLocaleString(locale)}</p>
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
