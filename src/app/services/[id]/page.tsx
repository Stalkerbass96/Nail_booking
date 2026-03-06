import Link from "next/link";
import { notFound } from "next/navigation";
import { parseSingleBigInt } from "@/lib/booking-rules";
import { prisma } from "@/lib/db";
import { resolveLang } from "@/lib/lang";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ lang?: string }>;
};

export default async function ServiceDetailPage({ params, searchParams }: Props) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const lang = resolveLang(query?.lang);
  const isJa = lang === "ja";

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
    <main className="mx-auto w-full max-w-4xl px-6 py-10">
      <div className="rounded-2xl border border-brand-100 bg-white p-6 shadow-sm">
        <p className="text-sm uppercase tracking-[0.14em] text-brand-700">
          {isJa ? servicePackage.category.nameJa : servicePackage.category.nameZh}
        </p>
        <h1 className="mt-2 text-3xl font-semibold text-brand-900">
          {isJa ? servicePackage.nameJa : servicePackage.nameZh}
        </h1>
        <p className="mt-3 text-brand-800">{isJa ? servicePackage.descJa || "-" : servicePackage.descZh || "-"}</p>

        <p className="mt-4 text-brand-900">{servicePackage.priceJpy} JPY / {servicePackage.durationMin} min</p>

        <h2 className="mt-8 text-lg font-semibold text-brand-900">{isJa ? "追加オプション" : "可选加项"}</h2>
        <div className="mt-3 grid gap-2">
          {addons.length === 0 ? (
            <p className="text-sm text-brand-700">{isJa ? "追加オプションなし" : "暂无可选加项"}</p>
          ) : (
            addons.map((item) => (
              <div
                key={item.addon.id.toString()}
                className="rounded-lg border border-brand-100 px-3 py-2 text-sm text-brand-800"
              >
                {(isJa ? item.addon.nameJa : item.addon.nameZh)} (+{item.addon.priceJpy} JPY / +
                {item.addon.durationIncreaseMin} min)
              </div>
            ))
          )}
        </div>

        <div className="mt-8 flex gap-3">
          <Link
            className="rounded-lg bg-brand-700 px-4 py-2 text-white"
            href={`/booking?packageId=${servicePackage.id.toString()}&lang=${lang}`}
          >
            {isJa ? "このメニューを予約" : "预约此套餐"}
          </Link>
          <Link className="rounded-lg border border-brand-300 px-4 py-2 text-brand-900" href={`/services?lang=${lang}`}>
            {isJa ? "メニュー一覧" : "返回列表"}
          </Link>
        </div>
      </div>
    </main>
  );
}