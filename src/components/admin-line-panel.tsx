"use client";

import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import type { Lang } from "@/lib/lang";

type LineUserItem = {
  id: string;
  lineUserId: string;
  displayName?: string | null;
  pictureUrl?: string | null;
  isFollowing: boolean;
  linkedAt?: string | null;
  lastSeenAt?: string | null;
  unreadCount: number;
  customer: { id: string; name: string; email: string } | null;
  lastMessage?: {
    text?: string | null;
    messageType: string;
    direction: string;
    createdAt: string;
    readAt?: string | null;
  } | null;
};

type LineMessageItem = {
  id: string;
  direction: string;
  status: string;
  messageType: string;
  text?: string | null;
  createdAt: string;
  readAt?: string | null;
};

type CustomerItem = {
  id: string;
  name: string;
  email: string;
};

type InboxFilter = "all" | "unread" | "linked";

type Props = {
  lang: Lang;
};

const TEXT = {
  zh: {
    title: "LINE ????",
    desc: "???? LINE ???????????????????????????????",
    configOn: "LINE ???",
    configOff: "LINE ???",
    appBaseOk: "APP_BASE_URL ???",
    appBaseMissing: "APP_BASE_URL ???",
    searchPlaceholder: "?? LINE ???LINE ID????????",
    search: "??",
    loadFailed: "?? LINE ????",
    loadMessagesFailed: "??????",
    bindFailed: "??????",
    sendFailed: "??????",
    linkFailed: "????????",
    bind: "????",
    sendLink: "??????",
    unbind: "????",
    linkedCustomer: "?????",
    unlinked: "?????",
    lineUserId: "LINE ID",
    recentUsers: "?? LINE ??",
    noUsers: "??????? LINE ??",
    conversation: "????",
    noMessages: "??????",
    customerSearch: "????",
    sendMessage: "????",
    sendPlaceholder: "????????? LINE ????",
    send: "??",
    searchingCustomers: "???...",
    noCustomers: "??????",
    selectUserHint: "???????? LINE ????????????????",
    lastSeen: "????",
    lastMessage: "??????",
    following: "???",
    notFollowing: "???/???",
    incoming: "??",
    outgoing: "??",
    system: "??",
    customerBound: "???????",
    customerUnbound: "???????",
    sent: "?????",
    linkSent: "???????",
    webhookHint: "Webhook ???/api/line/webhook",
    linkedAt: "????",
    linkHelp: "??????????????????? LINE ???",
    unread: "??",
    unreadMessages: "????",
    inboxSummary: "?????",
    unreadTotal: "????",
    filterAll: "??",
    filterUnread: "???",
    filterLinked: "????",
    filterLabel: "??",
    conversationRead: "?????????????",
    customerActions: "????",
    onlyUnreadEmpty: "????????",
    onlyLinkedEmpty: "?????????? LINE ??",
    resultsLabel: "????"
  },
  ja: {
    title: "LINE ????",
    desc: "??? LINE ????????????????????????????????????????????????",
    configOn: "LINE ????",
    configOff: "LINE ???",
    appBaseOk: "APP_BASE_URL ????",
    appBaseMissing: "APP_BASE_URL ???",
    searchPlaceholder: "LINE ?????LINE ID???????????",
    search: "??",
    loadFailed: "LINE ??????????????",
    loadMessagesFailed: "????????????",
    bindFailed: "???????????",
    sendFailed: "??????????????",
    linkFailed: "???????????????",
    bind: "?????",
    sendLink: "???????",
    unbind: "????",
    linkedCustomer: "??????",
    unlinked: "???",
    lineUserId: "LINE ID",
    recentUsers: "??? LINE ????",
    noUsers: "??????? LINE ??????????",
    conversation: "????",
    noMessages: "?????????????",
    customerSearch: "?????",
    sendMessage: "???????",
    sendPlaceholder: "????? LINE ????????????",
    send: "??",
    searchingCustomers: "???...",
    noCustomers: "??????????",
    selectUserHint: "??? LINE ??????????????????????????",
    lastSeen: "???????",
    lastMessage: "???????",
    following: "???????",
    notFollowing: "???/?????",
    incoming: "??",
    outgoing: "??",
    system: "????",
    customerBound: "???????????",
    customerUnbound: "???????????",
    sent: "????????????",
    linkSent: "????????????",
    webhookHint: "Webhook ??: /api/line/webhook",
    linkedAt: "????",
    linkHelp: "?????????????? LINE ??????????",
    unread: "??",
    unreadMessages: "???????",
    inboxSummary: "???????",
    unreadTotal: "????",
    filterAll: "???",
    filterUnread: "????",
    filterLinked: "??????",
    filterLabel: "??",
    conversationRead: "????????????????",
    customerActions: "????",
    onlyUnreadEmpty: "?????????????",
    onlyLinkedEmpty: "?????????? LINE ????????",
    resultsLabel: "????"
  }
} as const;

function formatDateTime(value: string, locale: string) {
  return new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

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
  const [inboxFilter, setInboxFilter] = useState<InboxFilter>("all");

  const orderedUsers = useMemo(
    () =>
      [...users].sort((a, b) => {
        if (b.unreadCount !== a.unreadCount) return b.unreadCount - a.unreadCount;
        const aTime = a.lastSeenAt ? new Date(a.lastSeenAt).getTime() : 0;
        const bTime = b.lastSeenAt ? new Date(b.lastSeenAt).getTime() : 0;
        return bTime - aTime;
      }),
    [users]
  );

  const filteredUsers = useMemo(() => {
    if (inboxFilter === "unread") return orderedUsers.filter((item) => item.unreadCount > 0);
    if (inboxFilter === "linked") return orderedUsers.filter((item) => item.customer);
    return orderedUsers;
  }, [inboxFilter, orderedUsers]);

  const activeUser = useMemo(
    () => filteredUsers.find((item) => item.id === activeUserId) ?? orderedUsers.find((item) => item.id === activeUserId) ?? null,
    [activeUserId, filteredUsers, orderedUsers]
  );

  const unreadTotal = useMemo(() => users.reduce((acc, item) => acc + item.unreadCount, 0), [users]);
  const linkedTotal = useMemo(() => users.filter((item) => item.customer).length, [users]);

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
        const nextItems = data.items ?? [];
        setUsers(nextItems);
        setConfigEnabled(Boolean(data.config?.enabled));
        setAppBaseUrlConfigured(Boolean(data.config?.appBaseUrlConfigured));
        setActiveUserId((prev) => {
          if (prev && nextItems.some((item: LineUserItem) => item.id === prev)) return prev;
          return nextItems[0]?.id || "";
        });
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
        setUsers((prev) =>
          prev.map((item) =>
            item.id === userId
              ? {
                  ...item,
                  unreadCount: 0,
                  lastMessage: item.lastMessage && item.lastMessage.direction === "incoming"
                    ? { ...item.lastMessage, readAt: item.lastMessage.readAt ?? new Date().toISOString() }
                    : item.lastMessage
                }
              : item
          )
        );
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
    if (!activeUserId) {
      setMessages([]);
      return;
    }
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
      await loadUsers(query);
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

  async function sendMessage(event: FormEvent<HTMLFormElement>) {
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

  function emptyCopy() {
    if (inboxFilter === "unread") return t.onlyUnreadEmpty;
    if (inboxFilter === "linked") return t.onlyLinkedEmpty;
    return t.noUsers;
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
          <span className="rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700">{t.unreadTotal}: {unreadTotal}</span>
          <span className="text-xs text-brand-700">{t.webhookHint}</span>
        </div>
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="flex flex-col gap-2 sm:flex-row">
          <input className="admin-input w-full" value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t.searchPlaceholder} />
          <button type="button" className="admin-btn-primary w-full sm:w-auto" onClick={() => void loadUsers(query)}>
            {t.search}
          </button>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-brand-100 bg-brand-50/60 px-4 py-3 text-sm text-brand-800">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-500">{t.inboxSummary}</p>
            <p className="mt-2 text-2xl font-semibold text-brand-900">{unreadTotal}</p>
            <p className="text-xs text-brand-600">{t.unreadMessages}</p>
          </div>
          <div className="rounded-2xl border border-brand-100 bg-white px-4 py-3 text-sm text-brand-800">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-500">{t.filterUnread}</p>
            <p className="mt-2 text-2xl font-semibold text-brand-900">{orderedUsers.filter((item) => item.unreadCount > 0).length}</p>
            <p className="text-xs text-brand-600">{t.resultsLabel}</p>
          </div>
          <div className="rounded-2xl border border-brand-100 bg-white px-4 py-3 text-sm text-brand-800">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-500">{t.filterLinked}</p>
            <p className="mt-2 text-2xl font-semibold text-brand-900">{linkedTotal}</p>
            <p className="text-xs text-brand-600">{t.resultsLabel}</p>
          </div>
        </div>
      </div>

      {error ? <p className="admin-danger">{error}</p> : null}
      {ok ? <p className="ui-state-success">{ok}</p> : null}

      <div className="mt-5 grid gap-5 xl:grid-cols-[0.92fr_1.08fr]">
        <section className="admin-subsection mt-0">
          <div className="flex flex-col gap-3 border-b border-brand-100 pb-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="font-semibold text-brand-900">{t.recentUsers}</h3>
              <p className="mt-1 text-xs text-brand-700">{t.filterLabel}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {([
                ["all", t.filterAll],
                ["unread", t.filterUnread],
                ["linked", t.filterLinked]
              ] as const).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setInboxFilter(value)}
                  className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${inboxFilter === value ? "bg-brand-700 text-white" : "bg-brand-50 text-brand-700 hover:bg-brand-100"}`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {loadingUsers ? <p className="ui-state-info mt-4">...</p> : null}
          <div className="mt-4 grid gap-2">
            {!loadingUsers && filteredUsers.length === 0 ? <p className="ui-state-info mt-0">{emptyCopy()}</p> : null}
            {filteredUsers.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveUserId(item.id)}
                className={`admin-item text-left transition-colors ${activeUserId === item.id ? "border-brand-300 bg-brand-50/60" : ""}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium text-brand-900">{item.displayName || item.lineUserId}</p>
                      {item.unreadCount > 0 ? <span className="rounded-full bg-brand-700 px-2 py-0.5 text-[11px] font-semibold text-white">{t.unread} {item.unreadCount}</span> : null}
                    </div>
                    <p className="text-xs text-brand-700">{item.lineUserId}</p>
                    <p className="mt-1 text-xs text-brand-700">{item.customer ? `${t.linkedCustomer}: ${item.customer.name}` : t.unlinked}</p>
                  </div>
                  <span className={`rounded-full px-2 py-1 text-[11px] font-semibold ${item.isFollowing ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>
                    {item.isFollowing ? t.following : t.notFollowing}
                  </span>
                </div>
                {item.lastMessage ? (
                  <div className="mt-2 text-xs text-brand-700">
                    <p>
                      {t.lastMessage}: {item.lastMessage.text || item.lastMessage.messageType}
                      {item.lastMessage.direction === "incoming" && !item.lastMessage.readAt ? ` ? ${t.unread}` : ""}
                    </p>
                    <p>{formatDateTime(item.lastMessage.createdAt, locale)}</p>
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
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-lg font-semibold text-brand-900">{activeUser.displayName || activeUser.lineUserId}</p>
                      {activeUser.unreadCount > 0 ? <span className="rounded-full bg-brand-700 px-2 py-0.5 text-xs font-semibold text-white">{t.unread} {activeUser.unreadCount}</span> : null}
                    </div>
                    <p className="text-sm text-brand-700">{t.lineUserId}: {activeUser.lineUserId}</p>
                    <p className="text-sm text-brand-700">{activeUser.customer ? `${t.linkedCustomer}: ${activeUser.customer.name} (${activeUser.customer.email})` : t.unlinked}</p>
                    {activeUser.linkedAt ? <p className="text-sm text-brand-700">{t.linkedAt}: {formatDateTime(activeUser.linkedAt, locale)}</p> : null}
                    {activeUser.lastSeenAt ? <p className="text-sm text-brand-700">{t.lastSeen}: {formatDateTime(activeUser.lastSeenAt, locale)}</p> : null}
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
                <div className="flex items-center justify-between gap-3">
                  <h3 className="font-semibold text-brand-900">{t.conversation}</h3>
                  <span className="rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700">{t.unreadMessages}: {messages.filter((item) => item.direction === "incoming" && !item.readAt).length}</span>
                </div>
                <p className="text-xs text-brand-600">{t.conversationRead}</p>
                {loadingMessages ? <p className="ui-state-info mt-0">...</p> : null}
                <div className="grid max-h-[22rem] gap-2 overflow-auto">
                  {!loadingMessages && messages.length === 0 ? <p className="ui-state-info mt-0">{t.noMessages}</p> : null}
                  {messages.map((item) => (
                    <article key={item.id} className={`rounded-2xl border px-3 py-2 text-sm ${item.direction === "incoming" ? "border-brand-100 bg-brand-50/40 text-brand-900" : item.direction === "outgoing" ? "border-emerald-100 bg-emerald-50/70 text-emerald-900" : "border-slate-100 bg-slate-50 text-slate-700"}`}>
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-xs font-semibold uppercase tracking-[0.14em]">{directionLabel(item.direction)}</p>
                        {item.direction === "incoming" && !item.readAt ? <span className="rounded-full bg-brand-700 px-2 py-0.5 text-[10px] font-semibold text-white">{t.unread}</span> : null}
                      </div>
                      <p className="mt-1 whitespace-pre-wrap">{item.text || `[${item.messageType}]`}</p>
                      <p className="mt-2 text-xs opacity-80">{formatDateTime(item.createdAt, locale)}</p>
                    </article>
                  ))}
                </div>
              </div>

              <div className="grid gap-3 rounded-2xl border border-brand-100 bg-white p-4">
                <h3 className="font-semibold text-brand-900">{t.customerActions}</h3>
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
