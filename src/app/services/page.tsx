import Link from "next/link";
import PublicSiteFrame from "@/components/public-site-frame";
import { prisma } from "@/lib/db";
import { pickText, resolveLang } from "@/lib/lang";

type Props = {
  searchParams: Promise<{
    lang?: string;
    entry?: string;
  }>;
};

function withQuery(lang: string, entryToken?: string) {
  const params = new URLSearchParams({ lang });
  if (entryToken) params.set("entry", entryToken);
  return params.toString();
}

export default async function ServicesPage({ searchParams }: Props) {
  const query = await searchParams;
  const lang = resolveLang(query?.lang);
  const entryToken = query?.entry?.trim() || undefined;

  const categories = await prisma.serviceCategory.findMany({
    where: { isActive: true },
    include: {
      packages: {
        where: { isActive: true },
        include: {
          showcaseItems: {
            where: { isPublished: true },
            orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
            take: 1,
            select: { id: true }
          }
        },
        orderBy: { id: "asc" }
      }
    },
    orderBy: [{ sortOrder: "asc" }, { id: "asc" }]
  });

  return (
    <PublicSiteFrame lang={lang} entryToken={entryToken}>
      <main className="mx-auto flex w-full max-w-5xl flex-col gap-5 px-4 py-4 sm:px-6 sm:py-5">
        <section className="section-panel section-panel-compact">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-lg font-semibold text-brand-900">
                {pickText(lang, "套餐参考", "メニュー一覧")}
              </h1>
              <p className="mt-1 text-sm text-brand-600">
                {pickText(lang, "真正预约请从图墙进入，套餐页只用于快速了解价格和时长。", "実際の予約はギャラリーから行い、このページでは価格と所要時間だけを確認します。")}
              </p>
            </div>
            <Link className="ui-btn-secondary" href={`/?${withQuery(lang, entryToken)}`}>
              {pickText(lang, "回到图墙", "ギャラリーに戻る")}
            </Link>
          </div>
        </section>

        {categories.length === 0 ? (
          <section className="section-panel section-panel-compact">
            <p className="ui-state-info mt-0">
              {pickText(lang, "当前还没有可展示的套餐。", "表示できるメニューがありません。")}
            </p>
          </section>
        ) : null}

        <div className="grid gap-4">
          {categories.map((category) => (
            <section key={category.id.toString()} className="section-panel section-panel-compact">
              <div className="mb-4 flex items-center justify-between gap-3">
                <h2 className="text-base font-semibold text-brand-900">{lang === "ja" ? category.nameJa : category.nameZh}</h2>
                <span className="metric-pill metric-pill-soft">{category.packages.length}</span>
              </div>

              <div className="grid gap-3">
                {category.packages.map((pkg) => {
                  const bookingHref = pkg.showcaseItems[0]
                    ? `/booking?showcaseItemId=${pkg.showcaseItems[0].id.toString()}&${withQuery(lang, entryToken)}`
                    : `/?${withQuery(lang, entryToken)}`;

                  return (
                    <article key={pkg.id.toString()} className="menu-row-card">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-brand-900">{lang === "ja" ? pkg.nameJa : pkg.nameZh}</p>
                        <p className="mt-1 text-sm text-brand-600">JPY {pkg.priceJpy} · {pkg.durationMin} min</p>
                      </div>
                      <Link className="ui-btn-primary ui-btn-primary-compact shrink-0" href={bookingHref}>
                        {pickText(lang, "预约同款", "予約へ")}
                      </Link>
                    </article>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      </main>
    </PublicSiteFrame>
  );
}
