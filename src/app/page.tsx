import Link from "next/link";
import { resolveLang } from "@/lib/lang";

type Props = {
  searchParams: Promise<{
    lang?: string;
  }>;
};

export default async function HomePage({ searchParams }: Props) {
  const query = await searchParams;
  const lang = resolveLang(query?.lang);
  const isJa = lang === "ja";

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col gap-8 px-6 py-12">
      <section className="rounded-3xl border border-brand-100 bg-white/85 p-8 shadow-sm backdrop-blur">
        <p className="text-sm uppercase tracking-[0.2em] text-brand-700">Nail Booking MVP</p>
        <h1 className="mt-3 text-3xl font-semibold text-brand-900">
          {isJa ? "ネイル予約システム" : "美甲预约系统"}
        </h1>
        <p className="mt-3 text-brand-800">
          {isJa
            ? "メニューを確認し、空き時間を選んで予約できます。"
            : "查看套餐、选择空档、快速完成预约。"}
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          <Link className="rounded-lg bg-brand-700 px-4 py-2 text-white" href={`/services?lang=${lang}`}>
            {isJa ? "メニューを見る" : "查看套餐"}
          </Link>
          <Link
            className="rounded-lg border border-brand-300 px-4 py-2 text-brand-900"
            href={`/booking/lookup?lang=${lang}`}
          >
            {isJa ? "予約照会" : "查询预约"}
          </Link>
          <Link
            className="rounded-lg border border-brand-300 px-4 py-2 text-brand-900"
            href={lang === "ja" ? "/?lang=zh" : "/?lang=ja"}
          >
            {lang === "ja" ? "中文" : "日本語"}
          </Link>
        </div>
      </section>
    </main>
  );
}