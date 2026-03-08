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
      <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-6 sm:px-6 sm:py-10">
        <section className="section-panel">
          <p className="section-eyebrow">Reserve From Showcase</p>
          <h1 className="section-title">{pickText(lang, "\u786e\u8ba4\u65f6\u95f4\u548c\u5907\u6ce8\uff0c\u63d0\u4ea4\u7ed9\u5e97\u957f\u786e\u8ba4\u3002", "\u6642\u9593\u3068\u8981\u671b\u3092\u78ba\u8a8d\u3057\u3066\u3001\u5e97\u9577\u78ba\u8a8d\u5f85\u3061\u306e\u4e88\u7d04\u3092\u9001\u4fe1\u3002")}</h1>
          <p className="section-copy">
            {pickText(lang, "\u8fd9\u4e2a\u9875\u9762\u4f1a\u56fa\u5b9a\u4f7f\u7528\u4f60\u4ece\u56fe\u5899\u70b9\u51fb\u8fdb\u5165\u7684\u5957\u9910\uff0c\u4e0d\u5141\u8bb8\u5728\u8fd9\u91cc\u5207\u6362\u5957\u9910\u3002", "\u3053\u306e\u753b\u9762\u3067\u306f\u30ae\u30e3\u30e9\u30ea\u30fc\u304b\u3089\u9078\u3093\u3060\u30e1\u30cb\u30e5\u30fc\u304c\u56fa\u5b9a\u3055\u308c\u3001\u3053\u3053\u3067\u5225\u30e1\u30cb\u30e5\u30fc\u3078\u5909\u66f4\u306f\u3067\u304d\u307e\u305b\u3093\u3002")}
          </p>
        </section>

        {!showcaseItem || !showcaseItem.servicePackage.isActive ? (
          <section className="section-panel">
            <p className="ui-state-error mt-0">{pickText(lang, "\u56fe\u5899\u9879\u4e0d\u5b58\u5728\u6216\u5df2\u4e0b\u67b6\uff0c\u8bf7\u8fd4\u56de\u9996\u9875\u91cd\u65b0\u9009\u62e9\u3002", "\u30ae\u30e3\u30e9\u30ea\u30fc\u9805\u76ee\u304c\u5b58\u5728\u3057\u306a\u3044\u304b\u975e\u516c\u958b\u3067\u3059\u3002\u30db\u30fc\u30e0\u306b\u623b\u3063\u3066\u9078\u3073\u76f4\u3057\u3066\u304f\u3060\u3055\u3044\u3002")}</p>
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
