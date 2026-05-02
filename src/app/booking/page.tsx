import PublicSiteFrame from "@/components/public-site-frame";
import BookingForm from "@/components/booking-form";
import { prisma } from "@/lib/db";
import { resolveLang } from "@/lib/lang";
import { findLineEntryByToken } from "@/lib/line-customers";

type Props = {
  searchParams: Promise<{
    lang?: string;
    showcaseItemId?: string;
    packageId?: string;
    entry?: string;
  }>;
};

export default async function BookingPage({ searchParams }: Props) {
  const query = await searchParams;
  const lang = resolveLang(query?.lang);
  const entryToken = query?.entry?.trim() || undefined;
  const showcaseItemId = query?.showcaseItemId?.trim();
  const packageId = query?.packageId?.trim();

  const [entryUser, showcaseItem, packageItem] = await Promise.all([
    entryToken ? findLineEntryByToken(entryToken) : Promise.resolve(null),

    showcaseItemId
      ? prisma.showcaseItem.findFirst({
          where: { id: BigInt(showcaseItemId), isPublished: true },
          include: {
            category: { select: { id: true, nameZh: true, nameJa: true } },
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
            },
            addonLinks: {
              include: {
                addon: { select: { priceJpy: true, durationIncreaseMin: true, isActive: true } }
              }
            }
          }
        })
      : Promise.resolve(null),

    packageId && !showcaseItemId
      ? prisma.servicePackage.findFirst({
          where: { id: BigInt(packageId), isActive: true },
          include: {
            category: { select: { nameZh: true, nameJa: true } },
            addonLinks: {
              where: { addon: { isActive: true } },
              include: {
                addon: {
                  select: {
                    id: true,
                    nameZh: true,
                    nameJa: true,
                    descZh: true,
                    descJa: true,
                    priceJpy: true,
                    durationIncreaseMin: true,
                    maxQty: true
                  }
                }
              },
              orderBy: { id: "asc" }
            }
          }
        })
      : Promise.resolve(null)
  ]);

  const customerName = entryUser?.customer?.name || entryUser?.displayName || null;

  const unavailable = (
    <section className="section-panel section-panel-compact">
      <p className="ui-state-error mt-0">
        {lang === "ja"
          ? "このメニューは現在ご利用いただけません。ギャラリーに戻って別のデザインをお選びください。"
          : "所选套餐暂不可用，请返回图墙选择其他款式。"}
      </p>
    </section>
  );

  return (
    <PublicSiteFrame lang={lang} entryToken={entryToken} minimalHeader>
      <main className="mx-auto flex w-full max-w-5xl flex-col gap-4 overflow-x-hidden px-4 py-4 sm:px-6 sm:py-5">

        {/* ── Showcase mode ── */}
        {showcaseItemId && (
          !showcaseItem || !showcaseItem.servicePackage.isActive
            ? unavailable
            : (
              (() => {
                const activeAddonLinks = showcaseItem.addonLinks.filter((l) => l.addon.isActive);
                const addonPrice = activeAddonLinks.reduce((s, l) => s + l.addon.priceJpy * l.qty, 0);
                const addonDuration = activeAddonLinks.reduce((s, l) => s + l.addon.durationIncreaseMin * l.qty, 0);
                return (
                  <BookingForm
                    lang={lang}
                    entryToken={entryToken}
                    customerName={customerName}
                    mode="showcase"
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
                      priceJpy: showcaseItem.servicePackage.priceJpy + addonPrice,
                      durationMin: showcaseItem.servicePackage.durationMin + addonDuration
                    }}
                  />
                );
              })()
            )
        )}

        {/* ── Package mode ── */}
        {packageId && !showcaseItemId && (
          !packageItem
            ? unavailable
            : (
              <BookingForm
                lang={lang}
                entryToken={entryToken}
                customerName={customerName}
                mode="package"
                pkg={{
                  id: packageItem.id.toString(),
                  nameZh: packageItem.nameZh,
                  nameJa: packageItem.nameJa,
                  descZh: packageItem.descZh,
                  descJa: packageItem.descJa,
                  priceJpy: packageItem.priceJpy,
                  durationMin: packageItem.durationMin,
                  categoryNameZh: packageItem.category.nameZh,
                  categoryNameJa: packageItem.category.nameJa
                }}
                availableAddons={packageItem.addonLinks.map((l) => ({
                  id: l.addon.id.toString(),
                  nameZh: l.addon.nameZh,
                  nameJa: l.addon.nameJa,
                  descZh: l.addon.descZh,
                  descJa: l.addon.descJa,
                  priceJpy: l.addon.priceJpy,
                  durationIncreaseMin: l.addon.durationIncreaseMin,
                  maxQty: l.addon.maxQty
                }))}
              />
            )
        )}

        {/* ── Neither param provided ── */}
        {!showcaseItemId && !packageId && unavailable}

      </main>
    </PublicSiteFrame>
  );
}
