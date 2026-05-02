import Link from "next/link";
import PublicSiteFrame from "@/components/public-site-frame";
import { prisma } from "@/lib/db";
import { pickText, resolveLang } from "@/lib/lang";

type Props = {
  searchParams: Promise<{ lang?: string; entry?: string }>;
};

function withQuery(lang: string, entryToken?: string) {
  const params = new URLSearchParams({ lang });
  if (entryToken) params.set("entry", entryToken);
  return params.toString();
}

const TEXT = {
  zh: {
    title: "套餐 & 价格",
    backToGallery: "回到图墙",
    book: "预约此套餐",
    duration: "分钟",
    addons: "可选加项",
    addonDuration: "分钟",
    plus: "+",
    empty: "当前还没有可展示的套餐。"
  },
  ja: {
    title: "メニュー & 料金",
    backToGallery: "ギャラリーに戻る",
    book: "このメニューを予約",
    duration: "分",
    addons: "オプション追加",
    addonDuration: "分",
    plus: "+",
    empty: "表示できるメニューがありません。"
  }
} as const;

export default async function ServicesPage({ searchParams }: Props) {
  const query = await searchParams;
  const lang = resolveLang(query?.lang);
  const entryToken = query?.entry?.trim() || undefined;
  const t = TEXT[lang];

  const categories = await prisma.serviceCategory.findMany({
    where: { isActive: true },
    include: {
      packages: {
        where: { isActive: true },
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
                  durationIncreaseMin: true,
                  maxQty: true
                }
              }
            },
            orderBy: { id: "asc" }
          }
        },
        orderBy: { id: "asc" }
      }
    },
    orderBy: [{ sortOrder: "asc" }, { id: "asc" }]
  });

  return (
    <PublicSiteFrame lang={lang} entryToken={entryToken}>
      <main className="mx-auto flex w-full max-w-3xl flex-col gap-5 px-4 py-4 sm:px-6 sm:py-5">

        <section
          className="flex items-center justify-between gap-3 pb-4"
          style={{ borderBottom: "1px solid var(--border)" }}
        >
          <h1 className="text-lg font-semibold" style={{ color: "var(--text)" }}>
            {t.title}
          </h1>
          <Link className="ui-btn-secondary shrink-0" href={`/?${withQuery(lang, entryToken)}`}>
            {t.backToGallery}
          </Link>
        </section>

        {categories.length === 0 && (
          <section className="section-panel section-panel-compact">
            <p className="ui-state-info mt-0">{t.empty}</p>
          </section>
        )}

        <div className="grid gap-6">
          {categories.map((category) => {
            const categoryName = lang === "ja" ? category.nameJa : category.nameZh;
            return (
              <section key={category.id.toString()}>
                <div
                  className="mb-3 flex items-center gap-2 pb-2"
                  style={{ borderBottom: "2px solid var(--border)" }}
                >
                  <h2 className="text-base font-semibold" style={{ color: "var(--text)" }}>
                    {categoryName}
                  </h2>
                  <span className="metric-pill metric-pill-soft">{category.packages.length}</span>
                </div>

                <div className="grid gap-4">
                  {category.packages.map((pkg) => {
                    const pkgName = lang === "ja" ? pkg.nameJa : pkg.nameZh;
                    const pkgDesc = lang === "ja" ? pkg.descJa : pkg.descZh;
                    const addons = pkg.addonLinks.map((l) => l.addon);

                    const bookingParams = new URLSearchParams({ packageId: pkg.id.toString(), lang });
                    if (entryToken) bookingParams.set("entry", entryToken);

                    return (
                      <article
                        key={pkg.id.toString()}
                        className="section-panel section-panel-compact"
                      >
                        {/* Package header */}
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <h3 className="font-semibold" style={{ color: "var(--text)" }}>
                              {pkgName}
                            </h3>
                            <p className="mt-0.5 text-sm" style={{ color: "var(--text-3)" }}>
                              {pkg.durationMin} {t.duration}
                            </p>
                          </div>
                          <span className="metric-pill shrink-0">
                            ¥{Number(pkg.priceJpy).toLocaleString()}
                          </span>
                        </div>

                        {/* Package description */}
                        {pkgDesc && (
                          <p
                            className="mt-3 text-sm"
                            style={{ color: "var(--text-2)", lineHeight: 1.75 }}
                          >
                            {pkgDesc}
                          </p>
                        )}

                        {/* Add-ons */}
                        {addons.length > 0 && (
                          <div className="mt-4">
                            <p className="section-eyebrow mb-2">{t.addons}</p>
                            <div className="grid gap-1.5">
                              {addons.map((addon) => {
                                const addonName = lang === "ja" ? addon.nameJa : addon.nameZh;
                                const addonDesc = lang === "ja" ? addon.descJa : addon.descZh;
                                return (
                                  <div
                                    key={addon.id.toString()}
                                    className="flex items-start justify-between gap-3 rounded-lg px-3 py-2"
                                    style={{
                                      border: "1px solid var(--border)",
                                      background: "var(--bg)"
                                    }}
                                  >
                                    <div className="min-w-0">
                                      <p
                                        className="text-sm font-medium"
                                        style={{ color: "var(--text)" }}
                                      >
                                        {addonName}
                                      </p>
                                      {addonDesc && (
                                        <p
                                          className="mt-0.5 text-xs"
                                          style={{ color: "var(--text-3)", lineHeight: 1.5 }}
                                        >
                                          {addonDesc}
                                        </p>
                                      )}
                                      <p
                                        className="mt-0.5 text-xs"
                                        style={{ color: "var(--text-3)" }}
                                      >
                                        {t.plus}{addon.durationIncreaseMin} {t.addonDuration}
                                      </p>
                                    </div>
                                    <span className="metric-pill metric-pill-soft shrink-0 text-xs">
                                      {t.plus}¥{Number(addon.priceJpy).toLocaleString()}
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {/* Book button */}
                        <div className="mt-4">
                          <Link
                            href={`/booking?${bookingParams}`}
                            className="ui-btn-primary"
                            style={{ display: "inline-block" }}
                          >
                            {t.book}
                          </Link>
                        </div>
                      </article>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>
      </main>
    </PublicSiteFrame>
  );
}
