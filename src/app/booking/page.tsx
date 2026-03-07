import PublicSiteFrame from "@/components/public-site-frame";
import BookingForm from "@/components/booking-form";
import { prisma } from "@/lib/db";
import { pickText, resolveLang } from "@/lib/lang";

type Props = {
  searchParams: Promise<{
    lang?: string;
    packageId?: string;
  }>;
};

export default async function BookingPage({ searchParams }: Props) {
  const query = await searchParams;
  const lang = resolveLang(query?.lang);

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
    <PublicSiteFrame lang={lang}>
      <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-6 sm:px-6 sm:py-10">
        <section className="section-panel">
          <p className="section-eyebrow">Reserve Your Slot</p>
          <h1 className="section-title">{pickText(lang, "确认套餐、时间和备注，完成一次清晰的预约。", "メニュー、時間、要望を確認して、迷わず予約を完了。")}</h1>
          <p className="section-copy">
            {pickText(lang, "系统会自动计算可用时段，并拦截重复预约。待确认预约也会占用档期，所以看到的时段就是当前可预约的时段。", "空き時間は自動計算され、重複予約は自動で防止されます。未確認予約も枠を占有するため、表示される時間がそのまま現在の予約可能枠です。")}
          </p>
        </section>

        <BookingForm lang={lang} packages={packageOptions} initialPackageId={query?.packageId} />
      </main>
    </PublicSiteFrame>
  );
}
