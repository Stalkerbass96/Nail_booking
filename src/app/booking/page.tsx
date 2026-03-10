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
        )}
      </main>
    </PublicSiteFrame>
  );
}
