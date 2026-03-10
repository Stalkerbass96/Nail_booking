import Link from "next/link";
import PublicSiteFrame from "@/components/public-site-frame";
import { prisma } from "@/lib/db";
import { pickText, resolveLang } from "@/lib/lang";

type Props = {
  searchParams: Promise<{
    lang?: string;
    categoryId?: string;
    entry?: string;
  }>;
};

function buildHref(lang: string, entry: string | undefined, categoryId?: string) {
  const params = new URLSearchParams({ lang });
  if (entry) params.set("entry", entry);
  if (categoryId) params.set("categoryId", categoryId);
  const qs = params.toString();
  return qs ? `/?${qs}` : "/";
}

export default async function HomePage({ searchParams }: Props) {
  const query = await searchParams;
  const lang = resolveLang(query?.lang);
  const entryToken = query?.entry?.trim() || undefined;
  const categoryId = query?.categoryId?.trim() || undefined;

  const [categories, showcaseItems] = await Promise.all([
    prisma.serviceCategory.findMany({
      where: {
        isActive: true,
        showcaseItems: { some: { isPublished: true, servicePackage: { isActive: true } } }
      },
      orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
      select: {
        id: true,
        nameZh: true,
        nameJa: true
      }
    }),
    prisma.showcaseItem.findMany({
      where: {
        isPublished: true,
        servicePackage: { isActive: true },
        ...(categoryId ? { categoryId: BigInt(categoryId) } : {})
      },
      include: {
        servicePackage: {
          select: { id: true, nameZh: true, nameJa: true, priceJpy: true }
        }
      },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }]
    })
  ]);

  return (
    <PublicSiteFrame lang={lang} entryToken={entryToken}>
      <main className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-4 py-4 sm:px-6 sm:py-5">
        <section className="gallery-toolbar">
          <div className="compact-filter-row">
            <Link className={`site-filter-chip ${!categoryId ? "site-filter-chip-active" : ""}`} href={buildHref(lang, entryToken)}>
              {pickText(lang, "全部", "すべて")}
            </Link>
            {categories.map((category) => (
              <Link
                key={category.id.toString()}
                className={`site-filter-chip ${categoryId === category.id.toString() ? "site-filter-chip-active" : ""}`}
                href={buildHref(lang, entryToken, category.id.toString())}
              >
                {lang === "ja" ? category.nameJa : category.nameZh}
              </Link>
            ))}
          </div>
        </section>

        {showcaseItems.length === 0 ? (
          <section className="section-panel section-panel-compact py-5">
            <p className="ui-state-info mt-0">
              {pickText(lang, "当前分类下还没有可预约的款式。", "このカテゴリには予約できるデザインがありません。")}
            </p>
          </section>
        ) : (
          <section className="gallery-grid-stable">
            {showcaseItems.map((item) => {
              const bookingParams = new URLSearchParams({
                showcaseItemId: item.id.toString(),
                lang
              });
              if (entryToken) {
                bookingParams.set("entry", entryToken);
              }

              const packageName = lang === "ja" ? item.servicePackage.nameJa : item.servicePackage.nameZh;

              return (
                <article key={item.id.toString()} className="gallery-tile gallery-tile-stable">
                  <div className="gallery-tile-media-wrap">
                    <div
                      className="gallery-tile-media gallery-tile-media-stable"
                      style={{ backgroundImage: `linear-gradient(180deg, rgba(38, 24, 31, 0.05), rgba(38, 24, 31, 0.18)), url(${item.imageUrl})` }}
                    />
                  </div>
                  <div className="gallery-tile-body">
                    <div className="gallery-tile-meta-row">
                      <span className="gallery-price">JPY {item.servicePackage.priceJpy}</span>
                      <span className="gallery-package">{packageName}</span>
                    </div>
                    <Link className="ui-btn-primary gallery-book-btn" href={`/booking?${bookingParams.toString()}`}>
                      {pickText(lang, "预约同款", "このデザインで予約")}
                    </Link>
                  </div>
                </article>
              );
            })}
          </section>
        )}
      </main>
    </PublicSiteFrame>
  );
}
