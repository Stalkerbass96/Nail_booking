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
      <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-6 sm:px-6 sm:py-8">
        <section className="section-panel py-5">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-brand-900 sm:text-3xl">
                {pickText(lang, "图墙预约", "ギャラリー予約")}
              </h1>
              <p className="mt-2 text-sm text-brand-700">
                {pickText(lang, "点击喜欢的款式后选择时间提交预约。", "気になるデザインを選んで、そのまま予約時間を決めてください。")}
              </p>
            </div>
            {entryUser?.customer ? (
              <span className="metric-pill">
                {pickText(lang, "当前顾客", "現在の顧客")}: {entryUser.customer.name}
              </span>
            ) : null}
          </div>
        </section>

        <section className="section-panel py-5">
          <div className="flex flex-wrap gap-2">
            <Link className={`site-lang-switch ${!categoryId ? "border-brand-700 bg-brand-700 text-white" : ""}`} href={buildHref(lang, entryToken)}>
              {pickText(lang, "全部", "すべて")}
            </Link>
            {categories.map((category) => (
              <Link
                key={category.id.toString()}
                className={`site-lang-switch ${categoryId === category.id.toString() ? "border-brand-700 bg-brand-700 text-white" : ""}`}
                href={buildHref(lang, entryToken, category.id.toString())}
              >
                {lang === "ja" ? category.nameJa : category.nameZh}
              </Link>
            ))}
          </div>
        </section>

        {showcaseItems.length === 0 ? (
          <section className="section-panel py-5">
            <p className="ui-state-info mt-0">{pickText(lang, "当前分类下还没有可展示的图墙项。", "このカテゴリには表示できるギャラリー項目がありません。")}</p>
          </section>
        ) : null}

        <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {showcaseItems.map((item) => {
            const bookingParams = new URLSearchParams({
              showcaseItemId: item.id.toString(),
              lang
            });
            if (entryToken) {
              bookingParams.set("entry", entryToken);
            }

            return (
              <article key={item.id.toString()} className="product-card mb-5 break-inside-avoid overflow-hidden">
                <div className="product-card-media min-h-[18rem] rounded-[1.4rem] sm:min-h-[19rem]" style={{ backgroundImage: `linear-gradient(180deg, rgba(47,29,39,0.08), rgba(47,29,39,0.28)), url(${item.imageUrl})` }}>
                  <span>{lang === "ja" ? item.category.nameJa : item.category.nameZh}</span>
                </div>
                <div className="mt-4 flex flex-col gap-3">
                  <div>
                    <h2 className="text-2xl font-semibold text-brand-900">{lang === "ja" ? item.titleJa : item.titleZh}</h2>
                    <p className="mt-2 text-sm leading-7 text-brand-700">{lang === "ja" ? item.descriptionJa || "-" : item.descriptionZh || "-"}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <span className="metric-pill">{item.servicePackage.priceJpy} JPY {pickText(lang, "起", "〜")}</span>
                    <span className="metric-pill metric-pill-soft">{item.servicePackage.durationMin} min</span>
                  </div>
                  <p className="text-sm text-brand-700">{pickText(lang, "对应套餐", "連携メニュー")}: {lang === "ja" ? item.servicePackage.nameJa : item.servicePackage.nameZh}</p>
                  <Link className="ui-btn-primary w-full" href={`/booking?${bookingParams.toString()}`}>
                    {pickText(lang, "预约同款", "このデザインで予約")}
                  </Link>
                </div>
              </article>
            );
          })}
        </section>
      </main>
    </PublicSiteFrame>
  );
}
