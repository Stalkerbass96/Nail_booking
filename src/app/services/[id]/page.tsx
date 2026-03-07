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
      }
    }
  });

  if (!servicePackage) {
    notFound();
  }

  const addons = servicePackage.addonLinks.filter((item) => item.addon.isActive);

  return (
    <PublicSiteFrame lang={lang}>
      <main className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-6 sm:px-6 sm:py-10">
        <section className="detail-hero-panel">
          <div className="detail-hero-copy">
            <p className="section-eyebrow">{lang === "ja" ? servicePackage.category.nameJa : servicePackage.category.nameZh}</p>
            <h1 className="section-title">{lang === "ja" ? servicePackage.nameJa : servicePackage.nameZh}</h1>
            <p className="section-copy">
              {lang === "ja"
                ? servicePackage.descJa || pickText(lang, "适合想先确认完整内容再预约的顾客。", "内容をしっかり確認してから予約したい方向けです。")
                : servicePackage.descZh || pickText(lang, "适合想先确认完整内容再预约的顾客。", "内容をしっかり確認してから予約したい方向けです。")}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <span className="metric-pill">{servicePackage.priceJpy} JPY</span>
              <span className="metric-pill metric-pill-soft">{servicePackage.durationMin} min</span>
            </div>
          </div>

          <div className="detail-hero-media" style={servicePackage.imageUrl ? { backgroundImage: `linear-gradient(135deg, rgba(64,30,42,0.16), rgba(255,255,255,0.08)), url(${servicePackage.imageUrl})` } : undefined}>
            {!servicePackage.imageUrl ? <span>{pickText(lang, "精品指尖设计", "シグネチャーネイル")}</span> : null}
          </div>
        </section>

        <section className="section-panel">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-xl font-semibold text-brand-950">{pickText(lang, "可搭配加项", "追加オプション")}</h2>
            <span className="metric-pill metric-pill-soft">{addons.length}</span>
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {addons.length === 0 ? (
              <p className="ui-state-info mt-0">{pickText(lang, "当前套餐没有可选加项。", "このメニューには追加オプションがありません。")}</p>
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
            <Link className="ui-btn-primary" href={`/booking?packageId=${servicePackage.id.toString()}&lang=${lang}`}>
              {pickText(lang, "预约这个套餐", "このメニューを予約")}
            </Link>
            <Link className="ui-btn-secondary" href={`/services?lang=${lang}`}>
              {pickText(lang, "返回服务列表", "メニュー一覧へ戻る")}
            </Link>
          </div>
        </section>
      </main>
    </PublicSiteFrame>
  );
}
