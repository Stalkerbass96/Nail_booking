import Link from "next/link";
import PublicSiteFrame from "@/components/public-site-frame";
import { prisma } from "@/lib/db";
import { resolveLang } from "@/lib/lang";

type Props = {
  searchParams: Promise<{ lang?: string; entry?: string }>;
};

const TEXT = {
  zh: {
    title: "加项目录",
    backToGallery: "回到图墙",
    duration: "分钟",
    plus: "+",
    empty: "暂无可展示的加项。"
  },
  ja: {
    title: "オプション一覧",
    backToGallery: "ギャラリーに戻る",
    duration: "分",
    plus: "+",
    empty: "表示できるオプションがありません。"
  }
} as const;

export default async function AddonsPage({ searchParams }: Props) {
  const query = await searchParams;
  const lang = resolveLang(query?.lang);
  const entryToken = query?.entry?.trim() || undefined;
  const t = TEXT[lang];

  const addons = await prisma.serviceAddon.findMany({
    where: { isActive: true },
    select: {
      id: true,
      nameZh: true,
      nameJa: true,
      descZh: true,
      descJa: true,
      priceJpy: true,
      durationIncreaseMin: true
    },
    orderBy: { id: "asc" }
  });

  const galleryParams = new URLSearchParams({ lang });
  if (entryToken) galleryParams.set("entry", entryToken);

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
          <Link className="ui-btn-secondary shrink-0" href={`/?${galleryParams}`}>
            {t.backToGallery}
          </Link>
        </section>

        {addons.length === 0 ? (
          <section className="section-panel section-panel-compact">
            <p className="ui-state-info mt-0">{t.empty}</p>
          </section>
        ) : (
          <div className="grid gap-3">
            {addons.map((addon) => {
              const name = lang === "ja" ? addon.nameJa : addon.nameZh;
              const desc = lang === "ja" ? addon.descJa : addon.descZh;
              return (
                <div
                  key={addon.id.toString()}
                  className="section-panel section-panel-compact"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-semibold" style={{ color: "var(--text)" }}>
                        {name}
                      </p>
                      {desc && (
                        <p
                          className="mt-1 text-sm"
                          style={{ color: "var(--text-2)", lineHeight: 1.75 }}
                        >
                          {desc}
                        </p>
                      )}
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1.5">
                      <span className="metric-pill">
                        {t.plus}¥{Number(addon.priceJpy).toLocaleString()}
                      </span>
                      <span className="metric-pill metric-pill-soft text-xs">
                        {t.plus}{addon.durationIncreaseMin} {t.duration}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </main>
    </PublicSiteFrame>
  );
}
