"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { Lang } from "@/lib/lang";

type LineUserItem = {
  id: string;
  lineUserId: string;
  displayName?: string | null;
  pictureUrl?: string | null;
  isFollowing: boolean;
  linkedAt?: string | null;
  lastSeenAt?: string | null;
  customer: { id: string; name: string; email: string } | null;
  lastMessage?: {
    text?: string | null;
    messageType: string;
    direction: string;
    createdAt: string;
  } | null;
};

type LineMessageItem = {
  id: string;
  direction: string;
  status: string;
  messageType: string;
  text?: string | null;
  createdAt: string;
};

type CustomerItem = {
  id: string;
  name: string;
  email: string;
};

type Props = {
  lang: Lang;
};

const TEXT = {
  zh: {
    title: "LINE 对话与绑定",
    desc: "接收顾客的 LINE 消息，在后台查看 1 对 1 对话，并把 LINE 账号绑定到顾客记录。",
    configOn: "LINE 已配置",
    configOff: "LINE 未配置",
    appBaseOk: "APP_BASE_URL 已配置",
    appBaseMissing: "APP_BASE_URL 未配置",
    searchPlaceholder: "搜索 LINE 昵称、ID、顾客姓名或邮箱",
    search: "查询",
    loadFailed: "加载 LINE 数据失败",
    loadMessagesFailed: "加载对话失败",
    bindFailed: "绑定失败",
    sendFailed: "发送失败",
    linkFailed: "发送绑定链接失败",
    bind: "绑定顾客",
    sendLink: "发送绑定链接",
    unbind: "解除绑定",
    linkedCustomer: "已绑定顾客",
    unlinked: "未绑定顾客",
    lineUserId: "LINE ID",
    recentUsers: "最近 LINE 用户",
    noUsers: "还没有收到 LINE 用户消息",
    conversation: "对话记录",
    noMessages: "暂无消息记录",
    customerSearch: "搜索顾客",
    sendMessage: "发送消息",
    sendPlaceholder: "输入要通过 LINE 发送给顾客的文字",
    send: "发送",
    searchingCustomers: "搜索中...",
    noCustomers: "没有找到顾客",
    selectUserHint: "左侧选择一个 LINE 用户以查看对话和执行绑定",
    lastSeen: "最近活跃",
    lastMessage: "最近消息",
    following: "已关注",
    notFollowing: "未关注",
    incoming: "顾客",
    outgoing: "店长",
    system: "系统",
    customerBound: "绑定成功",
    customerUnbound: "已解除绑定",
    sent: "发送成功",
    linkSent: "已发送绑定链接",
    webhookHint: "Webhook 路径：/api/line/webhook",
    linkedAt: "绑定时间",
    linkHelp: "顾客收到链接后，会用预约号 + 邮箱自行完成绑定。"
  },
  ja: {
    title: "LINE 会話と紐付け",
    desc: "お客様からの LINE メッセージを受け取り、1対1の会話を管理し、LINE アカウントを顧客情報に紐付けます。",
    configOn: "LINE 設定済み",
    configOff: "LINE 未設定",
    appBaseOk: "APP_BASE_URL 設定済み",
    appBaseMissing: "APP_BASE_URL 未設定",
    searchPlaceholder: "LINE名、ID、顧客名、メールで検索",
    search: "検索",
    loadFailed: "LINE データの読み込みに失敗しました",
    loadMessagesFailed: "会話の読み込みに失敗しました",
    bindFailed: "紐付けに失敗しました",
    sendFailed: "送信に失敗しました",
    linkFailed: "連携リンク送信に失敗しました",
    bind: "顧客に紐付け",
    sendLink: "連携リンク送信",
    unbind: "紐付け解除",
    linkedCustomer: "紐付け済み顧客",
    unlinked: "未紐付け",
    lineUserId: "LINE ID",
    recentUsers: "最近の LINE ユーザー",
    noUsers: "まだ LINE メッセージがありません",
    conversation: "会話履歴",
    noMessages: "メッセージはありません",
    customerSearch: "顧客検索",
    sendMessage: "メッセージ送信",
    sendPlaceholder: "この顧客へ LINE で送るメッセージを入力",
    send: "送信",
    searchingCustomers: "検索中...",
    noCustomers: "顧客が見つかりません",
    selectUserHint: "左の LINE ユーザーを選ぶと、会話閲覧と紐付けができます。",
    lastSeen: "最終アクティブ",
    lastMessage: "最新メッセージ",
    following: "友だち追加済み",
    notFollowing: "ブロック/未追加",
    incoming: "顧客",
    outgoing: "店長",
    system: "システム",
    customerBound: "紐付けました",
    customerUnbound: "紐付けを解除しました",
    sent: "送信しました",
    linkSent: "連携リンクを送りました",
    webhookHint: "Webhook パス: /api/line/webhook",
    linkedAt: "紐付け日時",
    linkHelp: "お客様は受け取ったリンクで、予約番号 + メール確認を行って自分で連携できます。"
  }
} as const;

export default function AdminLinePanel({ lang }: Props) {
  const t = TEXT[lang];
  const locale = lang === "ja" ? "ja-JP" : "zh-CN";

  const [query, setQuery] = useState("");
  const [users, setUsers] = useState<LineUserItem[]>([]);
  const [configEnabled, setConfigEnabled] = useState(false);
  const [appBaseUrlConfigured, setAppBaseUrlConfigured] = useState(false);
  const [activeUserId, setActiveUserId] = useState("");
  const [messages, setMessages] = useState<LineMessageItem[]>([]);
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [linking, setLinking] = useState(false);
  const [customerQuery, setCustomerQuery] = useState("");
  const [customerResults, setCustomerResults] = useState<CustomerItem[]>([]);
  const [searchingCustomers, setSearchingCustomers] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [draftMessage, setDraftMessage] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);

  const activeUser = useMemo(() => users.find((item) => item.id === activeUserId) ?? null, [activeUserId, users]);

  const loadUsers = useCallback(
    async (keyword = "") => {
      setLoadingUsers(true);
      setError("");
      try {
        const qs = new URLSearchParams();
        if (keyword.trim()) qs.set("q", keyword.trim());
        const res = await fetch(`/api/admin/line/users${qs.toString() ? `?${qs.toString()}` : ""}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error || t.loadFailed);
        setUsers(data.items ?? []);
        setConfigEnabled(Boolean(data.config?.enabled));
        setAppBaseUrlConfigured(Boolean(data.config?.appBaseUrlConfigured));
        setActiveUserId((prev) => prev || data.items?.[0]?.id || "");
      } catch (err) {
        setError(err instanceof Error ? err.message : t.loadFailed);
      } finally {
        setLoadingUsers(false);
      }
    },
    [t.loadFailed]
  );

  const loadMessages = useCallback(
    async (userId: string) => {
      setLoadingMessages(true);
      setError("");
      try {
        const res = await fetch(`/api/admin/line/users/${userId}/messages`);
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error || t.loadMessagesFailed);
        setMessages(data.messages ?? []);
      } catch (err) {
        setError(err instanceof Error ? err.message : t.loadMessagesFailed);
      } finally {
        setLoadingMessages(false);
      }
    },
    [t.loadMessagesFailed]
  );

  useEffect(() => {
    void loadUsers();
  }, [loadUsers]);

  useEffect(() => {
    if (!activeUserId) return;
    void loadMessages(activeUserId);
  }, [activeUserId, loadMessages]);

  async function searchCustomers() {
    setSearchingCustomers(true);
    setError("");
    try {
      const qs = new URLSearchParams({ q: customerQuery, limit: "20" });
      const res = await fetch(`/api/admin/customers?${qs.toString()}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || t.loadFailed);
      setCustomerResults(data.items ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : t.loadFailed);
    } finally {
      setSearchingCustomers(false);
    }
  }

  async function bindCustomer(customerId: string | null) {
    if (!activeUserId) return;
    setError("");
    setOk("");
    try {
      const res = await fetch(`/api/admin/line/users/${activeUserId}/bind`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customerId })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || t.bindFailed);
      setUsers((prev) => prev.map((item) => (item.id === activeUserId ? { ...item, customer: data.user.customer } : item)));
      setSelectedCustomerId(customerId ?? "");
      setOk(customerId ? t.customerBound : t.customerUnbound);
    } catch (err) {
      setError(err instanceof Error ? err.message : t.bindFailed);
    }
  }

  async function sendLinkRequest() {
    if (!activeUserId) return;
    setLinking(true);
    setError("");
    setOk("");
    try {
      const res = await fetch(`/api/admin/line/users/${activeUserId}/link-request`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.details || data?.error || t.linkFailed);
      setOk(t.linkSent);
    } catch (err) {
      setError(err instanceof Error ? err.message : t.linkFailed);
    } finally {
      setLinking(false);
    }
  }

  async function sendMessage(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!activeUserId) return;
    setError("");
    setOk("");
    setSendingMessage(true);
    try {
      const res = await fetch(`/api/admin/line/users/${activeUserId}/message`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: draftMessage })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.details || data?.error || t.sendFailed);
      setMessages((prev) => [...prev, data.message]);
      setDraftMessage("");
      setOk(t.sent);
      await loadUsers(query);
    } catch (err) {
      setError(err instanceof Error ? err.message : t.sendFailed);
    } finally {
      setSendingMessage(false);
    }
  }

  function directionLabel(direction: string) {
    if (direction === "incoming") return t.incoming;
    if (direction === "outgoing") return t.outgoing;
    return t.system;
  }

  return (
    <section className="admin-panel-shell">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 className="admin-section-title">{t.title}</h2>
          <p className="admin-note mt-2">{t.desc}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${configEnabled ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>
            {configEnabled ? t.configOn : t.configOff}
          </span>
          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${appBaseUrlConfigured ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>
            {appBaseUrlConfigured ? t.appBaseOk : t.appBaseMissing}
          </span>
          <span className="text-xs text-brand-700">{t.webhookHint}</span>
        </div>
      </div>

      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
        <input className="admin-input w-full" value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t.searchPlaceholder} />
        <button type="button" className="admin-btn-primary w-full sm:w-auto" onClick={() => void loadUsers(query)}>
          {t.search}
        </button>
      </div>

      {error ? <p className="admin-danger">{error}</p> : null}
      {ok ? <p className="ui-state-success">{ok}</p> : null}

      <div className="mt-5 grid gap-5 xl:grid-cols-[0.92fr_1.08fr]">
        <section className="admin-subsection mt-0">
          <h3 className="font-semibold text-brand-900">{t.recentUsers}</h3>
          {loadingUsers ? <p className="ui-state-info mt-0">...</p> : null}
          <div className="grid gap-2">
            {!loadingUsers && users.length === 0 ? <p className="ui-state-info mt-0">{t.noUsers}</p> : null}
            {users.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveUserId(item.id)}
                className={`admin-item text-left transition-colors ${activeUserId === item.id ? "border-brand-300 bg-brand-50/60" : ""}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium text-brand-900">{item.displayName || item.lineUserId}</p>
                    <p className="text-xs text-brand-700">{item.lineUserId}</p>
                    <p className="mt-1 text-xs text-brand-700">{item.customer ? `${t.linkedCustomer}: ${item.customer.name}` : t.unlinked}</p>
                  </div>
                  <span className={`rounded-full px-2 py-1 text-[11px] font-semibold ${item.isFollowing ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>
                    {item.isFollowing ? t.following : t.notFollowing}
                  </span>
                </div>
                {item.lastMessage ? (
                  <div className="mt-2 text-xs text-brand-700">
                    <p>{t.lastMessage}: {item.lastMessage.text || item.lastMessage.messageType}</p>
                    <p>{new Intl.DateTimeFormat(locale, { dateStyle: "short", timeStyle: "short" }).format(new Date(item.lastMessage.createdAt))}</p>
                  </div>
                ) : null}
              </button>
            ))}
          </div>
        </section>

        <section className="admin-subsection mt-0">
          {!activeUser ? (
            <p className="ui-state-info mt-0">{t.selectUserHint}</p>
          ) : (
            <div className="grid gap-4">
              <div className="rounded-2xl border border-brand-100 bg-white p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-lg font-semibold text-brand-900">{activeUser.displayName || activeUser.lineUserId}</p>
                    <p className="text-sm text-brand-700">{t.lineUserId}: {activeUser.lineUserId}</p>
                    <p className="text-sm text-brand-700">{activeUser.customer ? `${t.linkedCustomer}: ${activeUser.customer.name} (${activeUser.customer.email})` : t.unlinked}</p>
                    {activeUser.linkedAt ? <p className="text-sm text-brand-700">{t.linkedAt}: {new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short" }).format(new Date(activeUser.linkedAt))}</p> : null}
                    {activeUser.lastSeenAt ? <p className="text-sm text-brand-700">{t.lastSeen}: {new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short" }).format(new Date(activeUser.lastSeenAt))}</p> : null}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button type="button" className="admin-btn-secondary" onClick={() => void sendLinkRequest()} disabled={!configEnabled || !appBaseUrlConfigured || linking}>
                      {linking ? `${t.sendLink}...` : t.sendLink}
                    </button>
                    {activeUser.customer ? <button type="button" className="admin-btn-ghost" onClick={() => void bindCustomer(null)}>{t.unbind}</button> : null}
                  </div>
                </div>
                <p className="field-hint mt-3">{t.linkHelp}</p>
              </div>

              <div className="grid gap-3 rounded-2xl border border-brand-100 bg-white p-4">
                <h3 className="font-semibold text-brand-900">{t.bind}</h3>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <input className="admin-input w-full" value={customerQuery} onChange={(event) => setCustomerQuery(event.target.value)} placeholder={t.customerSearch} />
                  <button type="button" className="admin-btn-secondary w-full sm:w-auto" onClick={() => void searchCustomers()}>
                    {t.search}
                  </button>
                </div>
                {searchingCustomers ? <p className="ui-state-info mt-0">{t.searchingCustomers}</p> : null}
                <div className="grid gap-2">
                  {!searchingCustomers && customerResults.length === 0 && customerQuery.trim() ? <p className="ui-state-info mt-0">{t.noCustomers}</p> : null}
                  {customerResults.map((item) => (
                    <label key={item.id} className="choice-tile">
                      <input type="radio" checked={selectedCustomerId === item.id} onChange={() => setSelectedCustomerId(item.id)} />
                      <span className="choice-tile-main">
                        <strong>{item.name}</strong>
                        <small>{item.email}</small>
                      </span>
                    </label>
                  ))}
                </div>
                <button type="button" className="admin-btn-secondary w-full sm:w-auto" onClick={() => void bindCustomer(selectedCustomerId || null)} disabled={!selectedCustomerId}>
                  {t.bind}
                </button>
              </div>

              <div className="grid gap-3 rounded-2xl border border-brand-100 bg-white p-4">
                <h3 className="font-semibold text-brand-900">{t.conversation}</h3>
                {loadingMessages ? <p className="ui-state-info mt-0">...</p> : null}
                <div className="grid max-h-[22rem] gap-2 overflow-auto">
                  {!loadingMessages && messages.length === 0 ? <p className="ui-state-info mt-0">{t.noMessages}</p> : null}
                  {messages.map((item) => (
                    <article key={item.id} className={`rounded-2xl border px-3 py-2 text-sm ${item.direction === "incoming" ? "border-brand-100 bg-brand-50/40 text-brand-900" : item.direction === "outgoing" ? "border-emerald-100 bg-emerald-50/70 text-emerald-900" : "border-slate-100 bg-slate-50 text-slate-700"}`}>
                      <p className="text-xs font-semibold uppercase tracking-[0.14em]">{directionLabel(item.direction)}</p>
                      <p className="mt-1 whitespace-pre-wrap">{item.text || `[${item.messageType}]`}</p>
                      <p className="mt-2 text-xs opacity-80">{new Intl.DateTimeFormat(locale, { dateStyle: "short", timeStyle: "short" }).format(new Date(item.createdAt))}</p>
                    </article>
                  ))}
                </div>
              </div>

              <form className="grid gap-3 rounded-2xl border border-brand-100 bg-white p-4" onSubmit={sendMessage}>
                <h3 className="font-semibold text-brand-900">{t.sendMessage}</h3>
                <textarea className="admin-input min-h-28" value={draftMessage} onChange={(event) => setDraftMessage(event.target.value)} placeholder={t.sendPlaceholder} />
                <button type="submit" className="admin-btn-primary w-full sm:w-auto" disabled={sendingMessage || !draftMessage.trim()}>
                  {sendingMessage ? `${t.send}...` : t.send}
                </button>
              </form>
            </div>
          )}
        </section>
      </div>
    </section>
  );
}
