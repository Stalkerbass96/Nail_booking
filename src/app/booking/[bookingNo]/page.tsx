import Link from "next/link";
import PublicSiteFrame from "@/components/public-site-frame";
import { prisma } from "@/lib/db";
import { pickText, resolveLang } from "@/lib/lang";

type Props = {
  params: Promise<{ bookingNo: string }>;
  searchParams: Promise<{ lang?: string; entry?: string }>;
};

const STATUS_TEXT = {
  zh: {
    pending: "待确认",
    confirmed: "已确认",
    completed: "已完成",
    canceled: "已取消"
  },
  ja: {
    pending: "確認待ち",
    confirmed: "確認済み",
    completed: "完了",
    canceled: "キャンセル"
  }
} as const;

export default async function PublicBookingDetailPage({ params, searchParams }: Props) {
  const [{ bookingNo }, query] = await Promise.all([params, searchParams]);
  const lang = resolveLang(query?.lang);
  const entryToken = query?.entry?.trim() || undefined;

  const appointment = await prisma.appointment.findUnique({
    where: { bookingNo },
    include: {
      customer: {
        select: { name: true }
      },
      servicePackage: {
        select: { nameZh: true, nameJa: true, priceJpy: true, durationMin: true }
      },
      showcaseItem: {
        select: { titleZh: true, titleJa: true, imageUrl: true }
      }
    }
  });

  const galleryHref = `/?lang=${lang}${entryToken ? `&entry=${entryToken}` : ""}`;
  const servicesHref = `/services?lang=${lang}${entryToken ? `&entry=${entryToken}` : ""}`;

  return (
    <PublicSiteFrame lang={lang} entryToken={entryToken}>
      <main className="mx-auto flex w-full max-w-4xl flex-col gap-4 px-4 py-4 sm:px-6 sm:py-5">
        {!appointment ? (
          <section className="section-panel section-panel-compact">
            <p className="ui-state-error mt-0">
              {pickText(lang, "没有找到这笔预约，请返回图墙重新选择。", "この予約は見つかりません。ギャラリーに戻って確認してください。")}
            </p>
            <div className="mt-4">
              <Link className="ui-btn-primary" href={galleryHref}>
                {pickText(lang, "返回图墙", "ギャラリーに戻る")}
              </Link>
            </div>
          </section>
        ) : (
          <>
            <section className="success-panel success-panel-lite">
              <div className="success-badge">{STATUS_TEXT[lang][appointment.status]}</div>
              <h1 className="text-2xl font-semibold tracking-tight text-brand-900 sm:text-3xl">
                {pickText(lang, "预约详情", "予約詳細")}
              </h1>
              <div className="success-ticket success-ticket-lite mt-4">
                <span>{pickText(lang, "预约号", "予約番号")}</span>
                <strong>{appointment.bookingNo}</strong>
              </div>
            </section>

            <section className="booking-detail-layout">
              <div className="booking-detail-card">
                <div
                  className="booking-detail-media"
                  style={
                    appointment.showcaseItem?.imageUrl
                      ? {
                          backgroundImage: `linear-gradient(180deg, rgba(47,29,39,0.08), rgba(47,29,39,0.22)), url(${appointment.showcaseItem.imageUrl})`
                        }
                      : undefined
                  }
                />
                <div className="booking-detail-copy">
                  <p className="text-sm font-semibold text-brand-900">
                    {appointment.showcaseItem
                      ? lang === "ja"
                        ? appointment.showcaseItem.titleJa
                        : appointment.showcaseItem.titleZh
                      : pickText(lang, "预约款式", "予約デザイン")}
                  </p>
                  <div className="mt-3 grid gap-2 text-sm text-brand-700">
                    <p>{pickText(lang, "顾客", "顧客")}: {appointment.customer.name}</p>
                    <p>{pickText(lang, "套餐", "メニュー")}: {lang === "ja" ? appointment.servicePackage.nameJa : appointment.servicePackage.nameZh}</p>
                    <p>
                      {pickText(lang, "到店时间", "来店時間")}: {new Intl.DateTimeFormat(lang === "ja" ? "ja-JP" : "zh-CN", {
                        dateStyle: "medium",
                        timeStyle: "short",
                        timeZone: "Asia/Tokyo"
                      }).format(appointment.startAt)}
                    </p>
                    <p>{pickText(lang, "时长", "所要時間")}: {appointment.servicePackage.durationMin} min</p>
                    <p>{pickText(lang, "价格", "価格")}: {appointment.servicePackage.priceJpy} JPY</p>
                    <p>{pickText(lang, "备注", "メモ")}: {appointment.customerNote || "-"}</p>
                  </div>
                </div>
              </div>

              <aside className="booking-summary-card booking-summary-card-compact booking-summary-lite">
                <p className="section-eyebrow">{pickText(lang, "状态说明", "ステータス")}</p>
                <h2 className="mt-2 text-xl font-semibold text-brand-900">{STATUS_TEXT[lang][appointment.status]}</h2>
                <p className="mt-3 text-sm leading-7 text-brand-700">
                  {appointment.status === "pending"
                    ? pickText(lang, "店长正在确认这个时间，确认后会继续通过 LINE 回复你。", "現在は店側で確認中です。確定後は LINE でお知らせします。")
                    : appointment.status === "confirmed"
                      ? pickText(lang, "预约已经确认，后续如果需要沟通细节，店长会通过 LINE 联系你。", "予約は確定しています。詳細確認が必要な場合は LINE でご連絡します。")
                      : appointment.status === "completed"
                        ? pickText(lang, "这笔预约已经完成，欢迎继续回到图墙挑选下一次款式。", "この予約は完了しています。次回のデザイン選びはギャラリーからどうぞ。")
                        : pickText(lang, "这笔预约已取消，如需重新预约，请回到图墙重新选择。", "この予約はキャンセルされています。再予約する場合はギャラリーから選び直してください。")}
                </p>
                <div className="mt-5 grid gap-2">
                  <Link className="ui-btn-primary w-full" href={galleryHref}>
                    {pickText(lang, "继续看图墙", "ギャラリーに戻る")}
                  </Link>
                  <Link className="ui-btn-secondary w-full" href={servicesHref}>
                    {pickText(lang, "查看套餐", "メニューを見る")}
                  </Link>
                </div>
              </aside>
            </section>
          </>
        )}
      </main>
    </PublicSiteFrame>
  );
}
