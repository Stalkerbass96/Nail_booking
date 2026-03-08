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
    <PublicSiteFrame lang={lang}>
      <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-6 sm:px-6 sm:py-10">
        <section className="section-panel">
          <p className="section-eyebrow">Service Catalog</p>
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <h1 className="section-title">{pickText(lang, "\u5148\u770b\u5957\u9910\uff0c\u518d\u56de\u56fe\u5899\u9009\u5177\u4f53\u6b3e\u5f0f\u3002", "\u307e\u305a\u30e1\u30cb\u30e5\u30fc\u3092\u78ba\u8a8d\u3057\u3001\u305d\u306e\u5f8c\u30ae\u30e3\u30e9\u30ea\u30fc\u3067\u5177\u4f53\u7684\u306a\u30c7\u30b6\u30a4\u30f3\u3092\u9078\u3076\u3002")}</h1>
              <p className="section-copy">
                {pickText(lang, "\u8fd9\u91cc\u4fdd\u7559\u5957\u9910\u76ee\u5f55\u4f5c\u4e3a\u53c2\u8003\u3002\u771f\u6b63\u7684\u9884\u7ea6\u4e3b\u8def\u5f84\u5df2\u7ecf\u5207\u5230\u56fe\u5899\u9996\u9875\uff0c\u987e\u5ba2\u4f1a\u4ece LINE \u94fe\u63a5\u8fdb\u5165\u540e\u6309\u56fe\u9009\u540c\u6b3e\u3002", "\u3053\u3053\u3067\u306f\u30e1\u30cb\u30e5\u30fc\u4e00\u89a7\u3092\u53c2\u8003\u7528\u306b\u6b8b\u3057\u3066\u3044\u307e\u3059\u3002\u5b9f\u969b\u306e\u4e88\u7d04\u5c0e\u7dda\u306f\u30ae\u30e3\u30e9\u30ea\u30fc\u30db\u30fc\u30e0\u306b\u79fb\u884c\u3057\u3066\u304a\u308a\u3001\u304a\u5ba2\u69d8\u306f LINE \u306e\u30ea\u30f3\u30af\u304b\u3089\u5165\u308a\u3001\u753b\u50cf\u3054\u3068\u306b\u540c\u3058\u30c7\u30b6\u30a4\u30f3\u3067\u4e88\u7d04\u3057\u307e\u3059\u3002")}
              </p>
            </div>
            <Link className="ui-btn-primary" href={`/?lang=${lang}`}>
              {pickText(lang, "\u8fd4\u56de\u56fe\u5899\u9996\u9875", "\u30ae\u30e3\u30e9\u30ea\u30fc\u30db\u30fc\u30e0\u3078")}
            </Link>
          </div>
        </section>

        {categories.length === 0 ? (
          <section className="ui-card">
            <p className="ui-state-info mt-0">{pickText(lang, "\u5f53\u524d\u8fd8\u6ca1\u6709\u53ef\u5c55\u793a\u7684\u670d\u52a1\u3002", "\u73fe\u5728\u8868\u793a\u3067\u304d\u308b\u30e1\u30cb\u30e5\u30fc\u304c\u3042\u308a\u307e\u305b\u3093\u3002")}</p>
          </section>
        ) : null}

        <div className="grid gap-8">
          {categories.map((category) => (
            <section key={category.id.toString()} className="section-panel">
              <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="section-eyebrow">{pickText(lang, "\u5206\u7c7b", "\u30ab\u30c6\u30b4\u30ea")}</p>
                  <h2 className="text-2xl font-semibold text-brand-900">{lang === "ja" ? category.nameJa : category.nameZh}</h2>
                </div>
                <span className="metric-pill">{category.packages.length} {pickText(lang, "\u4e2a\u5957\u9910", "\u30e1\u30cb\u30e5\u30fc")}</span>
              </div>

              <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {category.packages.map((pkg, index) => {
                  const showcaseHref = pkg.showcaseItems[0]
                    ? `/booking?showcaseItemId=${pkg.showcaseItems[0].id.toString()}&lang=${lang}`
                    : `/?lang=${lang}`;

                  return (
                    <article key={pkg.id.toString()} className="product-card">
                      <div className="product-card-media" style={pkg.imageUrl ? { backgroundImage: `linear-gradient(135deg, rgba(52,30,40,0.16), rgba(255,255,255,0.1)), url(${pkg.imageUrl})` } : undefined}>
                        {!pkg.imageUrl ? <span>{pickText(lang, "\u7cbe\u54c1\u62a4\u7406", "\u30b7\u30b0\u30cd\u30c1\u30e3\u30fc\u30b1\u30a2")} #{index + 1}</span> : null}
                      </div>
                      <div className="mt-4 flex flex-col gap-3">
                        <div>
                          <h3 className="text-xl font-semibold text-brand-900">{lang === "ja" ? pkg.nameJa : pkg.nameZh}</h3>
                          <p className="mt-2 line-clamp-3 text-sm text-brand-700">
                            {lang === "ja"
                              ? pkg.descJa || pickText(lang, "\u8be6\u60c5\u9875\u53ef\u67e5\u770b\u5b8c\u6574\u8bf4\u660e\u3002", "\u8a73\u7d30\u30da\u30fc\u30b8\u3067\u8aac\u660e\u3092\u78ba\u8a8d\u3067\u304d\u307e\u3059\u3002")
                              : pkg.descZh || pickText(lang, "\u8be6\u60c5\u9875\u53ef\u67e5\u770b\u5b8c\u6574\u8bf4\u660e\u3002", "\u8a73\u7d30\u30da\u30fc\u30b8\u3067\u8aac\u660e\u3092\u78ba\u8a8d\u3067\u304d\u307e\u3059\u3002")}
                          </p>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          <span className="metric-pill">{pkg.priceJpy} JPY</span>
                          <span className="metric-pill metric-pill-soft">{pkg.durationMin} min</span>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <Link className="ui-btn-secondary" href={`/services/${pkg.id.toString()}?lang=${lang}`}>
                            {pickText(lang, "\u67e5\u770b\u8be6\u60c5", "\u8a73\u7d30\u3092\u898b\u308b")}
                          </Link>
                          <Link className="ui-btn-primary" href={showcaseHref}>
                            {pickText(lang, "\u524d\u5f80\u56fe\u5899\u9884\u7ea6", "\u30ae\u30e3\u30e9\u30ea\u30fc\u4e88\u7d04\u3078")}
                          </Link>
                        </div>
                      </div>
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
