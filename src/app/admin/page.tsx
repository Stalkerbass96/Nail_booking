import Link from "next/link";
import AdminNav from "@/components/admin-nav";
import { resolveLang } from "@/lib/lang";

type Props = {
  searchParams: Promise<{ lang?: string }>;
};

const TEXT = {
  zh: {
    title: "管理后台",
    desc: "店长可以在这里管理预约、套餐、加项、客户和积分。",
    appointments: "预约管理",
    categories: "分类管理",
    packages: "套餐管理",
    addons: "加项管理",
    customers: "客户管理",
    points: "积分管理",
    settings: "系统设置"
  },
  ja: {
    title: "管理コンソール",
    desc: "予約、メニュー、追加オプション、顧客、ポイントをここで管理できます。",
    appointments: "予約管理",
    categories: "カテゴリ管理",
    packages: "メニュー管理",
    addons: "追加オプション管理",
    customers: "顧客管理",
    points: "ポイント管理",
    settings: "システム設定"
  }
};

export default async function AdminHomePage({ searchParams }: Props) {
  const query = await searchParams;
  const lang = resolveLang(query?.lang);
  const t = TEXT[lang];

  return (
    <main className="mx-auto w-full max-w-5xl px-6 py-10">
      <AdminNav lang={lang} />
      <section className="rounded-2xl border border-brand-100 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-semibold text-brand-900">{t.title}</h1>
        <p className="mt-2 text-brand-800">{t.desc}</p>

        <div className="mt-6 flex flex-wrap gap-3">
          <Link className="rounded-lg bg-brand-700 px-4 py-2 text-white" href={`/admin/appointments?lang=${lang}`}>
            {t.appointments}
          </Link>
          <Link className="rounded-lg border border-brand-300 px-4 py-2 text-brand-900" href={`/admin/categories?lang=${lang}`}>
            {t.categories}
          </Link>
          <Link className="rounded-lg border border-brand-300 px-4 py-2 text-brand-900" href={`/admin/packages?lang=${lang}`}>
            {t.packages}
          </Link>
          <Link className="rounded-lg border border-brand-300 px-4 py-2 text-brand-900" href={`/admin/addons?lang=${lang}`}>
            {t.addons}
          </Link>
          <Link className="rounded-lg border border-brand-300 px-4 py-2 text-brand-900" href={`/admin/customers?lang=${lang}`}>
            {t.customers}
          </Link>
          <Link className="rounded-lg border border-brand-300 px-4 py-2 text-brand-900" href={`/admin/points?lang=${lang}`}>
            {t.points}
          </Link>
          <Link className="rounded-lg border border-brand-300 px-4 py-2 text-brand-900" href={`/admin/settings?lang=${lang}`}>
            {t.settings}
          </Link>
        </div>
      </section>
    </main>
  );
}
