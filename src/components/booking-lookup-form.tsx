"use client";

import { useState } from "react";
import type { Lang } from "@/lib/lang";

type LookupResult = {
  bookingNo: string;
  customerName: string;
  status: string;
  startAt: string;
  endAt: string;
  packageName: string;
  addons: string[];
  styleNote?: string | null;
  customerNote?: string | null;
};

type Props = {
  lang: Lang;
};

const TEXT = {
  zh: {
    title: "查询预约",
    email: "邮箱",
    bookingNo: "预约号",
    submit: "查询",
    notFound: "没有找到对应预约，请确认邮箱和预约号是否正确",
    failed: "查询失败",
    result: "预约结果",
    status: "状态",
    start: "开始时间",
    end: "结束时间",
    service: "套餐",
    addons: "加项",
    styleNote: "款式偏好",
    customerNote: "备注",
    emailPlaceholder: "name@example.com",
    bookingNoPlaceholder: "例如：NB-20260307-ABCD"
  },
  ja: {
    title: "予約確認",
    email: "メールアドレス",
    bookingNo: "予約番号",
    submit: "確認する",
    notFound: "予約が見つかりません。メールアドレスと予約番号を確認してください。",
    failed: "確認に失敗しました",
    result: "確認結果",
    status: "ステータス",
    start: "開始時間",
    end: "終了時間",
    service: "メニュー",
    addons: "追加オプション",
    styleNote: "デザイン希望",
    customerNote: "備考",
    emailPlaceholder: "name@example.com",
    bookingNoPlaceholder: "例：NB-20260307-ABCD"
  }
} as const;

const STATUS_TEXT = {
  zh: {
    pending: "待确认",
    confirmed: "已确认",
    completed: "已完成",
    canceled: "已取消"
  },
  ja: {
    pending: "未確認",
    confirmed: "確認済み",
    completed: "完了",
    canceled: "キャンセル"
  }
} as const;

export default function BookingLookupForm({ lang }: Props) {
  const t = TEXT[lang];
  const [email, setEmail] = useState("");
  const [bookingNo, setBookingNo] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<LookupResult | null>(null);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setLoading(true);
    setError("");
    setResult(null);

    try {
      const qs = new URLSearchParams({ email, bookingNo, lang });
      const res = await fetch(`/api/public/appointments/lookup?${qs.toString()}`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || t.notFound);
      }

      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : t.failed);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid gap-5">
      <form onSubmit={onSubmit} className="section-panel">
        <h2 className="text-xl font-semibold text-brand-900">{t.title}</h2>

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <label className="grid gap-2" htmlFor="lookup-email">
            <span className="text-sm font-medium text-brand-800">{t.email}</span>
            <input
              id="lookup-email"
              className="ui-input"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="email"
              inputMode="email"
              placeholder={t.emailPlaceholder}
            />
          </label>

          <label className="grid gap-2" htmlFor="lookup-booking-no">
            <span className="text-sm font-medium text-brand-800">{t.bookingNo}</span>
            <input
              id="lookup-booking-no"
              className="ui-input"
              value={bookingNo}
              onChange={(event) => setBookingNo(event.target.value)}
              placeholder={t.bookingNoPlaceholder}
            />
          </label>
        </div>

        {error ? <p className="ui-state-error" aria-live="assertive">{error}</p> : null}

        <button className="ui-btn-primary mt-4 w-full sm:w-auto" type="submit" disabled={loading}>
          {loading ? "..." : t.submit}
        </button>
      </form>

      {result ? (
        <section className="section-panel">
          <h3 className="text-lg font-semibold text-brand-900">{t.result}</h3>
          <div className="mt-4 grid gap-3 text-sm text-brand-800">
            <div className="summary-row"><span>{t.status}</span><strong>{STATUS_TEXT[lang][result.status as keyof typeof STATUS_TEXT[typeof lang]] ?? result.status}</strong></div>
            <div className="summary-row"><span>{t.start}</span><strong>{new Intl.DateTimeFormat(lang === "ja" ? "ja-JP" : "zh-CN", { dateStyle: "medium", timeStyle: "short" }).format(new Date(result.startAt))}</strong></div>
            <div className="summary-row"><span>{t.end}</span><strong>{new Intl.DateTimeFormat(lang === "ja" ? "ja-JP" : "zh-CN", { dateStyle: "medium", timeStyle: "short" }).format(new Date(result.endAt))}</strong></div>
            <div className="summary-row"><span>{t.service}</span><strong>{result.packageName}</strong></div>
            <div className="summary-row"><span>{t.addons}</span><strong>{result.addons.length ? result.addons.join(", ") : "-"}</strong></div>
            <div className="summary-row"><span>{t.styleNote}</span><strong>{result.styleNote || "-"}</strong></div>
            <div className="summary-row"><span>{t.customerNote}</span><strong>{result.customerNote || "-"}</strong></div>
          </div>
        </section>
      ) : null}
    </div>
  );
}
