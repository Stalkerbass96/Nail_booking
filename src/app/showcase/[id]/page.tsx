import Link from "next/link";
import { notFound } from "next/navigation";
import PublicSiteFrame from "@/components/public-site-frame";
import { prisma } from "@/lib/db";
import { resolveLang } from "@/lib/lang";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ lang?: string; entry?: string }>;
};

const TEXT = {
  zh: {
    back: "← 返回图墙",
    package: "套餐",
    category: "分类",
    duration: "时长",
    addons: "已含加项",
    addonDuration: "分钟",
    book: "预约此款设计",
    min: "分钟",
    plus: "+",
    qty: "×",
    totalPrice: "总价",
    totalDuration: "时长"
  },
  ja: {
    back: "← ギャラリーに戻る",
    package: "メニュー",
    category: "カテゴリ",
    duration: "所要時間",
    addons: "含まれるオプション",
    addonDuration: "分",
    book: "このデザインを予約",
    min: "分",
    plus: "+",
    qty: "×",
    totalPrice: "合計金額",
    totalDuration: "所要時間"
  }
} as const;

export default async function ShowcaseDetailPage({ params, searchParams }: Props) {
  const { id } = await params;
  const query = await searchParams;
  const lang = resolveLang(query?.lang);
  const entryToken = query?.entry?.trim() || undefined;
  const t = TEXT[lang];

  let itemId: bigint;
  try {
    itemId = BigInt(id);
  } catch {
    notFound();
  }

  const item = await prisma.showcaseItem.findFirst({
    where: { id: itemId, isPublished: true },
    include: {
      category: { select: { nameZh: true, nameJa: true } },
      servicePackage: {
        select: {
          isActive: true,
          nameZh: true,
          nameJa: true,
          descZh: true,
          descJa: true,
          priceJpy: true,
          durationMin: true
        }
      },
      addonLinks: {
        include: {
          addon: {
            select: {
              id: true,
              nameZh: true,
              nameJa: true,
              descZh: true,
              descJa: true,
              priceJpy: true,
              durationIncreaseMin: true
            }
          }
        },
        orderBy: { id: "asc" }
      }
    }
  });

  if (!item || !item.servicePackage.isActive) {
    notFound();
  }

  const pkg = item.servicePackage;
  // Fixed add-ons set by admin for this showcase item
  const fixedAddons = item.addonLinks;
  const totalAddonPrice = fixedAddons.reduce((s, l) => s + l.addon.priceJpy * l.qty, 0);
  const totalAddonDuration = fixedAddons.reduce((s, l) => s + l.addon.durationIncreaseMin * l.qty, 0);
  const totalPrice = Number(pkg.priceJpy) + totalAddonPrice;
  const totalDuration = pkg.durationMin + totalAddonDuration;

  const categoryName = lang === "ja" ? item.category.nameJa : item.category.nameZh;
  const pkgName = lang === "ja" ? pkg.nameJa : pkg.nameZh;
  const pkgDesc = lang === "ja" ? pkg.descJa : pkg.descZh;
  const itemTitle = lang === "ja" ? item.titleJa : item.titleZh;
  const itemDesc = lang === "ja" ? item.descriptionJa : item.descriptionZh;

  const galleryParams = new URLSearchParams({ lang });
  if (entryToken) galleryParams.set("entry", entryToken);

  const bookingParams = new URLSearchParams({ showcaseItemId: id, lang });
  if (entryToken) bookingParams.set("entry", entryToken);

  return (
    <PublicSiteFrame lang={lang} entryToken={entryToken}>
      <main className="mx-auto flex w-full max-w-3xl flex-col gap-5 px-4 py-4 sm:px-6 sm:py-5">

        <Link
          href={`/?${galleryParams}`}
          className="text-sm no-underline"
          style={{ color: "var(--text-3)" }}
        >
          {t.back}
        </Link>

        {/* Hero image */}
        <div
          style={{
            width: "100%",
            aspectRatio: "4 / 3",
            backgroundImage: `url(${item.imageUrl})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            borderRadius: 16,
            border: "1px solid var(--border)"
          }}
        />

        {/* Title */}
        <div>
          <p className="section-eyebrow">{categoryName}</p>
          <h1 className="mt-1 text-xl font-semibold" style={{ color: "var(--text)" }}>
            {itemTitle}
          </h1>
          {itemDesc && (
            <p className="mt-2 text-sm" style={{ color: "var(--text-2)", lineHeight: 1.75 }}>
              {itemDesc}
            </p>
          )}
        </div>

        {/* Package info + total */}
        <section className="section-panel section-panel-compact">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="section-eyebrow">{t.package}</p>
              <p className="mt-1 font-semibold" style={{ color: "var(--text)" }}>{pkgName}</p>
            </div>
            <span className="metric-pill shrink-0">¥{totalPrice.toLocaleString()}</span>
          </div>
          <p className="mt-1.5 text-sm" style={{ color: "var(--text-3)" }}>
            {totalDuration} {t.min}
          </p>
          {pkgDesc && (
            <p className="mt-3 text-sm" style={{ color: "var(--text-2)", lineHeight: 1.75 }}>
              {pkgDesc}
            </p>
          )}
        </section>

        {/* Fixed add-ons included in this showcase item */}
        {fixedAddons.length > 0 && (
          <section className="section-panel section-panel-compact">
            <p className="section-eyebrow mb-3">{t.addons}</p>
            <div
              className="grid gap-2"
              style={fixedAddons.length > 3 ? { maxHeight: 220, overflowY: "auto", paddingRight: 2 } : undefined}
            >
              {fixedAddons.map((link) => {
                const addon = link.addon;
                const addonName = lang === "ja" ? addon.nameJa : addon.nameZh;
                const addonDesc = lang === "ja" ? addon.descJa : addon.descZh;
                const addonPrice = addon.priceJpy * link.qty;
                const addonDuration = addon.durationIncreaseMin * link.qty;
                const showDetails = !item.hideAddonDetails;
                return (
                  <div
                    key={addon.id.toString()}
                    className="flex items-start justify-between gap-3 rounded-lg px-3 py-2.5"
                    style={{ border: "1px solid var(--border)", background: "var(--bg)" }}
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium" style={{ color: "var(--text)" }}>
                        {addonName}{link.qty > 1 ? ` ${t.qty}${link.qty}` : ""}
                      </p>
                      {addonDesc && (
                        <p className="mt-0.5 text-xs" style={{ color: "var(--text-3)", lineHeight: 1.5 }}>
                          {addonDesc}
                        </p>
                      )}
                      {showDetails && addonDuration > 0 && (
                        <p className="mt-0.5 text-xs" style={{ color: "var(--text-3)" }}>
                          {t.plus}{addonDuration} {t.addonDuration}
                        </p>
                      )}
                    </div>
                    {showDetails && (
                      <span className="metric-pill metric-pill-soft shrink-0">
                        {t.plus}¥{addonPrice.toLocaleString()}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Book CTA */}
        <Link
          href={`/booking?${bookingParams}`}
          className="ui-btn-primary text-center"
          style={{ padding: "13px 0", fontSize: 15, display: "block" }}
        >
          {t.book}
        </Link>

      </main>
    </PublicSiteFrame>
  );
}
