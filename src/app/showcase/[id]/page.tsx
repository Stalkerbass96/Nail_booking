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
    addons: "可选加项",
    addonDuration: "分钟",
    book: "预约此款设计",
    min: "分钟",
    plus: "+"
  },
  ja: {
    back: "← ギャラリーに戻る",
    package: "メニュー",
    category: "カテゴリ",
    duration: "所要時間",
    addons: "オプション追加",
    addonDuration: "分",
    book: "このデザインを予約",
    min: "分",
    plus: "+"
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
        include: {
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
                  durationIncreaseMin: true
                }
              }
            },
            orderBy: { id: "asc" }
          }
        }
      }
    }
  });

  if (!item || !item.servicePackage.isActive) {
    notFound();
  }

  const pkg = item.servicePackage;
  const addons = pkg.addonLinks.map((l) => l.addon);
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

        {/* Package info */}
        <section className="section-panel section-panel-compact">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="section-eyebrow">{t.package}</p>
              <p className="mt-1 font-semibold" style={{ color: "var(--text)" }}>{pkgName}</p>
            </div>
            <span className="metric-pill shrink-0">¥{Number(pkg.priceJpy).toLocaleString()}</span>
          </div>
          <p className="mt-1.5 text-sm" style={{ color: "var(--text-3)" }}>
            {pkg.durationMin} {t.min}
          </p>
          {pkgDesc && (
            <p className="mt-3 text-sm" style={{ color: "var(--text-2)", lineHeight: 1.75 }}>
              {pkgDesc}
            </p>
          )}
        </section>

        {/* Add-ons */}
        {addons.length > 0 && (
          <section className="section-panel section-panel-compact">
            <p className="section-eyebrow mb-3">{t.addons}</p>
            <div className="grid gap-2">
              {addons.map((addon) => {
                const addonName = lang === "ja" ? addon.nameJa : addon.nameZh;
                const addonDesc = lang === "ja" ? addon.descJa : addon.descZh;
                return (
                  <div
                    key={addon.id.toString()}
                    className="flex items-start justify-between gap-3 rounded-lg px-3 py-2.5"
                    style={{ border: "1px solid var(--border)", background: "var(--bg)" }}
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium" style={{ color: "var(--text)" }}>
                        {addonName}
                      </p>
                      {addonDesc && (
                        <p className="mt-0.5 text-xs" style={{ color: "var(--text-3)", lineHeight: 1.5 }}>
                          {addonDesc}
                        </p>
                      )}
                      <p className="mt-0.5 text-xs" style={{ color: "var(--text-3)" }}>
                        {t.plus}{addon.durationIncreaseMin} {t.addonDuration}
                      </p>
                    </div>
                    <span className="metric-pill metric-pill-soft shrink-0">
                      {t.plus}¥{Number(addon.priceJpy).toLocaleString()}
                    </span>
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
