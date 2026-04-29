import { AppointmentStatus, LineMessageDirection } from "@prisma/client";
import Link from "next/link";
import AdminNav from "@/components/admin-nav";
import AdminCalendarPanel from "@/components/admin-calendar-panel";
import { prisma } from "@/lib/db";
import { getLineConfig } from "@/lib/line";
import { resolveLang } from "@/lib/lang";
import {
  buildDateTimeWithOffset,
  formatDateTimeInOffset,
  formatTimeInOffset,
  formatYmdInOffset
} from "@/lib/booking-rules";
import { getBusinessWindowByDate } from "@/lib/business-hours";

type Props = {
  searchParams: Promise<{ lang?: string }>;
};

const TEXT = {
  zh: {
    title: "店长运营总览",
    desc: "集中查看今日预约、营业安排、预约封锁和 LINE 运营状态，方便你快速处理每天的核心事务。",
    stats: {
      today: "今日预约",
      pending: "待确认",
      customers: "顾客总数",
      lineLinked: "已绑 LINE",
      incoming7d: "近 7 天消息",
      menus: "在售套餐"
    },
    quickTitle: "快捷入口",
    quickDesc: "从这里进入最常用的后台页面，先处理预约，再调整排班和 LINE 客户沟通。",
    quickActions: [
      { href: "/admin/appointments", label: "预约管理", tone: "primary" },
      { href: "/admin/schedule", label: "营业排班", tone: "secondary" },
      { href: "/admin/line", label: "LINE 会话", tone: "secondary" },
      { href: "/admin/customers", label: "顾客档案", tone: "secondary" },
      { href: "/admin/settings", label: "系统设置", tone: "secondary" }
    ],
    sections: {
      nextBooking: "下一笔预约",
      todayHours: "今日营业时间",
      nextBlock: "下一段封锁",
      lineConfig: "LINE 配置",
      noBooking: "当前没有即将开始的预约。",
      noBlock: "当前没有未来封锁区间。",
      open: "营业中",
      closed: "休息",
      sourceWeekly: "来自每周常规排班",
      sourceSpecial: "来自单日特殊营业设置",
      pendingCutoff: "待确认",
      confirmed: "已确认",
      lineReady: "LINE Webhook 与推送配置已就绪。",
      lineMissing: "LINE 配置未完成，消息推送和绑定功能暂时不可用。",
      appBaseReady: "公开访问地址已配置。",
      appBaseMissing: "APP_BASE_URL 未配置，LINE 自助绑定链接无法生成。",
      goLine: "前往 LINE 管理",
      goSchedule: "前往排班管理",
      customer: "顾客",
      package: "套餐",
      time: "时间",
      reason: "原因",
      none: "无"
    }
  },
  ja: {
    title: "店舗運営ダッシュボード",
    desc: "本日の予約、営業時間、予約ブロック、LINE 運用状況をまとめて確認し、毎日の対応をすばやく進められます。",
    stats: {
      today: "本日の予約",
      pending: "未確認",
      customers: "顧客数",
      lineLinked: "LINE 連携済み",
      incoming7d: "直近 7 日の受信",
      menus: "販売中メニュー"
    },
    quickTitle: "クイック操作",
    quickDesc: "よく使う管理画面にすぐ移動できます。まず予約対応、その後にシフトや LINE 連絡を調整する想定です。",
    quickActions: [
      { href: "/admin/appointments", label: "予約管理", tone: "primary" },
      { href: "/admin/schedule", label: "営業スケジュール", tone: "secondary" },
      { href: "/admin/line", label: "LINE 会話", tone: "secondary" },
      { href: "/admin/customers", label: "顧客管理", tone: "secondary" },
      { href: "/admin/settings", label: "システム設定", tone: "secondary" }
    ],
    sections: {
      nextBooking: "次の予約",
      todayHours: "本日の営業時間",
      nextBlock: "次のブロック枠",
      lineConfig: "LINE 設定",
      noBooking: "これから開始する予約はありません。",
      noBlock: "今後のブロック枠はありません。",
      open: "営業中",
      closed: "休業",
      sourceWeekly: "週間営業時間から適用",
      sourceSpecial: "特別営業日設定から適用",
      pendingCutoff: "未確認",
      confirmed: "確定済み",
      lineReady: "LINE Webhook と送信設定は有効です。",
      lineMissing: "LINE 設定が未完了のため、メッセージ送信と連携機能は使えません。",
      appBaseReady: "公開 URL は設定済みです。",
      appBaseMissing: "APP_BASE_URL が未設定のため、LINE 連携リンクを生成できません。",
      goLine: "LINE 管理へ",
      goSchedule: "スケジュール管理へ",
      customer: "顧客",
      package: "メニュー",
      time: "時間",
      reason: "理由",
      none: "なし"
    }
  }
} as const;

function formatDateTime(value: Date | null, locale: string) {
  if (!value) return "-";
  return formatDateTimeInOffset(value, locale);
}

function formatTimeRange(openAt?: Date, closeAt?: Date) {
  if (!openAt || !closeAt) return "-";
  return `${formatTimeInOffset(openAt)} - ${formatTimeInOffset(closeAt)}`;
}

export default async function AdminHomePage({ searchParams }: Props) {
  const query = await searchParams;
  const lang = resolveLang(query?.lang);
  const t = TEXT[lang];
  const locale = lang === "ja" ? "ja-JP" : "zh-CN";
  const now = new Date();
  const todayYmd = formatYmdInOffset(now);
  const todayStart = buildDateTimeWithOffset(todayYmd, "00:00");
  const tomorrowStart = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const lineConfig = getLineConfig();

  const [todayWindow, todayCount, pendingCount, customerCount, lineLinkedCount, incoming7dCount, menuCount, nextBooking, nextBlock] =
    await Promise.all([
      getBusinessWindowByDate(prisma, todayYmd),
      prisma.appointment.count({
        where: {
          startAt: { gte: todayStart, lt: tomorrowStart },
          status: { in: [AppointmentStatus.pending, AppointmentStatus.confirmed, AppointmentStatus.completed] }
        }
      }),
      prisma.appointment.count({ where: { status: AppointmentStatus.pending } }),
      prisma.customer.count(),
      prisma.lineUser.count({ where: { customerId: { not: null } } }),
      prisma.lineMessage.count({
        where: {
          direction: LineMessageDirection.incoming,
          createdAt: { gte: sevenDaysAgo }
        }
      }),
      prisma.servicePackage.count({ where: { isActive: true } }),
      prisma.appointment.findFirst({
        where: {
          startAt: { gte: now },
          status: { in: [AppointmentStatus.pending, AppointmentStatus.confirmed] }
        },
        orderBy: { startAt: "asc" },
        include: {
          customer: { select: { name: true, email: true } },
          servicePackage: { select: { nameZh: true, nameJa: true } }
        }
      }),
      prisma.bookingBlock.findFirst({
        where: { endAt: { gte: now } },
        orderBy: { startAt: "asc" }
      })
    ]);

  const statCards = [
    { label: t.stats.today, value: todayCount },
    { label: t.stats.pending, value: pendingCount },
    { label: t.stats.customers, value: customerCount },
    { label: t.stats.lineLinked, value: lineLinkedCount },
    { label: t.stats.incoming7d, value: incoming7dCount },
    { label: t.stats.menus, value: menuCount }
  ];

  return (
    <main className="mx-auto w-full max-w-6xl px-4 pb-8 sm:px-6 sm:pb-10">
      <AdminNav lang={lang} />

      <section className="grid gap-5 pb-5" style={{ borderBottom: "1px solid var(--border)" }}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl" style={{ color: "var(--text)" }}>{t.title}</h1>
          <div className="flex flex-wrap gap-2">
            {t.quickActions.map((item) => (
              <Link
                key={item.href}
                href={`${item.href}?lang=${lang}`}
                className={item.tone === "primary" ? "ui-btn-primary" : "ui-btn-secondary"}
                style={{ minHeight: 36, padding: "0 14px", fontSize: 13 }}
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {statCards.map((item) => (
            <article
              key={item.label}
              className="rounded-xl p-4"
              style={{ border: "1px solid var(--border)", background: "var(--surface)" }}
            >
              <p className="text-xs font-medium" style={{ color: "var(--text-3)" }}>{item.label}</p>
              <strong className="mt-2 block text-3xl font-semibold" style={{ color: "var(--text)" }}>{item.value}</strong>
            </article>
          ))}
        </div>
      </section>

      <section className="mt-5 grid gap-4 xl:grid-cols-2">
        <article className="section-panel section-panel-compact grid gap-3">
          <div className="flex items-center justify-between gap-3">
            <h2 className="admin-section-title">{t.sections.nextBooking}</h2>
            <span className="metric-pill">{pendingCount} {t.stats.pending}</span>
          </div>
          {nextBooking ? (
            <div className="grid gap-3 rounded-xl p-3" style={{ border: "1px solid var(--border)", background: "var(--bg)" }}>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <p className="section-eyebrow">{t.sections.customer}</p>
                  <p className="mt-1.5 font-semibold" style={{ color: "var(--text)" }}>{nextBooking.customer.name}</p>
                  <p className="text-sm" style={{ color: "var(--text-3)" }}>{nextBooking.customer.email}</p>
                </div>
                <div>
                  <p className="section-eyebrow">{t.sections.package}</p>
                  <p className="mt-1.5 font-semibold" style={{ color: "var(--text)" }}>
                    {lang === "ja" ? nextBooking.servicePackage.nameJa : nextBooking.servicePackage.nameZh}
                  </p>
                  <p className="text-sm" style={{ color: "var(--text-3)" }}>
                    {nextBooking.status === AppointmentStatus.pending ? t.sections.pendingCutoff : t.sections.confirmed}
                  </p>
                </div>
              </div>
              <div className="rounded-lg px-3 py-2.5" style={{ border: "1px solid var(--border)", background: "var(--surface)" }}>
                <p className="section-eyebrow">{t.sections.time}</p>
                <p className="mt-1 text-base font-semibold" style={{ color: "var(--text)" }}>{formatDateTime(nextBooking.startAt, locale)}</p>
              </div>
              <Link href={`/admin/appointments?lang=${lang}`} className="ui-btn-secondary">
                {t.quickActions[0].label}
              </Link>
            </div>
          ) : (
            <p className="ui-state-info mt-0">{t.sections.noBooking}</p>
          )}
        </article>

        <article className="section-panel section-panel-compact grid gap-3">
          <div className="flex items-center justify-between gap-3">
            <h2 className="admin-section-title">{t.sections.todayHours}</h2>
            <span className="metric-pill" style={todayWindow.isOpen ? {} : { color: "var(--text-3)" }}>
              {todayWindow.isOpen ? t.sections.open : t.sections.closed}
            </span>
          </div>
          <div className="grid gap-3 rounded-xl p-3" style={{ border: "1px solid var(--border)", background: "var(--bg)" }}>
            <div className="rounded-lg px-3 py-2.5" style={{ border: "1px solid var(--border)", background: "var(--surface)" }}>
              <p className="section-eyebrow">{todayYmd}</p>
              <p className="mt-1 text-xl font-semibold" style={{ color: "var(--text)" }}>{formatTimeRange(todayWindow.openAt, todayWindow.closeAt)}</p>
              <p className="mt-1 text-sm" style={{ color: "var(--text-3)" }}>
                {todayWindow.source === "special" ? t.sections.sourceSpecial : t.sections.sourceWeekly}
              </p>
            </div>
            <Link href={`/admin/schedule?lang=${lang}`} className="ui-btn-secondary">
              {t.sections.goSchedule}
            </Link>
          </div>
        </article>

        <article className="section-panel section-panel-compact grid gap-3">
          <div className="flex items-center justify-between gap-3">
            <h2 className="admin-section-title">{t.sections.nextBlock}</h2>
            <Link href={`/admin/schedule?lang=${lang}`} className="text-sm font-medium no-underline" style={{ color: "var(--text-3)" }}>
              {t.sections.goSchedule}
            </Link>
          </div>
          {nextBlock ? (
            <div className="grid gap-3 rounded-xl p-3" style={{ border: "1px solid var(--border)", background: "var(--bg)" }}>
              <div>
                <p className="section-eyebrow">{t.sections.time}</p>
                <p className="mt-1.5 font-semibold" style={{ color: "var(--text)" }}>{formatDateTime(nextBlock.startAt, locale)}</p>
                <p className="text-sm" style={{ color: "var(--text-3)" }}>{formatDateTime(nextBlock.endAt, locale)}</p>
              </div>
              <div className="rounded-lg px-3 py-2.5" style={{ border: "1px solid var(--border)", background: "var(--surface)" }}>
                <p className="section-eyebrow">{t.sections.reason}</p>
                <p className="mt-1 text-sm" style={{ color: "var(--text-2)" }}>{nextBlock.reason || t.sections.none}</p>
              </div>
            </div>
          ) : (
            <p className="ui-state-info mt-0">{t.sections.noBlock}</p>
          )}
        </article>

        <article className="section-panel section-panel-compact grid gap-3">
          <div className="flex items-center justify-between gap-3">
            <h2 className="admin-section-title">{t.sections.lineConfig}</h2>
            <Link href={`/admin/line?lang=${lang}`} className="text-sm font-medium no-underline" style={{ color: "var(--text-3)" }}>
              {t.sections.goLine}
            </Link>
          </div>
          <div className="grid gap-2">
            <div className="rounded-lg px-3 py-2.5 text-sm font-medium" style={lineConfig.enabled
              ? { border: "1px solid var(--ok-border)", background: "var(--ok-bg)", color: "var(--ok-text)" }
              : { border: "1px solid var(--err-border)", background: "var(--err-bg)", color: "var(--err-text)" }}>
              {lineConfig.enabled ? t.sections.lineReady : t.sections.lineMissing}
            </div>
            <div className="rounded-lg px-3 py-2.5 text-sm font-medium" style={lineConfig.appBaseUrl
              ? { border: "1px solid var(--border)", background: "var(--surface)", color: "var(--text-2)" }
              : { border: "1px solid var(--err-border)", background: "var(--err-bg)", color: "var(--err-text)" }}>
              {lineConfig.appBaseUrl ? t.sections.appBaseReady : t.sections.appBaseMissing}
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              <div className="rounded-lg px-3 py-2.5" style={{ border: "1px solid var(--border)", background: "var(--surface)" }}>
                <p className="section-eyebrow">Webhook</p>
                <p className="mt-1 text-sm" style={{ color: "var(--text-2)" }}>/api/line/webhook</p>
              </div>
              <div className="rounded-lg px-3 py-2.5" style={{ border: "1px solid var(--border)", background: "var(--surface)" }}>
                <p className="section-eyebrow">APP_BASE_URL</p>
                <p className="mt-1 truncate text-sm" style={{ color: "var(--text-2)" }}>{lineConfig.appBaseUrl || "-"}</p>
              </div>
            </div>
          </div>
        </article>
      </section>

      <section className="mt-5">
        <AdminCalendarPanel lang={lang} />
      </section>
    </main>
  );
}
