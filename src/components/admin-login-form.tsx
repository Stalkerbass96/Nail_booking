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
      <label className="grid gap-1.5" htmlFor="admin-login-email">
        <span className="text-sm font-medium text-brand-800">{t.email}</span>
        <input
          id="admin-login-email"
          className="admin-input"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          autoComplete="email"
        />
      </label>

      <label className="grid gap-1.5" htmlFor="admin-login-password">
        <span className="text-sm font-medium text-brand-800">{t.password}</span>
        <input
          id="admin-login-password"
          className="admin-input"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          autoComplete="current-password"
        />
      </label>

      {error ? <p className="admin-danger" aria-live="assertive">{error}</p> : null}

      <button className="admin-btn-primary w-full sm:w-auto" type="submit" disabled={loading}>
        {loading ? t.submitting : t.submit}
      </button>
    </form>
  );
}
