"use client";

import { useState } from "react";
import type { Lang } from "@/lib/lang";

type LinkedLineUser = {
  id: string;
  displayName?: string | null;
  lineUserId: string;
  linkedAt?: string | null;
  isFollowing: boolean;
};

type Props = {
  lang: Lang;
};

const TEXT = {
  zh: {
    title: "LINE 管理",
    desc: "输入预约号和邮箱，查看或解除绑定。",
    bookingNo: "预约号",
    email: "邮箱",
    lookup: "查询绑定状态",
    unlink: "解除绑定",
    linked: "当前已绑定 LINE",
    notLinked: "当前没有绑定任何 LINE 账号。",
    following: "已关注官方账号",
    notFollowing: "当前未关注或已屏蔽官方账号",
    linkedAt: "绑定时间",
    failed: "查询失败",
    unlinkFailed: "解绑失败",
    unlinked: "已解除绑定",
    noLinkedUser: "当前没有可解除的绑定",
    lineUserId: "LINE ID"
  },
  ja: {
    title: "LINE 管理",
    desc: "予約番号とメールアドレスで連携状態を確認します。",
    bookingNo: "予約番号",
    email: "メールアドレス",
    lookup: "連携状態を確認",
    unlink: "連携を解除",
    linked: "現在連携されている LINE",
    notLinked: "現在連携されている LINE アカウントはありません。",
    following: "公式アカウントを友だち追加済み",
    notFollowing: "現在は未追加またはブロック状態です",
    linkedAt: "連携日時",
    failed: "確認に失敗しました",
    unlinkFailed: "解除に失敗しました",
    unlinked: "連携を解除しました",
    noLinkedUser: "解除できる LINE 連携がありません",
    lineUserId: "LINE ID"
  }
} as const;

export default function LineManageForm({ lang }: Props) {
  const t = TEXT[lang];
  const locale = lang === "ja" ? "ja-JP" : "zh-CN";
  const [bookingNo, setBookingNo] = useState("");
  const [email, setEmail] = useState("");
  const [linkedLineUser, setLinkedLineUser] = useState<LinkedLineUser | null | undefined>(undefined);
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");
  const [loading, setLoading] = useState(false);
  const [unlinking, setUnlinking] = useState(false);

  async function lookup(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    setOk("");
    try {
      const res = await fetch("/api/public/line/manage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingNo, email })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || t.failed);
      setLinkedLineUser(data.linkedLineUser ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : t.failed);
    } finally {
      setLoading(false);
    }
  }

  async function unlink() {
    if (!linkedLineUser) {
      setError(t.noLinkedUser);
      return;
    }

    setUnlinking(true);
    setError("");
    setOk("");
    try {
      const res = await fetch("/api/public/line/manage", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingNo, email })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || t.unlinkFailed);
      setLinkedLineUser(null);
      setOk(t.unlinked);
    } catch (err) {
      setError(err instanceof Error ? err.message : t.unlinkFailed);
    } finally {
      setUnlinking(false);
    }
  }

  return (
    <div className="section-panel section-panel-compact">
      <h2 className="text-xl font-semibold text-brand-900">{t.title}</h2>
      <p className="section-copy mt-2">{t.desc}</p>

      <form className="mt-4 grid gap-3" onSubmit={lookup}>
        <label className="grid gap-2">
          <span className="text-sm font-medium text-brand-800">{t.bookingNo}</span>
          <input className="ui-input" value={bookingNo} onChange={(event) => setBookingNo(event.target.value)} required />
        </label>

        <label className="grid gap-2">
          <span className="text-sm font-medium text-brand-800">{t.email}</span>
          <input className="ui-input" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
        </label>

        {error ? <p className="ui-state-error">{error}</p> : null}
        {ok ? <p className="ui-state-success">{ok}</p> : null}

        <button className="ui-btn-primary w-full" type="submit" disabled={loading}>
          {loading ? "..." : t.lookup}
        </button>
      </form>

      {linkedLineUser === undefined ? null : linkedLineUser === null ? (
        <p className="ui-state-info mt-5">{t.notLinked}</p>
      ) : (
        <div className="admin-subsection mt-5">
          <p className="font-semibold text-brand-900">{t.linked}</p>
          <p className="text-sm text-brand-800">{linkedLineUser.displayName || linkedLineUser.lineUserId}</p>
          <p className="text-sm text-brand-700">{t.lineUserId}: {linkedLineUser.lineUserId}</p>
          <p className="text-sm text-brand-700">{linkedLineUser.isFollowing ? t.following : t.notFollowing}</p>
          {linkedLineUser.linkedAt ? (
            <p className="text-sm text-brand-700">{t.linkedAt}: {new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short" }).format(new Date(linkedLineUser.linkedAt))}</p>
          ) : null}
          <button className="ui-btn-secondary mt-3 w-full" type="button" onClick={() => void unlink()} disabled={unlinking}>
            {unlinking ? `${t.unlink}...` : t.unlink}
          </button>
        </div>
      )}
    </div>
  );
}
