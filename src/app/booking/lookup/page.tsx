import PublicSiteFrame from "@/components/public-site-frame";
import BookingLookupForm from "@/components/booking-lookup-form";
import { pickText, resolveLang } from "@/lib/lang";

type Props = {
  searchParams: Promise<{
    lang?: string;
  }>;
};

export default async function BookingLookupPage({ searchParams }: Props) {
  const query = await searchParams;
  const lang = resolveLang(query?.lang);

  return (
    <PublicSiteFrame lang={lang}>
      <main className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 py-6 sm:px-6 sm:py-10">
        <section className="section-panel">
          <p className="section-eyebrow">Booking Lookup</p>
          <h1 className="section-title">{pickText(lang, "用邮箱和预约号，快速确认预约状态。", "メールアドレスと予約番号で、現在の予約状況をすぐ確認。")}</h1>
          <p className="section-copy">
            {pickText(lang, "适合顾客在预约后自行查看状态、时间与备注。", "予約後にお客様自身で状態、時間、備考を確認したい時に使えます。")}
          </p>
        </section>

        <BookingLookupForm lang={lang} />
      </main>
    </PublicSiteFrame>
  );
}
