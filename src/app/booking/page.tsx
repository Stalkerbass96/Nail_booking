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
    <main className="mx-auto w-full max-w-5xl px-6 py-10">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-semibold text-brand-900">{isJa ? "予約" : "在线预约"}</h1>
        <div className="flex gap-3 text-sm">
          <Link className="text-brand-700 underline" href={`/services?lang=${lang}`}>
            {isJa ? "メニュー" : "套餐列表"}
          </Link>
          <Link className="text-brand-700 underline" href={`/booking/lookup?lang=${lang}`}>
            {isJa ? "予約照会" : "查询预约"}
          </Link>
        </div>
      </div>

      <BookingForm lang={lang} packages={packageOptions} initialPackageId={query?.packageId} />
    </main>
  );
}