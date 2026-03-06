"use client";

import { useEffect, useMemo, useState } from "react";
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

  async function fetchItems() {
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
  }

  useEffect(() => {
    void fetchItems();
  }, [queryString]);

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
    <section className="rounded-2xl border border-brand-100 bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-end gap-3">
        <div className="grid gap-1">
          <label className="text-sm text-brand-800">{t.date}</label>
          <input
            type="date"
            value={date}
            onChange={(event) => setDate(event.target.value)}
            className="rounded-lg border border-brand-200 px-3 py-2"
          />
        </div>

        <div className="grid gap-1">
          <label className="text-sm text-brand-800">{t.status}</label>
          <select
            value={status}
            onChange={(event) => setStatus(event.target.value as (typeof STATUS_VALUES)[number])}
            className="rounded-lg border border-brand-200 px-3 py-2"
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
          className="rounded-lg border border-brand-300 px-4 py-2 text-brand-900"
          onClick={() => void fetchItems()}
        >
          {t.refresh}
        </button>
      </div>

      {error ? <p className="mt-4 rounded bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}

      {loading ? <p className="mt-4 text-sm text-brand-700">...</p> : null}

      <div className="mt-5 grid gap-3">
        {items.length === 0 && !loading ? <p className="text-sm text-brand-700">{t.empty}</p> : null}

        {items.map((item) => (
          <article key={item.id} className="rounded-xl border border-brand-100 px-4 py-3">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="grid gap-1 text-sm text-brand-800">
                <p>
                  #{item.bookingNo} · {statusLabel(lang, item.status)}
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
                    className="rounded bg-brand-700 px-3 py-1 text-sm text-white"
                    onClick={() => void doPatch(`/api/admin/appointments/${item.id}/confirm`)}
                  >
                    {t.confirm}
                  </button>
                ) : null}

                {(item.status === "pending" || item.status === "confirmed") ? (
                  <button
                    type="button"
                    className="rounded border border-brand-300 px-3 py-1 text-sm text-brand-900"
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
                    className="rounded bg-brand-800 px-3 py-1 text-sm text-white"
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