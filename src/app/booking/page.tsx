import Link from "next/link";
import BookingForm from "@/components/booking-form";
import { prisma } from "@/lib/db";
import { resolveLang } from "@/lib/lang";

type Props = {
  searchParams: Promise<{
    lang?: string;
    packageId?: string;
  }>;
};

export default async function BookingPage({ searchParams }: Props) {
  const query = await searchParams;
  const lang = resolveLang(query?.lang);
  const isJa = lang === "ja";

  const packages = await prisma.servicePackage.findMany({
    where: { isActive: true },
    include: {
      addonLinks: {
        include: {
          addon: {
            select: {
              id: true,
              isActive: true,
              nameZh: true,
              nameJa: true,
              priceJpy: true,
              durationIncreaseMin: true
            }
          }
        }
      }
    },
    orderBy: { id: "asc" }
  });

  const packageOptions = packages.map((pkg) => ({
    id: pkg.id.toString(),
    nameZh: pkg.nameZh,
    nameJa: pkg.nameJa,
    priceJpy: pkg.priceJpy,
    durationMin: pkg.durationMin,
    addons: pkg.addonLinks
      .filter((item) => item.addon.isActive)
      .map((item) => ({
        id: item.addon.id.toString(),
        nameZh: item.addon.nameZh,
        nameJa: item.addon.nameJa,
        priceJpy: item.addon.priceJpy,
        durationIncreaseMin: item.addon.durationIncreaseMin
      }))
  }));

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-5 sm:py-8 md:px-8 md:py-10">
      <section className="ui-card mb-5 bg-white/80 backdrop-blur sm:mb-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-500">
              {isJa ? "Nail Booking" : "Nail Booking"}
            </p>
            <h1 className="mt-1 text-2xl font-semibold text-brand-900 sm:text-3xl md:text-4xl">{isJa ? "予約" : "在线预约"}</h1>
          </div>

          <div className="grid grid-cols-2 gap-2 text-sm sm:flex sm:flex-wrap">
            <Link className="ui-btn-secondary rounded-full px-4 py-2" href={`/services?lang=${lang}`}>
              {isJa ? "メニュー" : "套餐列表"}
            </Link>
            <Link className="ui-btn-secondary rounded-full px-4 py-2" href={`/booking/lookup?lang=${lang}`}>
              {isJa ? "予約照会" : "查询预约"}
            </Link>
          </div>
        </div>
      </section>

      <BookingForm lang={lang} packages={packageOptions} initialPackageId={query?.packageId} />
    </main>
  );
}
