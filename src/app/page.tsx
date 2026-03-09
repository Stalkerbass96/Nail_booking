import Link from "next/link";
import PublicSiteFrame from "@/components/public-site-frame";
import { prisma } from "@/lib/db";
import { pickText, resolveLang } from "@/lib/lang";
import { findLineEntryByToken } from "@/lib/line-customers";

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

function clampText(value: string | null | undefined) {
  const text = value?.trim();
  return text && text.length > 0 ? text : null;
}

export default async function HomePage({ searchParams }: Props) {
  const query = await searchParams;
  const lang = resolveLang(query?.lang);
  const entryToken = query?.entry?.trim() || undefined;
  const categoryId = query?.categoryId?.trim() || undefined;

  const [entryUser, categories, showcaseItems] = await Promise.all([
    entryToken ? findLineEntryByToken(entryToken) : Promise.resolve(null),
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
        category: {
          select: { id: true, nameZh: true, nameJa: true }
        },
        servicePackage: {
          select: { id: true, nameZh: true, nameJa: true, priceJpy: true, durationMin: true }
        }
      },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }]
    })
  ]);

  return (
    <PublicSiteFrame lang={lang} entryToken={entryToken}>
      <main className="mx-auto flex w-full max-w-6xl flex-col gap-5 px-4 py-5 sm:px-6 sm:py-7">
        <section className="compact-shell compact-shell-sticky">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-2">
              <p className="section-eyebrow">{pickText(lang, "LINE-first booking", "LINE-first booking")}</p>
              <h1 className="text-2xl font-semibold text-brand-900 sm:text-3xl">
                {pickText(lang, "选款后直接预约", "デザインを選んでそのまま予約")}
              </h1>
              <p className="text-sm leading-7 text-brand-700 sm:text-[15px]">
                {pickText(lang, "先看图，再选时间。客户只需要完成这一条主路径。", "ギャラリーから選び、そのまま空き時間を決めるだけです。")}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2 lg:justify-end">
              {entryUser?.customer ? (
                <span className="metric-pill">
                  {pickText(lang, "当前顾客", "現在の顧客")}: {entryUser.customer.name}
                </span>
              ) : null}
              <span className="metric-pill metric-pill-soft">
                {showcaseItems.length} {pickText(lang, "个可预约款式", "items")}
              </span>
            </div>
          </div>

          <div className="compact-filter-row mt-4">
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
          <section className="section-panel py-5">
            <p className="ui-state-info mt-0">
              {pickText(lang, "当前分类下还没有可展示的图墙项。", "このカテゴリには表示できるギャラリー項目がありません。")}
            </p>
          </section>
        ) : (
          <section className="gallery-grid">
            {showcaseItems.map((item) => {
              const bookingParams = new URLSearchParams({
                showcaseItemId: item.id.toString(),
                lang
              });
              if (entryToken) {
                bookingParams.set("entry", entryToken);
              }

              const description = clampText(lang === "ja" ? item.descriptionJa : item.descriptionZh);
              const packageName = lang === "ja" ? item.servicePackage.nameJa : item.servicePackage.nameZh;

              return (
                <article key={item.id.toString()} className="product-card product-card-compact overflow-hidden">
                  <div
                    className="product-card-media min-h-[17rem] rounded-[1.35rem] sm:min-h-[18rem]"
                    style={{ backgroundImage: `linear-gradient(180deg, rgba(47,29,39,0.06), rgba(47,29,39,0.28)), url(${item.imageUrl})` }}
                  >
                    <span>{lang === "ja" ? item.category.nameJa : item.category.nameZh}</span>
                  </div>
                  <div className="mt-4 flex flex-col gap-3">
                    <div className="space-y-2">
                      <h2 className="text-xl font-semibold text-brand-900 sm:text-2xl">
                        {lang === "ja" ? item.titleJa : item.titleZh}
                      </h2>
                      {description ? (
                        <p
                          className="text-sm leading-7 text-brand-700"
                          style={{ display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}
                        >
                          {description}
                        </p>
                      ) : null}
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <span className="metric-pill">{item.servicePackage.priceJpy} JPY {pickText(lang, "起", "〜")}</span>
                      <span className="metric-pill metric-pill-soft">{item.servicePackage.durationMin} min</span>
                    </div>

                    <div className="product-card-footer">
                      <div className="min-w-0">
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-500">Package</p>
                        <p className="mt-1 truncate text-sm text-brand-800">{packageName}</p>
                      </div>
                      <Link className="ui-btn-primary ui-btn-primary-compact" href={`/booking?${bookingParams.toString()}`}>
                        {pickText(lang, "预约同款", "このデザインで予約")}
                      </Link>
                    </div>
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
