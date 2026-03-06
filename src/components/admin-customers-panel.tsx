"use client";

import { useState } from "react";
import type { Lang } from "@/lib/lang";

type CustomerItem = {
  id: string;
  name: string;
  email: string;
  totalSpentJpy: number;
  currentPoints: number;
  appointmentCount: number;
};

type CustomerDetail = {
  id: string;
  name: string;
  email: string;
  totalSpentJpy: number;
  currentPoints: number;
  appointments: Array<{
    id: string;
    bookingNo: string;
    status: string;
    startAt: string;
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

type Props = {
  lang: Lang;
};

const TEXT = {
  zh: {
    title: "客户与历史",
    placeholder: "姓名或邮箱",
    search: "查询",
    searchFailed: "查询失败",
    detailFailed: "加载客户详情失败",
    pointsFailed: "加载积分失败",
    loadFailed: "加载失败",
    summary: "预约",
    spent: "消费",
    points: "积分",
    selectHint: "选择左侧客户查看详情",
    currentPoints: "当前积分",
    recentAppointments: "最近预约",
    pointLedger: "积分流水",
    loading: "加载中...",
    empty: "暂无客户记录",
    noAppointments: "暂无预约记录",
    noPoints: "暂无积分流水"
  },
  ja: {
    title: "顧客と履歴",
    placeholder: "名前またはメール",
    search: "検索",
    searchFailed: "検索に失敗しました",
    detailFailed: "顧客詳細の読み込みに失敗しました",
    pointsFailed: "ポイントの読み込みに失敗しました",
    loadFailed: "読み込みに失敗しました",
    summary: "予約",
    spent: "利用額",
    points: "ポイント",
    selectHint: "左側の顧客を選択してください",
    currentPoints: "現在ポイント",
    recentAppointments: "最近の予約",
    pointLedger: "ポイント履歴",
    loading: "読み込み中...",
    empty: "顧客データがありません",
    noAppointments: "予約履歴はありません",
    noPoints: "ポイント履歴はありません"
  }
};

export default function AdminCustomersPanel({ lang }: Props) {
  const t = TEXT[lang];
  const locale = lang === "ja" ? "ja-JP" : "zh-CN";

  const [q, setQ] = useState("");
  const [items, setItems] = useState<CustomerItem[]>([]);
  const [detail, setDetail] = useState<CustomerDetail | null>(null);
  const [points, setPoints] = useState<PointItem[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [activeCustomerId, setActiveCustomerId] = useState("");

  async function search() {
    setError("");
    setLoading(true);
    try {
      const qs = new URLSearchParams({ q, limit: "100" });
      const res = await fetch(`/api/admin/customers?${qs.toString()}`);
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
    setLoading(true);
    try {
      const [detailRes, pointsRes] = await Promise.all([
        fetch(`/api/admin/customers/${customerId}`),
        fetch(`/api/admin/customers/${customerId}/points`)
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
      {loading ? <p className="ui-state-info" aria-live="polite">{t.loading}</p> : null}

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <div className="grid gap-2">
          {!loading && items.length === 0 ? <p className="ui-state-info">{t.empty}</p> : null}
          {items.map((item) => (
            <button key={item.id} className={`admin-item text-left transition duration-200 hover:-translate-y-0.5 hover:shadow-md ${activeCustomerId === item.id ? "border-brand-300 bg-brand-50/60" : ""}`} onClick={() => void openCustomer(item.id)} type="button">
              <p className="font-medium text-brand-900">{item.name}</p>
              <p className="text-sm text-brand-700">{item.email}</p>
              <p className="text-xs text-brand-700">
                {t.summary} {item.appointmentCount} · {t.spent} {item.totalSpentJpy} JPY · {t.points} {item.currentPoints}
              </p>
            </button>
          ))}
        </div>

        <div className="rounded-2xl border border-brand-100/90 bg-white p-4">
          {!detail ? <p className="ui-state-info mt-0">{t.selectHint}</p> : (
            <div className="grid gap-3">
              <div>
                <p className="text-lg font-semibold text-brand-900">{detail.name}</p>
                <p className="text-sm text-brand-700">{detail.email}</p>
                <p className="text-sm text-brand-700">
                  {t.spent} {detail.totalSpentJpy} JPY · {t.currentPoints} {detail.currentPoints}
                </p>
              </div>

              <div>
                <p className="font-medium text-brand-900">{t.recentAppointments}</p>
                <div className="mt-1 grid gap-1 text-sm text-brand-700">
                  {detail.appointments.slice(0, 8).map((appt) => (
                    <p key={appt.id}>#{appt.bookingNo} · {appt.status} · {new Date(appt.startAt).toLocaleString(locale)}</p>
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
