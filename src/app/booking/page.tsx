import PublicSiteFrame from "@/components/public-site-frame";
import BookingForm from "@/components/booking-form";
import { prisma } from "@/lib/db";
import { pickText, resolveLang } from "@/lib/lang";
import { findLineEntryByToken } from "@/lib/line-customers";

type Props = {
  searchParams: Promise<{
    lang?: string;
    showcaseItemId?: string;
    entry?: string;
  }>;
};

export default async function BookingPage({ searchParams }: Props) {
  const query = await searchParams;
  const lang = resolveLang(query?.lang);
  const entryToken = query?.entry?.trim() || undefined;
  const showcaseItemId = query?.showcaseItemId?.trim();

  const [entryUser, showcaseItem] = await Promise.all([
    entryToken ? findLineEntryByToken(entryToken) : Promise.resolve(null),
    showcaseItemId
      ? prisma.showcaseItem.findFirst({
          where: { id: BigInt(showcaseItemId), isPublished: true },
          include: {
            category: {
              select: { id: true, nameZh: true, nameJa: true }
            },
            servicePackage: {
              select: {
                id: true,
                nameZh: true,
                nameJa: true,
                descZh: true,
                descJa: true,
                priceJpy: true,
                durationMin: true,
                isActive: true
              }
            }
          }
        })
      : Promise.resolve(null)
  ]);

  return (
    <PublicSiteFrame lang={lang} entryToken={entryToken}>
      <main className="mx-auto flex w-full max-w-5xl flex-col gap-4 px-4 py-4 sm:px-6 sm:py-5">
        {!showcaseItem || !showcaseItem.servicePackage.isActive ? (
          <section className="section-panel section-panel-compact">
            <p className="ui-state-error mt-0">
              {pickText(lang, "这个图墙款式暂时不可预约，请返回图墙重新选择。", "このデザインは現在予約できません。ギャラリーに戻って選び直してください。")}
            </p>
          </section>
        ) : (
          <>
            <section className="booking-hero-card">
              <div className="grid gap-4">
                <div className="booking-brand-lockup">
                  <span className="brand-mark">NA</span>
                  <div className="booking-brand-copy">
                    <p className="section-eyebrow">{pickText(lang, "店铺预约", "Salon Booking")}</p>
                    <h1 className="m-0 text-2xl font-semibold tracking-tight text-brand-900 sm:text-3xl">
                      {pickText(lang, "确认款式后，直接选择时间提交预约", "デザインを確認して、そのまま日時を選んで予約")}
                    </h1>
                    <p className="mt-2 text-sm leading-7 text-brand-700">
                      {pickText(
                        lang,
                        "你已经从图墙进入当前款式。选好时间并提交后，店长会继续通过 LINE 回复确认。",
                        "ギャラリーから選んだデザインで予約に進んでいます。日時を送信すると、確認結果は LINE で届きます。"
                      )}
                    </p>
                  </div>
                </div>
                <div className="booking-note-card">
                  <p className="font-medium text-brand-900">
                    {pickText(lang, "当前顾客", "現在の顧客")}: {entryUser?.customer?.name || entryUser?.displayName || "-"}
                  </p>
                </div>
              </div>
              <div className="booking-journey">
                <div className="booking-journey-step">
                  <strong>01</strong>
                  <span>{pickText(lang, "确认款式", "デザイン確認")}</span>
                </div>
                <div className="booking-journey-step">
                  <strong>02</strong>
                  <span>{pickText(lang, "选择时间", "日時選択")}</span>
                </div>
                <div className="booking-journey-step">
                  <strong>03</strong>
                  <span>{pickText(lang, "提交预约", "予約送信")}</span>
                </div>
                <div className="booking-journey-step">
                  <strong>04</strong>
                  <span>{pickText(lang, "LINE 确认", "LINE 確認")}</span>
                </div>
              </div>
            </section>

            <BookingForm
              lang={lang}
              entryToken={entryToken}
              showcaseItem={{
                id: showcaseItem.id.toString(),
                titleZh: showcaseItem.titleZh,
                titleJa: showcaseItem.titleJa,
                descriptionZh: showcaseItem.descriptionZh,
                descriptionJa: showcaseItem.descriptionJa,
                imageUrl: showcaseItem.imageUrl,
                categoryNameZh: showcaseItem.category.nameZh,
                categoryNameJa: showcaseItem.category.nameJa,
                packageNameZh: showcaseItem.servicePackage.nameZh,
                packageNameJa: showcaseItem.servicePackage.nameJa,
                packageDescriptionZh: showcaseItem.servicePackage.descZh,
                packageDescriptionJa: showcaseItem.servicePackage.descJa,
                priceJpy: showcaseItem.servicePackage.priceJpy,
                durationMin: showcaseItem.servicePackage.durationMin
              }}
              customerName={entryUser?.customer?.name || entryUser?.displayName || null}
            />
          </>
        )}
      </main>
    </PublicSiteFrame>
  );
}
