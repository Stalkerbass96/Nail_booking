"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Lang } from "@/lib/lang";

type Props = {
  lang: Lang;
};

const TEXT = {
  zh: {
    logout: "退出",
    loading: "退出中..."
  },
  ja: {
    logout: "ログアウト",
    loading: "ログアウト中..."
  }
};

export default function AdminLogoutButton({ lang }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const t = TEXT[lang];

  async function logout() {
    setLoading(true);
    try {
      await fetch("/api/admin/auth/logout", { method: "POST" });
      router.push(`/admin/login?lang=${lang}`);
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      className="rounded-lg border border-brand-300 px-3 py-1 text-sm text-brand-900"
      onClick={logout}
      disabled={loading}
      type="button"
    >
      {loading ? t.loading : t.logout}
    </button>
  );
}
