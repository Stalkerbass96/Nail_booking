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
    email: "\u90ae\u7bb1",
    password: "\u5bc6\u7801",
    submit: "\u767b\u5f55",
    submitting: "\u767b\u5f55\u4e2d...",
    loginFailed: "\u767b\u5f55\u5931\u8d25"
  },
  ja: {
    email: "\u30e1\u30fc\u30eb",
    password: "\u30d1\u30b9\u30ef\u30fc\u30c9",
    submit: "\u30ed\u30b0\u30a4\u30f3",
    submitting: "\u30ed\u30b0\u30a4\u30f3\u4e2d...",
    loginFailed: "\u30ed\u30b0\u30a4\u30f3\u306b\u5931\u6557\u3057\u307e\u3057\u305f"
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
        <span className="text-sm font-medium text-neutral-700">{t.email}</span>
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
        <span className="text-sm font-medium text-neutral-700">{t.password}</span>
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

      <button className="admin-btn-primary w-full" type="submit" disabled={loading}>
        {loading ? t.submitting : t.submit}
      </button>
    </form>
  );
}
