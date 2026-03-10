import Link from "next/link";
import { AppointmentStatus } from "@prisma/client";
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
    pending: "未確認",
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
  const menuHref = `/services?lang=${lang}`;

  return (
    <PublicSiteFrame lang={lang} entryToken={entryToken}>
      <main className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 py-6 sm:px-6 sm:py-10">
        {!appointment ? (
          <section className="section-panel section-panel-compact">
            <p className="ui-state-error mt-0">
              {pickText(lang, "没有找到对应预约。", "該当する予約が見つかりません。")}
            </p>
            <div className="admin-inline-actions mt-5">
              <Link className="ui-btn-primary" href={galleryHref}>
                {pickText(lang, "返回图墙", "ギャラリーに戻る")}
              </Link>
            </div>
          </section>
        ) : (
          <>
            <section className="success-panel">
              <div className="success-badge">{STATUS_TEXT[lang][appointment.status]}</div>
              <h1 className="section-title">{pickText(lang, "预约详情", "予約詳細")}</h1>
              <p className="section-copy mt-3 max-w-2xl">
                {pickText(
                  lang,
                  "这是一条可公开打开的预约详情链接。状态变化后，店长也会继续通过 LINE 通知你。",
                  "この予約詳細リンクはそのまま確認用に使えます。状態が変わると、LINE にも通知が届きます。"
                )}
              </p>
              <div className="success-ticket">
                <span>{pickText(lang, "预约号", "予約番号")}</span>
                <strong>{appointment.bookingNo}</strong>
              </div>
            </section>

            <section className="detail-hero-panel detail-hero-panel-compact">
              <div
                className="detail-hero-media min-h-[17rem]"
                style={
                  appointment.showcaseItem?.imageUrl
                    ? {
                        backgroundImage: `linear-gradient(180deg, rgba(47,29,39,0.08), rgba(47,29,39,0.26)), url(${appointment.showcaseItem.imageUrl})`
                      }
                    : undefined
                }
              >
                <span>
                  {appointment.showcaseItem
                    ? lang === "ja"
                      ? appointment.showcaseItem.titleJa
                      : appointment.showcaseItem.titleZh
                    : pickText(lang, "预约记录", "予約記録")}
                </span>
              </div>

              <div className="grid gap-4">
                <div>
                  <p className="section-eyebrow">{pickText(lang, "当前状态", "現在の状態")}</p>
                  <h2 className="text-3xl font-semibold text-brand-900">{STATUS_TEXT[lang][appointment.status]}</h2>
                </div>

                <div className="compact-info-card">
                  <div className="summary-row">
                    <dt>{pickText(lang, "顾客", "お客様")}</dt>
                    <dd>{appointment.customer.name}</dd>
                  </div>
                  <div className="summary-row">
                    <dt>{pickText(lang, "套餐", "メニュー")}</dt>
                    <dd>{lang === "ja" ? appointment.servicePackage.nameJa : appointment.servicePackage.nameZh}</dd>
                  </div>
                  <div className="summary-row">
                    <dt>{pickText(lang, "到店时间", "来店時間")}</dt>
                    <dd>
                      {new Intl.DateTimeFormat(lang === "ja" ? "ja-JP" : "zh-CN", {
                        dateStyle: "medium",
                        timeStyle: "short"
                      }).format(appointment.startAt)}
                    </dd>
                  </div>
                  <div className="summary-row">
                    <dt>{pickText(lang, "预计时长", "所要時間")}</dt>
                    <dd>{appointment.servicePackage.durationMin} min</dd>
                  </div>
                  <div className="summary-row">
                    <dt>{pickText(lang, "价格参考", "価格目安")}</dt>
                    <dd>{appointment.servicePackage.priceJpy} JPY</dd>
                  </div>
                  <div className="summary-row">
                    <dt>{pickText(lang, "备注", "メモ")}</dt>
                    <dd>{appointment.customerNote || "-"}</dd>
                  </div>
                </div>
              </div>
            </section>

            <section className="section-panel section-panel-compact">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="showcase-card">
                  <strong>{pickText(lang, "确认前", "確認前")}</strong>
                  <p>
                    {pickText(
                      lang,
                      "如果当前状态仍是待确认，表示店长还在处理这笔预约，时间会继续为你保留。",
                      "未確認の表示中は、店舗側で内容を確認しています。時間枠はそのまま確保されています。"
                    )}
                  </p>
                </div>
                <div className="showcase-card">
                  <strong>{pickText(lang, "后续通知", "今後の通知")}</strong>
                  <p>
                    {pickText(
                      lang,
                      "确认、取消或后续沟通都会优先通过 LINE 发送给你。",
                      "確定・キャンセル・追加確認は、主に LINE でお知らせします。"
                    )}
                  </p>
                </div>
              </div>
            </section>

            <div className="admin-inline-actions">
              <Link className="ui-btn-primary" href={galleryHref}>
                {pickText(lang, "继续查看图墙", "ギャラリーを続けて見る")}
              </Link>
              <Link className="ui-btn-secondary" href={menuHref}>
                {pickText(lang, "查看套餐", "メニューを見る")}
              </Link>
            </div>
          </>
        )}
      </main>
    </PublicSiteFrame>
  );
}
