"use client";

import { useState } from "react";
import type { Lang } from "@/lib/lang";

type Props = {
  lang: Lang;
  sessionToken: string;
};

const TEXT = {
  zh: {
    title: "绑定你的 LINE 与预约身份",
    desc: "请输入预约号和邮箱，验证通过后会跳转到 LINE 官方绑定页。",
    bookingNo: "预约号",
    email: "邮箱",
    submit: "验证并继续",
    submitting: "跳转中...",
    invalidSession: "当前绑定链接无效或已过期，请联系店长重新发送绑定链接。",
    failed: "绑定验证失败",
    help: "如果你只是想解除绑定，请使用下方的 LINE 管理入口。",
    manage: "前往 LINE 管理"
  },
  ja: {
    title: "LINE と予約情報を連携する",
    desc: "予約番号とメールアドレスを入力すると、確認後に LINE 公式の連携画面へ移動します。",
    bookingNo: "予約番号",
    email: "メールアドレス",
    submit: "確認して進む",
    submitting: "遷移中...",
    invalidSession: "この連携リンクは無効または期限切れです。店長に再送を依頼してください。",
    failed: "連携確認に失敗しました",
    help: "解除だけ行いたい場合は、下の LINE 管理ページを利用してください。",
    manage: "LINE 管理へ"
  }
} as const;

export default function LineLinkForm({ lang, sessionToken }: Props) {
  const t = TEXT[lang];
  const [bookingNo, setBookingNo] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState(sessionToken ? "" : t.invalidSession);
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!sessionToken) {
      setError(t.invalidSession);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/public/line/link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionToken, bookingNo, email })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || t.failed);
      }

      window.location.href = data.redirectUrl;
    } catch (err) {
      setError(err instanceof Error ? err.message : t.failed);
      setLoading(false);
    }
  }

  return (
    <div className="section-panel">
      <h2 className="text-2xl font-semibold text-brand-900">{t.title}</h2>
      <p className="section-copy mt-2">{t.desc}</p>

      <form className="mt-5 grid gap-4" onSubmit={onSubmit}>
        <label className="grid gap-2">
          <span className="text-sm font-medium text-brand-800">{t.bookingNo}</span>
          <input className="ui-input" value={bookingNo} onChange={(event) => setBookingNo(event.target.value)} required />
        </label>

        <label className="grid gap-2">
          <span className="text-sm font-medium text-brand-800">{t.email}</span>
          <input className="ui-input" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
        </label>

        {error ? <p className="ui-state-error">{error}</p> : null}

        <button className="ui-btn-primary w-full sm:w-auto" type="submit" disabled={loading || !sessionToken}>
          {loading ? t.submitting : t.submit}
        </button>
      </form>

      <p className="field-hint">{t.help}</p>
      <a className="ui-btn-secondary mt-3 w-full sm:w-auto" href={`/line/manage?lang=${lang}`}>
        {t.manage}
      </a>
    </div>
  );
}
