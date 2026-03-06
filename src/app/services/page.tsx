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
    <main className="mx-auto w-full max-w-6xl px-5 py-8 md:px-8 md:py-10">
      <section className="mb-6 rounded-3xl border border-brand-100/80 bg-white/90 p-6 shadow-[0_16px_40px_rgba(120,25,55,0.08)]">
        <div className="flex items-center justify-between gap-4">
          <h1 className="text-3xl font-semibold tracking-tight text-brand-900 md:text-4xl">{isJa ? "メニュー" : "服务套餐"}</h1>
          <Link
            className="admin-btn-secondary rounded-full px-4 py-2"
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
            className="rounded-3xl border border-brand-100/80 bg-white/90 p-5 shadow-[0_14px_36px_rgba(120,25,55,0.07)]"
          >
            <h2 className="text-xl font-semibold text-brand-900">
              {isJa ? category.nameJa : category.nameZh}
            </h2>

            <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {category.packages.map((pkg) => (
                <article key={pkg.id.toString()} className="rounded-2xl border border-brand-100 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
                  <h3 className="text-lg font-semibold text-brand-900">{isJa ? pkg.nameJa : pkg.nameZh}</h3>
                  <p className="mt-1 line-clamp-2 text-sm text-brand-700">{isJa ? pkg.descJa || "-" : pkg.descZh || "-"}</p>
                  <p className="mt-3 inline-flex rounded-full bg-brand-50 px-2.5 py-1 text-sm font-medium text-brand-800">
                    {pkg.priceJpy} JPY / {pkg.durationMin} min
                  </p>
                  <div className="mt-4 flex gap-2">
                    <Link
                      className="admin-btn-secondary px-3 py-1.5"
                      href={`/services/${pkg.id.toString()}?lang=${lang}`}
                    >
                      {isJa ? "詳細" : "详情"}
                    </Link>
                    <Link
                      className="admin-btn-primary px-3 py-1.5"
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
