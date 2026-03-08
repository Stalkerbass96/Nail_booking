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
      <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-6 sm:px-6 sm:py-10">
        <section className="hero-panel">
          <div className="hero-copy">
            <p className="hero-eyebrow">LINE First Showcase</p>
            <h1 className="hero-title">
              {pickText(lang, "\u5148\u770b\u56fe\uff0c\u518d\u9009\u540c\u6b3e\uff0c\u518d\u9884\u7ea6\u65f6\u95f4\u3002", "\u307e\u305a\u30c7\u30b6\u30a4\u30f3\u3092\u898b\u3066\u3001\u540c\u3058\u30e1\u30cb\u30e5\u30fc\u3092\u9078\u3073\u3001\u4e88\u7d04\u6642\u9593\u3078\u9032\u3080\u3002")}
            </h1>
            <p className="hero-text">
              {pickText(
                lang,
                "\u9996\u9875\u73b0\u5728\u662f\u5e97\u94fa\u56fe\u5899\u3002\u6bcf\u5f20\u56fe\u5bf9\u5e94\u540e\u53f0\u7ef4\u62a4\u7684\u5957\u9910\uff0c\u5ba2\u6237\u4ece LINE \u6253\u5f00\u7684\u94fe\u63a5\u4f1a\u81ea\u52a8\u5e26\u4e0a\u8eab\u4efd\u51ed\u8bc1\uff0c\u9884\u7ea6\u65f6\u4e0d\u518d\u8981\u6c42\u90ae\u7bb1\u3002",
                "\u30db\u30fc\u30e0\u306f\u30b5\u30ed\u30f3\u306e\u30ae\u30e3\u30e9\u30ea\u30fc\u3067\u3059\u3002\u5404\u753b\u50cf\u306f\u7ba1\u7406\u753b\u9762\u306e\u30e1\u30cb\u30e5\u30fc\u306b\u7d10\u3065\u304d\u3001LINE \u304b\u3089\u958b\u3044\u305f\u30ea\u30f3\u30af\u306b\u306f\u672c\u4eba\u7528\u30c8\u30fc\u30af\u30f3\u304c\u542b\u307e\u308c\u308b\u305f\u3081\u3001\u4e88\u7d04\u6642\u306b\u30e1\u30fc\u30eb\u5165\u529b\u306f\u4e0d\u8981\u3067\u3059\u3002"
              )}
            </p>
            <div className="hero-actions">
              {entryUser?.customer ? (
                <span className="metric-pill">
                  {pickText(lang, "\u5f53\u524d\u987e\u5ba2", "\u73fe\u5728\u306e\u9867\u5ba2")}: {entryUser.customer.name}
                </span>
              ) : (
                <span className="metric-pill metric-pill-soft">
                  {pickText(lang, "\u5efa\u8bae\u4ece LINE \u6d88\u606f\u91cc\u7684\u94fe\u63a5\u8fdb\u5165\u540e\u518d\u9884\u7ea6\u3002", "\u4e88\u7d04\u306f LINE \u30e1\u30c3\u30bb\u30fc\u30b8\u5185\u306e\u30ea\u30f3\u30af\u304b\u3089\u958b\u304f\u3053\u3068\u3092\u63a8\u5968\u3057\u307e\u3059\u3002")}
                </span>
              )}
            </div>
          </div>

          <aside className="hero-aside">
            <div className="hero-metric-card">
              <span>{pickText(lang, "\u5165\u53e3", "\u5165\u53e3")}</span>
              <strong>{pickText(lang, "LINE \u597d\u53cb\u6d88\u606f", "LINE \u53cb\u3060\u3061\u30e1\u30c3\u30bb\u30fc\u30b8")}</strong>
            </div>
            <div className="hero-metric-card">
              <span>{pickText(lang, "\u9884\u7ea6\u65b9\u5f0f", "\u4e88\u7d04\u65b9\u5f0f")}</span>
              <strong>{pickText(lang, "\u6309\u56fe\u9009\u540c\u6b3e", "\u30ae\u30e3\u30e9\u30ea\u30fc\u304b\u3089\u540c\u3058\u30c7\u30b6\u30a4\u30f3\u3092\u9078\u629e")}</strong>
            </div>
            <div className="hero-metric-card">
              <span>{pickText(lang, "\u786e\u8ba4\u65b9\u5f0f", "\u78ba\u8a8d\u65b9\u6cd5")}</span>
              <strong>{pickText(lang, "\u5e97\u957f\u540e\u53f0 + LINE", "\u7ba1\u7406\u753b\u9762 + LINE")}</strong>
            </div>
          </aside>
        </section>

        <section className="section-panel">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="section-eyebrow">Filter</p>
              <h2 className="section-title text-3xl sm:text-4xl">{pickText(lang, "\u6309\u98ce\u683c\u7b5b\u9009\u56fe\u5899", "\u30b9\u30bf\u30a4\u30eb\u3067\u30ae\u30e3\u30e9\u30ea\u30fc\u3092\u7d5e\u308a\u8fbc\u3080")}</h2>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link className={`site-lang-switch ${!categoryId ? "border-brand-700 bg-brand-700 text-white" : ""}`} href={buildHref(lang, entryToken)}>
                {pickText(lang, "\u5168\u90e8", "\u3059\u3079\u3066")}
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
          </div>
        </section>

        {showcaseItems.length === 0 ? (
          <section className="section-panel">
            <p className="ui-state-info mt-0">{pickText(lang, "\u5f53\u524d\u5206\u7c7b\u4e0b\u8fd8\u6ca1\u6709\u53ef\u5c55\u793a\u7684\u56fe\u5899\u9879\u3002", "\u3053\u306e\u30ab\u30c6\u30b4\u30ea\u306b\u306f\u8868\u793a\u3067\u304d\u308b\u30ae\u30e3\u30e9\u30ea\u30fc\u9805\u76ee\u304c\u3042\u308a\u307e\u305b\u3093\u3002")}</p>
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
              <article key={item.id.toString()} className="product-card overflow-hidden">
                <div className="product-card-media min-h-[18rem] rounded-[1.4rem]" style={{ backgroundImage: `linear-gradient(180deg, rgba(47,29,39,0.08), rgba(47,29,39,0.28)), url(${item.imageUrl})` }}>
                  <span>{lang === "ja" ? item.category.nameJa : item.category.nameZh}</span>
                </div>
                <div className="mt-4 flex flex-col gap-3">
                  <div>
                    <h2 className="text-2xl font-semibold text-brand-900">{lang === "ja" ? item.titleJa : item.titleZh}</h2>
                    <p className="mt-2 text-sm leading-7 text-brand-700">{lang === "ja" ? item.descriptionJa || "-" : item.descriptionZh || "-"}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <span className="metric-pill">{item.servicePackage.priceJpy} JPY {pickText(lang, "\u8d77", "\u301c")}</span>
                    <span className="metric-pill metric-pill-soft">{item.servicePackage.durationMin} min</span>
                  </div>
                  <p className="text-sm text-brand-700">{pickText(lang, "\u5bf9\u5e94\u5957\u9910", "\u9023\u643a\u30e1\u30cb\u30e5\u30fc")}: {lang === "ja" ? item.servicePackage.nameJa : item.servicePackage.nameZh}</p>
                  <Link className="ui-btn-primary w-full" href={`/booking?${bookingParams.toString()}`}>
                    {pickText(lang, "\u9884\u7ea6\u540c\u6b3e", "\u3053\u306e\u30c7\u30b6\u30a4\u30f3\u3067\u4e88\u7d04")}
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
