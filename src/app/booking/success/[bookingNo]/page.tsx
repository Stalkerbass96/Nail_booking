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
    <main className="mx-auto flex min-h-[60vh] w-full max-w-3xl items-center px-6 py-10">
      <section className="w-full rounded-2xl border border-brand-100 bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-semibold text-brand-900">
          {isJa ? "予約を受け付けました" : "预约提交成功"}
        </h1>
        <p className="mt-3 text-brand-800">
          {isJa ? "予約番号" : "预约编号"}: <span className="font-semibold">{bookingNo}</span>
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          <Link className="rounded-lg bg-brand-700 px-4 py-2 text-white" href={`/booking/lookup?lang=${lang}`}>
            {isJa ? "予約を確認" : "查询预约状态"}
          </Link>
          <Link className="rounded-lg border border-brand-300 px-4 py-2 text-brand-900" href={`/services?lang=${lang}`}>
            {isJa ? "メニューへ戻る" : "继续浏览套餐"}
          </Link>
        </div>
      </section>
    </main>
  );
}