"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Lang } from "@/lib/lang";

type Props = {
  nextPath: string;
  lang: Lang;
};

const TEXT = {
  zh: {
    email: "邮箱",
    password: "密码",
    submit: "登录",
    submitting: "登录中...",
    loginFailed: "登录失败"
  },
  ja: {
    email: "メール",
    password: "パスワード",
    submit: "ログイン",
    submitting: "ログイン中...",
    loginFailed: "ログインに失敗しました"
  }
};

export default function AdminLoginForm({ nextPath, lang }: Props) {
  const router = useRouter();
  const [email, setEmail] = useState("owner@nail-booking.local");
  const [password, setPassword] = useState("dev-only-change-me");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const t = TEXT[lang];

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/admin/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || t.loginFailed);
      }

      router.push(nextPath || `/admin?lang=${lang}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : t.loginFailed);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="grid gap-4" onSubmit={onSubmit}>
      <label className="grid gap-1">
        <span className="text-sm text-brand-800">{t.email}</span>
        <input
          className="rounded-lg border border-brand-200 px-3 py-2"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
      </label>

      <label className="grid gap-1">
        <span className="text-sm text-brand-800">{t.password}</span>
        <input
          className="rounded-lg border border-brand-200 px-3 py-2"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />
      </label>

      {error ? <p className="rounded bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}

      <button className="rounded-lg bg-brand-700 px-4 py-2 text-white disabled:opacity-60" type="submit" disabled={loading}>
        {loading ? t.submitting : t.submit}
      </button>
    </form>
  );
}
