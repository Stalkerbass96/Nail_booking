import Link from "next/link";
import { notFound } from "next/navigation";
import PublicSiteFrame from "@/components/public-site-frame";
import { parseSingleBigInt } from "@/lib/booking-rules";
import { prisma } from "@/lib/db";
import { pickText, resolveLang } from "@/lib/lang";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ lang?: string }>;
};

export default async function ServiceDetailPage({ params, searchParams }: Props) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const lang = resolveLang(query?.lang);

  let packageId: bigint;
  try {
    packageId = parseSingleBigInt(id, "packageId");
  } catch {
    notFound();
  }

  const servicePackage = await prisma.servicePackage.findFirst({
    where: {
      id: packageId,
      isActive: true
    },
    include: {
      category: true,
      addonLinks: {
        include: {
          addon: true
        }
      },
      showcaseItems: {
        where: { isPublished: true },
        orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
        take: 1,
        select: { id: true }
      }
    }
  });

  if (!servicePackage) {
    notFound();
  }

  const addons = servicePackage.addonLinks.filter((item) => item.addon.isActive);
  const bookingHref = servicePackage.showcaseItems[0]
    ? `/booking?showcaseItemId=${servicePackage.showcaseItems[0].id.toString()}&lang=${lang}`
    : `/?lang=${lang}`;

  return (
    <PublicSiteFrame lang={lang}>
      <main className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-6 sm:px-6 sm:py-10">
        <section className="detail-hero-panel">
          <div className="detail-hero-copy">
            <p className="section-eyebrow">{lang === "ja" ? servicePackage.category.nameJa : servicePackage.category.nameZh}</p>
            <h1 className="section-title">{lang === "ja" ? servicePackage.nameJa : servicePackage.nameZh}</h1>
            <p className="section-copy">
              {lang === "ja"
                ? servicePackage.descJa || pickText(lang, "\u9002\u5408\u60f3\u5148\u786e\u8ba4\u5b8c\u6574\u5185\u5bb9\u518d\u9884\u7ea6\u7684\u987e\u5ba2\u3002", "\u5185\u5bb9\u3092\u3057\u3063\u304b\u308a\u78ba\u8a8d\u3057\u3066\u304b\u3089\u4e88\u7d04\u3057\u305f\u3044\u65b9\u5411\u3051\u3067\u3059\u3002")
                : servicePackage.descZh || pickText(lang, "\u9002\u5408\u60f3\u5148\u786e\u8ba4\u5b8c\u6574\u5185\u5bb9\u518d\u9884\u7ea6\u7684\u987e\u5ba2\u3002", "\u5185\u5bb9\u3092\u3057\u3063\u304b\u308a\u78ba\u8a8d\u3057\u3066\u304b\u3089\u4e88\u7d04\u3057\u305f\u3044\u65b9\u5411\u3051\u3067\u3059\u3002")}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <span className="metric-pill">{servicePackage.priceJpy} JPY</span>
              <span className="metric-pill metric-pill-soft">{servicePackage.durationMin} min</span>
            </div>
          </div>

          <div className="detail-hero-media" style={servicePackage.imageUrl ? { backgroundImage: `linear-gradient(135deg, rgba(64,30,42,0.16), rgba(255,255,255,0.08)), url(${servicePackage.imageUrl})` } : undefined}>
            {!servicePackage.imageUrl ? <span>{pickText(lang, "\u7cbe\u54c1\u6307\u5c16\u8bbe\u8ba1", "\u30b7\u30b0\u30cd\u30c1\u30e3\u30fc\u30cd\u30a4\u30eb")}</span> : null}
          </div>
        </section>

        <section className="section-panel">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-xl font-semibold text-brand-950">{pickText(lang, "\u53ef\u642d\u914d\u52a0\u9879", "\u8ffd\u52a0\u30aa\u30d7\u30b7\u30e7\u30f3")}</h2>
            <span className="metric-pill metric-pill-soft">{addons.length}</span>
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {addons.length === 0 ? (
              <p className="ui-state-info mt-0">{pickText(lang, "\u5f53\u524d\u5957\u9910\u6ca1\u6709\u53ef\u9009\u52a0\u9879\u3002", "\u3053\u306e\u30e1\u30cb\u30e5\u30fc\u306b\u306f\u8ffd\u52a0\u30aa\u30d7\u30b7\u30e7\u30f3\u304c\u3042\u308a\u307e\u305b\u3093\u3002")}</p>
            ) : (
              addons.map((item) => (
                <article key={item.addon.id.toString()} className="detail-addon-card">
                  <div>
                    <strong>{lang === "ja" ? item.addon.nameJa : item.addon.nameZh}</strong>
                    <p>{lang === "ja" ? item.addon.descJa || "-" : item.addon.descZh || "-"}</p>
                  </div>
                  <div className="text-right text-sm font-medium text-brand-800">
                    <div>+{item.addon.priceJpy} JPY</div>
                    <div>+{item.addon.durationIncreaseMin} min</div>
                  </div>
                </article>
              ))
            )}
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link className="ui-btn-primary" href={bookingHref}>
              {pickText(lang, "\u524d\u5f80\u56fe\u5899\u9884\u7ea6", "\u30ae\u30e3\u30e9\u30ea\u30fc\u4e88\u7d04\u3078")}
            </Link>
            <Link className="ui-btn-secondary" href={`/services?lang=${lang}`}>
              {pickText(lang, "\u8fd4\u56de\u670d\u52a1\u5217\u8868", "\u30e1\u30cb\u30e5\u30fc\u4e00\u89a7\u3078\u623b\u308b")}
            </Link>
          </div>
        </section>
      </main>
    </PublicSiteFrame>
  );
}
