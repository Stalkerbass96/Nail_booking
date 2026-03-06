import Link from "next/link";
import { resolveLang } from "@/lib/lang";

type Props = {
  params: Promise<{ bookingNo: string }>;
  searchParams: Promise<{ lang?: string }>;
};

export default async function BookingSuccessPage({ params, searchParams }: Props) {
  const [{ bookingNo }, query] = await Promise.all([params, searchParams]);
  const lang = resolveLang(query?.lang);
  const isJa = lang === "ja";

  return (
    <main className="mx-auto flex min-h-[62vh] w-full max-w-3xl items-center px-5 py-10 md:px-8">
      <section className="w-full rounded-3xl border border-brand-100/80 bg-white/90 p-8 shadow-[0_20px_55px_rgba(120,25,55,0.12)]">
        <div className="mb-3 inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold tracking-[0.14em] text-emerald-700">
          SUCCESS
        </div>
        <h1 className="text-3xl font-semibold tracking-tight text-brand-900">
          {isJa ? "予約を受け付けました" : "预约提交成功"}
        </h1>
        <p className="mt-3 text-brand-800">
          {isJa ? "予約番号" : "预约编号"}: <span className="rounded-lg bg-brand-50 px-2 py-1 font-semibold text-brand-900">{bookingNo}</span>
        </p>

        <div className="mt-7 flex flex-wrap gap-3">
          <Link className="admin-btn-primary px-5 py-2.5" href={`/booking/lookup?lang=${lang}`}>
            {isJa ? "予約を確認" : "查询预约状态"}
          </Link>
          <Link className="admin-btn-secondary px-5 py-2.5" href={`/services?lang=${lang}`}>
            {isJa ? "メニューへ戻る" : "继续浏览套餐"}
          </Link>
        </div>
      </section>
    </main>
  );
}
