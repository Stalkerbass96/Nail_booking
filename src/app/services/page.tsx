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
    <main className="mx-auto w-full max-w-6xl px-6 py-10">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-semibold text-brand-900">{isJa ? "メニュー" : "服务套餐"}</h1>
        <Link
          className="text-sm text-brand-700 underline"
          href={lang === "ja" ? "/services?lang=zh" : "/services?lang=ja"}
        >
          {lang === "ja" ? "中文" : "日本語"}
        </Link>
      </div>

      <div className="grid gap-8">
        {categories.map((category) => (
          <section
            key={category.id.toString()}
            className="rounded-2xl border border-brand-100 bg-white p-5 shadow-sm"
          >
            <h2 className="text-xl font-semibold text-brand-900">
              {isJa ? category.nameJa : category.nameZh}
            </h2>

            <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {category.packages.map((pkg) => (
                <article key={pkg.id.toString()} className="rounded-xl border border-brand-100 bg-brand-50/50 p-4">
                  <h3 className="text-lg font-medium text-brand-900">{isJa ? pkg.nameJa : pkg.nameZh}</h3>
                  <p className="mt-1 line-clamp-2 text-sm text-brand-700">{isJa ? pkg.descJa || "-" : pkg.descZh || "-"}</p>
                  <p className="mt-3 text-sm text-brand-800">
                    {pkg.priceJpy} JPY / {pkg.durationMin} min
                  </p>
                  <div className="mt-4 flex gap-2">
                    <Link
                      className="rounded-lg border border-brand-300 px-3 py-1 text-sm text-brand-900"
                      href={`/services/${pkg.id.toString()}?lang=${lang}`}
                    >
                      {isJa ? "詳細" : "详情"}
                    </Link>
                    <Link
                      className="rounded-lg bg-brand-700 px-3 py-1 text-sm text-white"
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