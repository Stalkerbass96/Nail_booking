"use client";

import { useState } from "react";
import type { Lang } from "@/lib/lang";

type LedgerItem = {
  id: string;
  customer: {
    id: string;
    name: string;
    email: string | null;
  };
  appointmentId: string | null;
  type: string;
  points: number;
  jpyValue: number;
  note?: string | null;
  createdAt: string;
};

type CustomerSearchItem = {
  id: string;
  name: string;
  email: string | null;
  currentPoints: number;
  customerType: "lead" | "active";
  lineUser: {
    lineUserId: string;
    displayName: string | null;
  } | null;
};

type Props = {
  lang: Lang;
};

const TEXT = {
  zh: {
    title: "积分流水与扣减",
    customerFilter: "按 LINE ID、LINE 昵称、姓名或邮箱搜索客户",
    searchCustomer: "搜索客户",
    searchLedger: "查询流水",
    selectedCustomer: "当前客户",
    customerRequired: "请先搜索并选择客户",
    noCustomer: "尚未选择客户",
    noCandidates: "没有找到匹配客户",
    chooseCustomer: "选择",
    currentPoints: "当前积分",
    lineId: "LINE ID",
    lineName: "LINE 昵称",
    appointmentIdOptional: "预约ID(可选)",
    usePoints: "扣减积分",
    submitUse: "执行扣减",
    searchHelp: "先搜索客户，再查看积分流水或扣减积分。",
    loadCustomersFailed: "搜索客户失败",
    loadLedgerFailed: "加载积分流水失败",
    useFailed: "扣减失败",
    useSuccess: "积分扣减已执行",
    loadFailed: "加载失败",
    loading: "加载中...",
    empty: "暂无积分记录",
    clearCustomer: "清除选择"
  },
  ja: {
    title: "ポイント履歴と利用",
    customerFilter: "LINE ID、LINE 表示名、名前、メールで顧客検索",
    searchCustomer: "顧客を検索",
    searchLedger: "履歴検索",
    selectedCustomer: "選択中の顧客",
    customerRequired: "先に顧客を検索して選択してください",
    noCustomer: "顧客が未選択です",
    noCandidates: "一致する顧客が見つかりません",
    chooseCustomer: "選択",
    currentPoints: "現在ポイント",
    lineId: "LINE ID",
    lineName: "LINE 表示名",
    appointmentIdOptional: "予約ID(任意)",
    usePoints: "利用ポイント",
    submitUse: "ポイント利用",
    searchHelp: "先に顧客を選んでから、履歴確認またはポイント利用を行います。",
    loadCustomersFailed: "顧客検索に失敗しました",
    loadLedgerFailed: "ポイント履歴の読み込みに失敗しました",
    useFailed: "ポイント利用に失敗しました",
    useSuccess: "ポイント利用を登録しました",
    loadFailed: "読み込みに失敗しました",
    loading: "読み込み中...",
    empty: "ポイント履歴はありません",
    clearCustomer: "選択解除"
  }
} as const;

function formatCustomerLabel(item: CustomerSearchItem) {
  return item.lineUser?.displayName || item.name;
}

export default function AdminPointsPanel({ lang }: Props) {
  const t = TEXT[lang];
  const locale = lang === "ja" ? "ja-JP" : "zh-CN";

  const [customerQuery, setCustomerQuery] = useState("");
  const [customerResults, setCustomerResults] = useState<CustomerSearchItem[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerSearchItem | null>(null);

  const [items, setItems] = useState<LedgerItem[]>([]);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(false);
  const [customerLoading, setCustomerLoading] = useState(false);

  const [useAppointmentId, setUseAppointmentId] = useState("");
  const [usePoints, setUsePoints] = useState("0");

  async function searchCustomers() {
    setError("");
    setNotice("");
    setCustomerLoading(true);
    try {
      const query = customerQuery.trim();
      if (!query) {
        setCustomerResults([]);
        return;
      }

      const qs = new URLSearchParams({ q: query, limit: "20" });
      const res = await fetch(`/api/admin/customers?${qs.toString()}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || t.loadCustomersFailed);
      setCustomerResults(data.items ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : t.loadCustomersFailed);
    } finally {
      setCustomerLoading(false);
    }
  }

  async function searchLedger(customerOverride?: CustomerSearchItem | null) {
    setError("");
    setNotice("");
    setLoading(true);
    try {
      const customer = customerOverride ?? selectedCustomer;
      if (!customer) {
        setItems([]);
        throw new Error(t.customerRequired);
      }

      const qs = new URLSearchParams({ limit: "200", customerId: customer.id });
      const res = await fetch(`/api/admin/points/ledger?${qs.toString()}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || t.loadLedgerFailed);
      setItems(data.items ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : t.loadFailed);
    } finally {
      setLoading(false);
    }
  }

  async function useManualPoints(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setNotice("");

    if (!selectedCustomer) {
      setError(t.customerRequired);
      return;
    }

    try {
      const body: Record<string, unknown> = {
        customerId: selectedCustomer.id,
        points: Number.parseInt(usePoints, 10) || 0,
        note: "Manual deduction from admin points page"
      };

      if (useAppointmentId.trim()) {
        body.appointmentId = useAppointmentId.trim();
      }

      const res = await fetch("/api/admin/points/use", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || t.useFailed);

      setSelectedCustomer((prev) => (prev ? { ...prev, currentPoints: data.currentPoints ?? prev.currentPoints } : prev));
      setNotice(t.useSuccess);
      await searchLedger();
    } catch (err) {
      setError(err instanceof Error ? err.message : t.useFailed);
    }
  }

  function chooseCustomer(customer: CustomerSearchItem) {
    setSelectedCustomer(customer);
    setCustomerResults([]);
    setCustomerQuery(customer.lineUser?.lineUserId || customer.name);
    void searchLedger(customer);
  }

  return (
    <section className="admin-panel-shell">
      <h2 className="admin-section-title">{t.title}</h2>
      <p className="mt-2 text-sm text-brand-700">{t.searchHelp}</p>

      <div className="mt-4 grid gap-3">
        <div className="flex flex-col gap-2 sm:flex-row">
          <label htmlFor="points-customer-filter" className="sr-only">{t.customerFilter}</label>
          <input
            id="points-customer-filter"
            className="admin-input"
            placeholder={t.customerFilter}
            value={customerQuery}
            onChange={(e) => setCustomerQuery(e.target.value)}
          />
          <button className="admin-btn-primary w-full sm:w-auto" onClick={() => void searchCustomers()} type="button">
            {customerLoading ? `${t.searchCustomer}...` : t.searchCustomer}
          </button>
        </div>

        {customerResults.length > 0 ? (
          <div className="grid gap-2 rounded-2xl border border-brand-100 bg-brand-50/40 p-3">
            {customerResults.map((item) => (
              <div key={item.id} className="flex flex-col gap-2 rounded-xl border border-brand-100 bg-white p-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0 text-sm text-brand-800">
                  <p className="font-medium text-brand-900">{formatCustomerLabel(item)}</p>
                  <p>{t.currentPoints}: {item.currentPoints}</p>
                  <p>{t.lineId}: {item.lineUser?.lineUserId || "-"}</p>
                  <p>{t.lineName}: {item.lineUser?.displayName || "-"}</p>
                </div>
                <button className="admin-btn-secondary" type="button" onClick={() => chooseCustomer(item)}>
                  {t.chooseCustomer}
                </button>
              </div>
            ))}
          </div>
        ) : customerQuery.trim() && !customerLoading ? (
          <p className="ui-state-info">{t.noCandidates}</p>
        ) : null}
      </div>

      <div className="admin-subsection mt-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="text-sm text-brand-800">
            <p className="font-medium text-brand-900">{t.selectedCustomer}</p>
            {selectedCustomer ? (
              <>
                <p>{formatCustomerLabel(selectedCustomer)}</p>
                <p>{t.currentPoints}: {selectedCustomer.currentPoints}</p>
                <p>{t.lineId}: {selectedCustomer.lineUser?.lineUserId || "-"}</p>
              </>
            ) : (
              <p>{t.noCustomer}</p>
            )}
          </div>
          {selectedCustomer ? (
            <button
              className="admin-btn-ghost"
              type="button"
              onClick={() => {
                setSelectedCustomer(null);
                setItems([]);
                setCustomerQuery("");
                setCustomerResults([]);
              }}
            >
              {t.clearCustomer}
            </button>
          ) : null}
        </div>
      </div>

      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
        <button className="admin-btn-primary w-full sm:w-auto" onClick={() => void searchLedger()} type="button">
          {t.searchLedger}
        </button>
      </div>

      <form className="admin-subsection md:grid-cols-4" onSubmit={useManualPoints}>
        <div className="rounded-xl border border-brand-100 bg-white px-3 py-2 text-sm text-brand-800">
          {selectedCustomer ? `${formatCustomerLabel(selectedCustomer)} · ${t.currentPoints} ${selectedCustomer.currentPoints}` : t.customerRequired}
        </div>
        <input className="admin-input-sm" aria-label={t.appointmentIdOptional} placeholder={t.appointmentIdOptional} value={useAppointmentId} onChange={(e) => setUseAppointmentId(e.target.value)} />
        <input className="admin-input-sm" aria-label={t.usePoints} placeholder={t.usePoints} value={usePoints} onChange={(e) => setUsePoints(e.target.value)} />
        <button className="admin-btn-secondary" type="submit">
          {t.submitUse}
        </button>
      </form>

      {error ? <p className="admin-danger" aria-live="assertive">{error}</p> : null}
      {notice ? <p className="ui-state-success" aria-live="polite">{notice}</p> : null}
      {loading ? <p className="ui-state-info" aria-live="polite">{t.loading}</p> : null}

      <div className="mt-4 grid gap-2">
        {!loading && items.length === 0 ? <p className="ui-state-info">{t.empty}</p> : null}
        {items.map((item) => (
          <article key={item.id} className="admin-item text-sm text-brand-800">
            <p>{item.customer.name}{item.customer.email ? ` (${item.customer.email})` : ""}</p>
            <p>{item.type} · {item.points}pt · {item.jpyValue}JPY · {new Date(item.createdAt).toLocaleString(locale)}</p>
            <p>{item.note || "-"}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
