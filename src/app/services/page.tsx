import Link from "next/link";
import { prisma } from "@/lib/db";
import { resolveLang } from "@/lib/lang";

type Props = {
  searchParams: Promise<{
    lang?: string;
  }>;
};

export default async function ServicesPage({ searchParams }: Props) {
  const query = await searchParams;
  const lang = resolveLang(query?.lang);
  const isJa = lang === "ja";

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
    <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-5 sm:py-8 md:px-8 md:py-10">
      <section className="ui-card mb-5 sm:mb-6">
        <div className="flex flex-wrap items-center justify-between gap-3 sm:gap-4">
          <h1 className="text-2xl font-semibold tracking-tight text-brand-900 sm:text-3xl md:text-4xl">{isJa ? "メニュー" : "服务套餐"}</h1>
          <Link
            className="ui-btn-secondary rounded-full"
            href={lang === "ja" ? "/services?lang=zh" : "/services?lang=ja"}
          >
            {lang === "ja" ? "中文" : "日本語"}
          </Link>
        </div>
      </section>

      <div className="grid gap-8">
        {categories.map((category) => (
          <section
            key={category.id.toString()}
            className="rounded-3xl border border-brand-100/80 bg-white/90 p-4 shadow-[0_14px_36px_rgba(120,25,55,0.07)] sm:p-5"
          >
            <h2 className="text-xl font-semibold text-brand-900">
              {isJa ? category.nameJa : category.nameZh}
            </h2>

            <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {category.packages.map((pkg) => (
                <article key={pkg.id.toString()} className="rounded-2xl border border-brand-100 bg-white p-4 shadow-sm transition-transform duration-200 hover:-translate-y-0.5 hover:shadow-md">
                  <h3 className="text-lg font-semibold text-brand-900">{isJa ? pkg.nameJa : pkg.nameZh}</h3>
                  <p className="mt-1 line-clamp-2 text-sm text-brand-700">{isJa ? pkg.descJa || "-" : pkg.descZh || "-"}</p>
                  <p className="mt-3 inline-flex rounded-full bg-brand-50 px-2.5 py-1 text-sm font-medium text-brand-800">
                    {pkg.priceJpy} JPY / {pkg.durationMin} min
                  </p>
                  <div className="mt-4 grid grid-cols-2 gap-2">
                    <Link
                      className="ui-btn-secondary min-h-10 px-3 py-2"
                      href={`/services/${pkg.id.toString()}?lang=${lang}`}
                    >
                      {isJa ? "詳細" : "详情"}
                    </Link>
                    <Link
                      className="ui-btn-primary min-h-10 px-3 py-2"
                      href={`/booking?packageId=${pkg.id.toString()}&lang=${lang}`}
                    >
                      {isJa ? "予約" : "预约"}
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          </section>
        ))}
      </div>
    </main>
  );
}
