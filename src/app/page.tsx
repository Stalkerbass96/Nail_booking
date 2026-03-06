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
    <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col gap-6 px-4 py-8 sm:gap-8 sm:px-6 sm:py-12">
      <section className="ui-card bg-white/85 backdrop-blur">
        <p className="text-sm uppercase tracking-[0.2em] text-brand-700">Nail Booking MVP</p>
        <h1 className="mt-3 text-2xl font-semibold text-brand-900 sm:text-3xl">
          {isJa ? "ネイル予約システム" : "美甲预约系统"}
        </h1>
        <p className="mt-3 text-brand-800">
          {isJa
            ? "メニューを確認し、空き時間を選んで予約できます。"
            : "查看套餐、选择空档、快速完成预约。"}
        </p>

        <div className="mt-6 grid gap-3 sm:flex sm:flex-wrap">
          <Link className="ui-btn-primary" href={`/services?lang=${lang}`}>
            {isJa ? "メニューを見る" : "查看套餐"}
          </Link>
          <Link
            className="ui-btn-secondary"
            href={`/booking/lookup?lang=${lang}`}
          >
            {isJa ? "予約照会" : "查询预约"}
          </Link>
          <Link
            className="ui-btn-secondary"
            href={lang === "ja" ? "/?lang=zh" : "/?lang=ja"}
          >
            {lang === "ja" ? "中文" : "日本語"}
          </Link>
        </div>
      </section>
    </main>
  );
}
