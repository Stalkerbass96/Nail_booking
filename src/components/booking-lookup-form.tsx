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
    bookingNo: "预约编号",
    submit: "查询",
    notFound: "未找到预约，请确认邮箱和预约编号",
    failed: "查询失败",
    result: "查询结果",
    status: "状态",
    start: "开始时间",
    end: "结束时间",
    service: "套餐",
    addons: "加项",
    styleNote: "款式说明",
    customerNote: "备注"
  },
  ja: {
    title: "予約照会",
    email: "メール",
    bookingNo: "予約番号",
    submit: "検索",
    notFound: "予約が見つかりません。メールと予約番号を確認してください",
    failed: "照会に失敗しました",
    result: "検索結果",
    status: "ステータス",
    start: "開始時間",
    end: "終了時間",
    service: "メニュー",
    addons: "追加オプション",
    styleNote: "デザイン希望",
    customerNote: "備考"
  }
};

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
      <form onSubmit={onSubmit} className="ui-card">
        <h2 className="text-xl font-semibold text-brand-900">{t.title}</h2>

        <div className="mt-4 grid gap-3 sm:gap-4 md:grid-cols-2">
          <label className="grid gap-2" htmlFor="lookup-email">
            <span className="text-sm font-medium text-brand-800">{t.email}</span>
            <input
              id="lookup-email"
              className="ui-input"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="email"
            />
          </label>

          <label className="grid gap-2" htmlFor="lookup-booking-no">
            <span className="text-sm font-medium text-brand-800">{t.bookingNo}</span>
            <input
              id="lookup-booking-no"
              className="ui-input"
              value={bookingNo}
              onChange={(event) => setBookingNo(event.target.value)}
            />
          </label>
        </div>

        {error ? <p className="ui-state-error" aria-live="assertive">{error}</p> : null}

        <button
          className="ui-btn-primary mt-4 w-full sm:w-auto"
          type="submit"
          disabled={loading}
        >
          {loading ? "..." : t.submit}
        </button>
      </form>

      {result ? (
        <section className="ui-card">
          <h3 className="text-lg font-semibold text-brand-900">{t.result}</h3>
          <div className="mt-3 grid gap-2 text-sm text-brand-800">
            <p>{t.status}: {result.status}</p>
            <p>{t.start}: {new Date(result.startAt).toLocaleString(lang === "ja" ? "ja-JP" : "zh-CN")}</p>
            <p>{t.end}: {new Date(result.endAt).toLocaleString(lang === "ja" ? "ja-JP" : "zh-CN")}</p>
            <p>{t.service}: {result.packageName}</p>
            <p>{t.addons}: {result.addons.length ? result.addons.join(", ") : "-"}</p>
            <p>{t.styleNote}: {result.styleNote || "-"}</p>
            <p>{t.customerNote}: {result.customerNote || "-"}</p>
          </div>
        </section>
      ) : null}
    </div>
  );
}
