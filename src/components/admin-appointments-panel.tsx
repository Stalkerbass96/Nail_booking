"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { Lang } from "@/lib/lang";

type AppointmentItem = {
  id: string;
  bookingNo: string;
  status: "pending" | "confirmed" | "completed" | "canceled";
  startAt: string;
  endAt: string;
  customer: {
    name: string;
    email: string;
  };
  package: {
    id: string;
    name: string;
  };
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
    subtitle: "按日期和状态查看预约，并在一个页面内完成确认、取消和完结操作。",
    date: "日期",
    status: "状态",
    refresh: "刷新",
    pending: "待确认",
    confirmed: "已确认",
    completed: "已完成",
    canceled: "已取消",
    all: "全部",
    customer: "顾客",
    time: "时间",
    service: "套餐",
    actions: "操作",
    confirm: "确认预约",
    cancel: "取消预约",
    complete: "完成预约",
    loading: "加载中...",
    empty: "当前筛选条件下没有预约记录。",
    loadFailed: "加载预约失败",
    actionFailed: "操作失败",
    confirmCancel: "确认要取消这笔预约吗？取消后会立即释放档期。",
    countSuffix: "条预约",
    completeTitle: "完成预约",
    actualPaid: "实付金额 (JPY)",
    usePoints: "使用积分",
    note: "备注",
    notePlaceholder: "例如：现场改款、补差价、会员备注",
    saveComplete: "确认完成",
    close: "收起",
    invalidComplete: "请填写有效的实付金额和积分",
    statusBadge: "状态",
    addons: "加项"
  },
  ja: {
    title: "予約管理",
    subtitle: "日付と状態で予約を絞り込み、そのまま確認・キャンセル・完了処理まで行えます。",
    date: "日付",
    status: "ステータス",
    refresh: "更新",
    pending: "未確認",
    confirmed: "確認済み",
    completed: "完了",
    canceled: "キャンセル",
    all: "すべて",
    customer: "顧客",
    time: "時間",
    service: "メニュー",
    actions: "操作",
    confirm: "予約を確認",
    cancel: "予約をキャンセル",
    complete: "予約を完了",
    loading: "読み込み中...",
    empty: "この条件に該当する予約はありません。",
    loadFailed: "予約の読み込みに失敗しました",
    actionFailed: "操作に失敗しました",
    confirmCancel: "この予約をキャンセルしますか？キャンセルすると枠はすぐに解放されます。",
    countSuffix: "件の予約",
    completeTitle: "完了処理",
    actualPaid: "実支払額 (JPY)",
    usePoints: "利用ポイント",
    note: "メモ",
    notePlaceholder: "例：当日デザイン変更、差額調整、会員メモ",
    saveComplete: "完了を確定",
    close: "閉じる",
    invalidComplete: "実支払額とポイントを正しく入力してください",
    statusBadge: "状態",
    addons: "追加オプション"
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

export default function AdminAppointmentsPanel({ lang }: Props) {
  const t = TEXT[lang];

  const [date, setDate] = useState("");
  const [status, setStatus] = useState<(typeof STATUS_VALUES)[number]>("all");
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

  return (
    <section className="admin-panel-shell">
      <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="admin-section-title">{t.title}</h2>
          <p className="admin-note mt-2">{t.subtitle}</p>
        </div>
        <span className="rounded-full bg-brand-50 px-3 py-1 text-xs font-medium text-brand-700">
          {items.length} {t.countSuffix}
        </span>
      </div>

      <div className="grid gap-3 rounded-2xl border border-brand-100 bg-brand-50/40 p-3 sm:flex sm:flex-wrap sm:items-end">
        <div className="grid gap-1">
          <label className="text-sm text-brand-800" htmlFor="appointments-date-filter">{t.date}</label>
          <input
            id="appointments-date-filter"
            type="date"
            value={date}
            onChange={(event) => setDate(event.target.value)}
            className="admin-input"
          />
        </div>

        <div className="grid gap-1">
          <label className="text-sm text-brand-800" htmlFor="appointments-status-filter">{t.status}</label>
          <select
            id="appointments-status-filter"
            value={status}
            onChange={(event) => setStatus(event.target.value as (typeof STATUS_VALUES)[number])}
            className="admin-input"
          >
            <option value="all">{t.all}</option>
            <option value="pending">{t.pending}</option>
            <option value="confirmed">{t.confirmed}</option>
            <option value="completed">{t.completed}</option>
            <option value="canceled">{t.canceled}</option>
          </select>
        </div>

        <button type="button" className="admin-btn-secondary" onClick={() => void fetchItems()}>
          {t.refresh}
        </button>
      </div>

      {error ? <p className="admin-danger" aria-live="assertive">{error}</p> : null}
      {loading ? <p className="ui-state-info" aria-live="polite">{t.loading}</p> : null}

      <div className="mt-5 grid gap-3">
        {items.length === 0 && !loading ? <p className="ui-state-info">{t.empty}</p> : null}

        {items.map((item) => (
          <article key={item.id} className="admin-item">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="grid gap-2 text-sm text-brand-800">
                <p className="flex flex-wrap items-center gap-2 font-medium text-brand-900">
                  <span>#{item.bookingNo}</span>
                  <span className="rounded-full bg-brand-50 px-2 py-0.5 text-xs font-semibold text-brand-700">
                    {statusLabel(lang, item.status)}
                  </span>
                </p>
                <p>{t.customer}: {item.customer.name} ({item.customer.email})</p>
                <p>
                  {t.time}: {new Intl.DateTimeFormat(lang === "ja" ? "ja-JP" : "zh-CN", {
                    dateStyle: "medium",
                    timeStyle: "short"
                  }).format(new Date(item.startAt))}
                  {" - "}
                  {new Intl.DateTimeFormat(lang === "ja" ? "ja-JP" : "zh-CN", {
                    hour: "2-digit",
                    minute: "2-digit"
                  }).format(new Date(item.endAt))}
                </p>
                <p>
                  {t.service}: {item.package.name}
                  {item.addons.length ? ` (+ ${item.addons.map((a) => a.name).join(", ")})` : ""}
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                {item.status === "pending" ? (
                  <button
                    type="button"
                    className="admin-btn-primary min-h-10 px-3 py-2"
                    onClick={() => void doPatch(`/api/admin/appointments/${item.id}/confirm`)}
                  >
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
                  <button
                    type="button"
                    className="admin-btn-primary min-h-10 bg-brand-800 px-3 py-2 hover:bg-brand-900"
                    onClick={() => openComplete(item)}
                  >
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
                    <input
                      className="admin-input-sm"
                      inputMode="numeric"
                      value={completeDraft.actualPaidJpy}
                      onChange={(event) => setCompleteDraft((prev) => ({ ...prev, actualPaidJpy: event.target.value }))}
                    />
                  </label>

                  <label className="grid gap-1 text-sm text-brand-800">
                    <span>{t.usePoints}</span>
                    <input
                      className="admin-input-sm"
                      inputMode="numeric"
                      value={completeDraft.usePoints}
                      onChange={(event) => setCompleteDraft((prev) => ({ ...prev, usePoints: event.target.value }))}
                    />
                  </label>
                </div>

                <label className="grid gap-1 text-sm text-brand-800">
                  <span>{t.note}</span>
                  <textarea
                    className="admin-input min-h-24"
                    value={completeDraft.note}
                    onChange={(event) => setCompleteDraft((prev) => ({ ...prev, note: event.target.value }))}
                    placeholder={t.notePlaceholder}
                  />
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
