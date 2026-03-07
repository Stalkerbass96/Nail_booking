import Link from "next/link";
import PublicSiteFrame from "@/components/public-site-frame";
import { prisma } from "@/lib/db";
import { pickText, resolveLang } from "@/lib/lang";

type Props = {
  searchParams: Promise<{
    lang?: string;
  }>;
};

export default async function ServicesPage({ searchParams }: Props) {
  const query = await searchParams;
  const lang = resolveLang(query?.lang);

  const categories = await prisma.serviceCategory.findMany({
    where: { isActive: true },
    include: {
      packages: {
        where: { isActive: true },
        orderBy: { id: "asc" }
      }
    },
    orderBy: [{ sortOrder: "asc" }, { id: "asc" }]
  });

  return (
    <PublicSiteFrame lang={lang}>
      <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-6 sm:px-6 sm:py-10">
        <section className="section-panel">
          <p className="section-eyebrow">Service Catalog</p>
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <h1 className="section-title">{pickText(lang, "选择适合的套餐，再细调加项。", "まずメニューを選び、必要なら追加オプションで調整。")}</h1>
              <p className="section-copy">
                {pickText(lang, "所有启用中的分类和套餐都会在这里展示。你可以先比较价格和时长，再进入详情或直接预约。", "有効なカテゴリとメニューを一覧で表示します。価格と所要時間を比較し、詳細確認またはそのまま予約へ進めます。")}
              </p>
            </div>
            <Link className="ui-btn-secondary" href={`/booking/lookup?lang=${lang}`}>
              {pickText(lang, "查询已有预约", "予約確認")}
            </Link>
          </div>
        </section>

        {categories.length === 0 ? (
          <section className="ui-card">
            <p className="ui-state-info mt-0">{pickText(lang, "当前还没有可展示的服务。", "現在表示できるメニューがありません。")}</p>
          </section>
        ) : null}

        <div className="grid gap-8">
          {categories.map((category) => (
            <section key={category.id.toString()} className="section-panel">
              <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="section-eyebrow">{pickText(lang, "分类", "カテゴリ")}</p>
                  <h2 className="text-2xl font-semibold text-brand-900">{lang === "ja" ? category.nameJa : category.nameZh}</h2>
                </div>
                <span className="metric-pill">{category.packages.length} {pickText(lang, "个套餐", "メニュー")}</span>
              </div>

              <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {category.packages.map((pkg, index) => (
                  <article key={pkg.id.toString()} className="product-card">
                    <div className="product-card-media" style={pkg.imageUrl ? { backgroundImage: `linear-gradient(135deg, rgba(52,30,40,0.16), rgba(255,255,255,0.1)), url(${pkg.imageUrl})` } : undefined}>
                      {!pkg.imageUrl ? <span>{pickText(lang, "精品护理", "シグネチャーケア")} #{index + 1}</span> : null}
                    </div>
                    <div className="mt-4 flex flex-col gap-3">
                      <div>
                        <h3 className="text-xl font-semibold text-brand-900">{lang === "ja" ? pkg.nameJa : pkg.nameZh}</h3>
                        <p className="mt-2 line-clamp-3 text-sm text-brand-700">
                          {lang === "ja"
                            ? pkg.descJa || pickText(lang, "详情页可查看完整说明。", "詳細ページで説明を確認できます。")
                            : pkg.descZh || pickText(lang, "详情页可查看完整说明。", "詳細ページで説明を確認できます。")}
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <span className="metric-pill">{pkg.priceJpy} JPY</span>
                        <span className="metric-pill metric-pill-soft">{pkg.durationMin} min</span>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <Link className="ui-btn-secondary" href={`/services/${pkg.id.toString()}?lang=${lang}`}>
                          {pickText(lang, "查看详情", "詳細を見る")}
                        </Link>
                        <Link className="ui-btn-primary" href={`/booking?packageId=${pkg.id.toString()}&lang=${lang}`}>
                          {pickText(lang, "立即预约", "予約する")}
                        </Link>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          ))}
        </div>
      </main>
    </PublicSiteFrame>
  );
}
