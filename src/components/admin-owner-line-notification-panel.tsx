"use client";

import { useEffect, useState } from "react";
import type { Lang } from "@/lib/lang";

type LineUserOption = {
  id: string;
  lineUserId: string;
  displayName: string | null;
  pictureUrl: string | null;
};

const TEXT = {
  zh: {
    title: "店主 LINE 通知",
    desc: "客户提交预约后，Official Account 会立即向选中的店主个人 LINE 发送预约摘要。",
    none: "不发送店主通知",
    save: "保存接收人",
    test: "发送测试通知",
    saved: "店主通知接收人已保存",
    tested: "测试通知已发送",
    loading: "正在加载 LINE 用户...",
    loadFailed: "加载店主通知设置失败",
    saveFailed: "保存店主通知设置失败",
    testFailed: "发送测试通知失败",
    hint: "店主账号需要先关注 Official Account，并至少发送过一条消息。"
  },
  ja: {
    title: "オーナー LINE 通知",
    desc: "お客様が予約を送信すると、選択したオーナーの個人 LINE に予約内容を通知します。",
    none: "オーナー通知を送信しない",
    save: "受信者を保存",
    test: "テスト通知を送信",
    saved: "通知先を保存しました",
    tested: "テスト通知を送信しました",
    loading: "LINE ユーザーを読み込み中...",
    loadFailed: "通知設定の読み込みに失敗しました",
    saveFailed: "通知設定の保存に失敗しました",
    testFailed: "テスト通知の送信に失敗しました",
    hint: "オーナーのアカウントで公式アカウントを友だち追加し、一度メッセージを送信してください。"
  }
} as const;

function optionLabel(user: LineUserOption) {
  const suffix = user.lineUserId.slice(-6);
  return `${user.displayName?.trim() || "LINE user"} (...${suffix})`;
}

export default function AdminOwnerLineNotificationPanel({ lang }: { lang: Lang }) {
  const t = TEXT[lang];
  const [users, setUsers] = useState<LineUserOption[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const response = await fetch("/api/admin/owner-notifications");
        const data = await response.json();
        if (!response.ok) throw new Error(data?.error || t.loadFailed);
        setUsers(data.users ?? []);
        setSelectedId(data.selectedLineUserId ?? "");
      } catch (err) {
        setError(err instanceof Error ? err.message : t.loadFailed);
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, [t.loadFailed]);

  async function save() {
    setSaving(true);
    setError("");
    setNotice("");
    try {
      const response = await fetch("/api/admin/owner-notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lineUserId: selectedId || null })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error || t.saveFailed);
      setNotice(t.saved);
    } catch (err) {
      setError(err instanceof Error ? err.message : t.saveFailed);
    } finally {
      setSaving(false);
    }
  }

  async function testNotification() {
    setTesting(true);
    setError("");
    setNotice("");
    try {
      const response = await fetch("/api/admin/owner-notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lineUserId: selectedId })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error || t.testFailed);
      setNotice(t.tested);
    } catch (err) {
      setError(err instanceof Error ? err.message : t.testFailed);
    } finally {
      setTesting(false);
    }
  }

  return (
    <section className="admin-panel-shell mb-6">
      <h2 className="admin-section-title">{t.title}</h2>
      <p className="mt-1 text-sm text-brand-700">{t.desc}</p>
      <p className="mt-1 text-xs text-brand-600">{t.hint}</p>

      {loading ? <p className="ui-state-info">{t.loading}</p> : (
        <div className="mt-4 grid gap-3 md:grid-cols-[minmax(0,1fr)_auto_auto] md:items-end">
          <label className="grid gap-1 text-sm text-brand-800">
            <span>{t.title}</span>
            <select className="admin-input" value={selectedId} onChange={(event) => setSelectedId(event.target.value)}>
              <option value="">{t.none}</option>
              {users.map((user) => <option key={user.id} value={user.id}>{optionLabel(user)}</option>)}
            </select>
          </label>
          <button className="admin-btn-primary" type="button" disabled={saving} onClick={() => void save()}>{saving ? "..." : t.save}</button>
          <button className="admin-btn-ghost" type="button" disabled={testing || !selectedId} onClick={() => void testNotification()}>{testing ? "..." : t.test}</button>
        </div>
      )}

      {error ? <p className="admin-danger mt-3" aria-live="assertive">{error}</p> : null}
      {notice ? <p className="ui-state-success mt-3" aria-live="polite">{notice}</p> : null}
    </section>
  );
}
