"use client";

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

type Props = {
  lang: Lang;
};

const TEXT = {
  zh: {
    title: "预约管理",
    subtitle: "按日期、状态和关键词快速筛选预约，并在一个页面里完成确认、取消和完结。",
    date: "日期",
    status: "状态",
    keyword: "关键词",
    keywordPlaceholder: "搜索预约号、顾客姓名、邮箱或套餐",
    refresh: "刷新",
    reset: "重置筛选",
    pending: "待确认",
    confirmed: "已确认",
    completed: "已完成",
    canceled: "已取消",
    all: "全部",
    customer: "顾客",
    time: "时间",
    service: "服务",
    actions: "操作",
    confirm: "确认预约",
    cancel: "取消预约",
    complete: "完成预约",
    loading: "加载中...",
    empty: "当前筛选条件下没有预约记录。",
    loadFailed: "加载预约失败",
    actionFailed: "操作失败",
    confirmCancel: "确定要取消这笔预约吗？取消后将立即释放时间段。",
    countSuffix: "笔预约",
    completeTitle: "完成预约",
    actualPaid: "实付金额 (JPY)",
    usePoints: "使用积分",
    note: "备注",
    notePlaceholder: "记录实收情况、店内备注或补充说明",
    saveComplete: "保存完成记录",
    close: "关闭",
    invalidComplete: "请填写有效的实付金额和积分数，且都不能小于 0。",
    addons: "加项",
    filtersTitle: "筛选条件",
    overviewTitle: "预约概览",
    noAddons: "无",
    visibleCount: "当前可见",
    quickActions: "优先处理待确认预约，再关注当天已确认和已完成记录。",
    pendingHint: "新预约提交后等待店长确认。",
    confirmedHint: "已确认，将按预约时间占用档期。",
    completedHint: "服务已完成，可用于积分结算。",
    canceledHint: "已取消，档期已释放。",
    allHint: "显示当前筛选条件下的全部预约。"
  },
  ja: {
    title: "予約管理",
    subtitle: "日付、状態、キーワードで予約を絞り込み、確認・キャンセル・完了処理を一画面で進められます。",
    date: "日付",
    status: "状態",
    keyword: "キーワード",
    keywordPlaceholder: "予約番号、顧客名、メール、メニュー名で検索",
    refresh: "再読込",
    reset: "条件をリセット",
    pending: "未確認",
    confirmed: "確定済み",
    completed: "完了",
    canceled: "キャンセル",
    all: "すべて",
    customer: "顧客",
    time: "日時",
    service: "メニュー",
    actions: "操作",
    confirm: "予約確定",
    cancel: "予約取消",
    complete: "施術完了",
    loading: "読み込み中...",
    empty: "条件に一致する予約はありません。",
    loadFailed: "予約一覧の取得に失敗しました",
    actionFailed: "操作に失敗しました",
    confirmCancel: "この予約をキャンセルしますか。キャンセルすると枠は即時解放されます。",
    countSuffix: "件の予約",
    completeTitle: "施術完了",
    actualPaid: "実支払額 (JPY)",
    usePoints: "利用ポイント",
    note: "メモ",
    notePlaceholder: "会計内容、店内メモ、補足事項を記録",
    saveComplete: "完了内容を保存",
    close: "閉じる",
    invalidComplete: "実支払額と利用ポイントは 0 以上の有効な数値を入力してください。",
    addons: "追加項目",
    filtersTitle: "絞り込み",
    overviewTitle: "予約サマリー",
    noAddons: "なし",
    visibleCount: "表示件数",
    quickActions: "まず未確認予約を処理し、その後に当日の確定・完了状況を確認する想定です。",
    pendingHint: "新規予約が入り、店長確認待ちです。",
    confirmedHint: "確定済みで、予約時間を確保しています。",
    completedHint: "施術完了済みで、ポイント計算対象です。",
    canceledHint: "キャンセル済みで、枠は解放済みです。",
    allHint: "現在の条件で取得した予約をすべて表示します。"
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
  const [keyword, setKeyword] = useState("");
  const [items, setItems] = useState<AppointmentItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [openCompleteId, setOpenCompleteId] = useState<string | null>(null);
  const [completeDraft, setCompleteDraft] = useState<CompleteDraft>(createEmptyDraft());

  const queryString = useMemo(() => {
    const qs = new URLSearchParams({ lang, limit: "200" });
    if (date) qs.set("date", date);
    if (status !== "all") qs.set("status", status);
    return qs.toString();
  }, [date, lang, status]);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/admin/appointments?${queryString}`);
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

  const filteredItems = useMemo(() => {
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

  const statusCounts = useMemo(() => {
    return items.reduce(
      (acc, item) => {
        acc[item.status] += 1;
        return acc;
      },
      { pending: 0, confirmed: 0, completed: 0, canceled: 0 }
    );
  }, [items]);

  const overviewCards = [
    { key: "all", label: t.all, value: items.length, hint: t.allHint, tone: "from-brand-100 via-white to-white" },
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

    await doPatch(`/api/admin/appointments/${itemId}/complete`, {
      actualPaidJpy,
      usePoints,
      note: completeDraft.note.trim() || "Completed from admin page"
    });

    closeComplete();
  }

  function resetFilters() {
    setDate("");
    setStatus("all");
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
                className={`rounded-[1.25rem] border border-brand-100 bg-gradient-to-br ${item.tone} p-4 text-left shadow-sm transition-transform duration-200 hover:-translate-y-0.5 ${status === item.key ? "ring-2 ring-brand-300" : ""}`}
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
                  <span className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${statusClass(item.status)}`}>
                    {statusLabel(lang, item.status)}
                  </span>
                </div>

                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                  <div className="rounded-2xl border border-brand-100 bg-brand-50/45 p-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-500">{t.customer}</p>
                    <p className="mt-2 text-sm font-semibold text-brand-900">{item.customer.name}</p>
                    <p className="text-sm text-brand-700">{item.customer.email || "-"}</p>
                    <p className="text-xs text-brand-600">{lang === "ja" ? "LINE \u9867\u5ba2" : "LINE \u5ba2\u6237"}: {item.customer.lineUser?.displayName || item.customer.lineUser?.lineUserId || "-"}</p>
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
                    <p className="text-xs text-brand-600">{lang === "ja" ? "\u30ae\u30e3\u30e9\u30ea\u30fc\u7531\u6765" : "\u56fe\u5899\u6b3e\u5f0f"}: {item.showcaseItem?.title || (lang === "ja" ? "\u30ae\u30e3\u30e9\u30ea\u30fc\u7d4c\u7531\u3067\u306f\u306a\u3044" : "\u975e\u56fe\u5899\u6d41\u7a0b")}</p>
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
                  <button type="button" className="admin-btn-primary min-h-10 px-3 py-2" onClick={() => void doPatch(`/api/admin/appointments/${item.id}/confirm`)}>
                    {t.confirm}
                  </button>
                ) : null}

                {(item.status === "pending" || item.status === "confirmed") ? (
                  <button
                    type="button"
                    className="admin-btn-ghost px-3 py-2"
                    onClick={() => {
                      if (!window.confirm(t.confirmCancel)) return;
                      void doPatch(`/api/admin/appointments/${item.id}/cancel`, {
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
