"use client";

import { useState } from "react";
import type { Lang } from "@/lib/lang";

type LedgerItem = {
  id: string;
  customer: {
    id: string;
    name: string;
    email: string;
  };
  appointmentId: string | null;
  type: string;
  points: number;
  jpyValue: number;
  note?: string | null;
  createdAt: string;
};

type Props = {
  lang: Lang;
};

const TEXT = {
  zh: {
    title: "积分流水与扣减",
    customerFilter: "按客户ID过滤",
    searchLedger: "查询流水",
    customerIdRequired: "客户ID(必填)",
    appointmentIdOptional: "预约ID(可选)",
    usePoints: "扣减积分",
    submitUse: "执行扣减",
    loadLedgerFailed: "加载积分流水失败",
    useFailed: "扣减失败",
    loadFailed: "加载失败"
  },
  ja: {
    title: "ポイント履歴と利用",
    customerFilter: "顧客IDで絞り込み",
    searchLedger: "履歴検索",
    customerIdRequired: "顧客ID(必須)",
    appointmentIdOptional: "予約ID(任意)",
    usePoints: "利用ポイント",
    submitUse: "ポイント利用",
    loadLedgerFailed: "ポイント履歴の読み込みに失敗しました",
    useFailed: "ポイント利用に失敗しました",
    loadFailed: "読み込みに失敗しました"
  }
};

export default function AdminPointsPanel({ lang }: Props) {
  const t = TEXT[lang];
  const locale = lang === "ja" ? "ja-JP" : "zh-CN";

  const [customerId, setCustomerId] = useState("");
  const [items, setItems] = useState<LedgerItem[]>([]);
  const [error, setError] = useState("");

  const [useCustomerId, setUseCustomerId] = useState("");
  const [useAppointmentId, setUseAppointmentId] = useState("");
  const [usePoints, setUsePoints] = useState("0");

  async function search() {
    setError("");
    try {
      const qs = new URLSearchParams({ limit: "200" });
      if (customerId.trim()) qs.set("customerId", customerId.trim());

      const res = await fetch(`/api/admin/points/ledger?${qs.toString()}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || t.loadLedgerFailed);
      setItems(data.items ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : t.loadFailed);
    }
  }

  async function useManualPoints(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    try {
      const body: Record<string, unknown> = {
        customerId: useCustomerId,
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

      await search();
    } catch (err) {
      setError(err instanceof Error ? err.message : t.useFailed);
    }
  }

  return (
    <section className="admin-panel-shell">
      <h2 className="admin-section-title">{t.title}</h2>

      <div className="mt-4 flex gap-2">
        <input className="admin-input" placeholder={t.customerFilter} value={customerId} onChange={(e) => setCustomerId(e.target.value)} />
        <button className="admin-btn-primary" onClick={() => void search()} type="button">
          {t.searchLedger}
        </button>
      </div>

      <form className="admin-subsection md:grid-cols-4" onSubmit={useManualPoints}>
        <input className="admin-input-sm" placeholder={t.customerIdRequired} value={useCustomerId} onChange={(e) => setUseCustomerId(e.target.value)} />
        <input className="admin-input-sm" placeholder={t.appointmentIdOptional} value={useAppointmentId} onChange={(e) => setUseAppointmentId(e.target.value)} />
        <input className="admin-input-sm" placeholder={t.usePoints} value={usePoints} onChange={(e) => setUsePoints(e.target.value)} />
        <button className="admin-btn-secondary" type="submit">
          {t.submitUse}
        </button>
      </form>

      {error ? <p className="admin-danger">{error}</p> : null}

      <div className="mt-4 grid gap-2">
        {items.map((item) => (
          <article key={item.id} className="admin-item text-sm text-brand-800">
            <p>{item.customer.name} ({item.customer.email})</p>
            <p>{item.type} · {item.points}pt · {item.jpyValue}JPY · {new Date(item.createdAt).toLocaleString(locale)}</p>
            <p>{item.note || "-"}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
