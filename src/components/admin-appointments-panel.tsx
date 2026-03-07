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

type Props = {
  lang: Lang;
};

const TEXT = {
  zh: {
    title: "预约管理",
    date: "日期",
    status: "状态",
    refresh: "刷新",
    pending: "待确认",
    confirmed: "已确认",
    completed: "已完成",
    canceled: "已取消",
    all: "全部",
    customer: "客户",
    time: "时间",
    service: "套餐",
    actions: "操作",
    confirm: "确认",
    cancel: "取消",
    complete: "完成",
    loading: "加载中...",
    empty: "暂无数据",
    loadFailed: "加载失败",
    actionFailed: "操作失败",
    confirmCancel: "确认要取消该预约吗？",
    completePrompt: "请输入实付金额（JPY）",
    completePointsPrompt: "本次使用积分（默认0）"
  },
  ja: {
    title: "予約管理",
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
    confirm: "確認",
    cancel: "キャンセル",
    complete: "完了",
    loading: "読み込み中...",
    empty: "データなし",
    loadFailed: "読み込み失敗",
    actionFailed: "操作失敗",
    confirmCancel: "この予約をキャンセルしますか？",
    completePrompt: "実支払額（JPY）を入力してください",
    completePointsPrompt: "使用ポイント（未入力は0）"
  }
};

const STATUS_VALUES = ["all", "pending", "confirmed", "completed", "canceled"] as const;

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
        headers: {
          "Content-Type": "application/json"
        },
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

  return (
    <section className="admin-panel-shell">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-semibold text-brand-900">{t.title}</h2>
        <span className="rounded-full bg-brand-50 px-3 py-1 text-xs font-medium text-brand-700">
          {items.length} items
        </span>
      </div>

      <div className="grid gap-3 sm:flex sm:flex-wrap sm:items-end">
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

        <button
          type="button"
          className="admin-btn-secondary"
          onClick={() => void fetchItems()}
        >
          {t.refresh}
        </button>
      </div>

      {error ? <p className="admin-danger" aria-live="assertive">{error}</p> : null}

      {loading ? <p className="ui-state-info" aria-live="polite">{t.loading}</p> : null}

      <div className="mt-5 grid gap-3">
        {items.length === 0 && !loading ? <p className="ui-state-info">{t.empty}</p> : null}

        {items.map((item) => (
          <article key={item.id} className="admin-item">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="grid gap-1 text-sm text-brand-800">
                <p className="flex items-center gap-2 font-medium text-brand-900">
                  <span>#{item.bookingNo}</span>
                  <span className="rounded-full bg-brand-50 px-2 py-0.5 text-xs font-semibold text-brand-700">{statusLabel(lang, item.status)}</span>
                </p>
                <p>
                  {t.customer}: {item.customer.name} ({item.customer.email})
                </p>
                <p>
                  {t.time}: {new Date(item.startAt).toLocaleString(lang === "ja" ? "ja-JP" : "zh-CN")} -{" "}
                  {new Date(item.endAt).toLocaleTimeString(lang === "ja" ? "ja-JP" : "zh-CN", {
                    hour: "2-digit",
                    minute: "2-digit"
                  })}
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
                    onClick={() => {
                      const paidRaw = window.prompt(t.completePrompt, "0");
                      if (paidRaw === null) return;
                      const pointsRaw = window.prompt(t.completePointsPrompt, "0");
                      if (pointsRaw === null) return;

                      const actualPaidJpy = Number.parseInt(paidRaw, 10);
                      const usePoints = Number.parseInt(pointsRaw, 10);
                      if (!Number.isFinite(actualPaidJpy) || actualPaidJpy < 0) return;
                      if (!Number.isFinite(usePoints) || usePoints < 0) return;

                      void doPatch(`/api/admin/appointments/${item.id}/complete`, {
                        actualPaidJpy,
                        usePoints,
                        note: "Completed from admin page"
                      });
                    }}
                  >
                    {t.complete}
                  </button>
                ) : null}
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
