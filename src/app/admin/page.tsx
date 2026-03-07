import Link from "next/link";
import AdminNav from "@/components/admin-nav";
import { resolveLang } from "@/lib/lang";

type Props = {
  searchParams: Promise<{ lang?: string }>;
};

const TEXT = {
  zh: {
    title: "管理后台",
    desc: "店长可以在这里管理预约、营业排班、套餐、顾客、积分和 LINE 对话。",
    appointments: "预约管理",
    schedule: "营业排班",
    categories: "分类管理",
    packages: "套餐管理",
    addons: "加项管理",
    customers: "客户管理",
    points: "积分管理",
    line: "LINE 会话",
    settings: "系统设置"
  },
  ja: {
    title: "管理コンソール",
    desc: "予約、営業スケジュール、メニュー、顧客、ポイント、LINE 会話をここでまとめて管理できます。",
    appointments: "予約管理",
    schedule: "営業スケジュール",
    categories: "カテゴリ管理",
    packages: "メニュー管理",
    addons: "追加オプション管理",
    customers: "顧客管理",
    points: "ポイント管理",
    line: "LINE 会話",
    settings: "システム設定"
  }
};

export default async function AdminHomePage({ searchParams }: Props) {
  const query = await searchParams;
  const lang = resolveLang(query?.lang);
  const t = TEXT[lang];

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 sm:py-10">
      <AdminNav lang={lang} />
      <section className="ui-card">
        <h1 className="text-xl font-semibold text-brand-900 sm:text-2xl">{t.title}</h1>
        <p className="mt-2 text-brand-800">{t.desc}</p>

        <div className="mt-6 grid gap-2 sm:flex sm:flex-wrap sm:gap-3">
          <Link className="ui-btn-primary" href={`/admin/appointments?lang=${lang}`}>{t.appointments}</Link>
          <Link className="ui-btn-secondary" href={`/admin/schedule?lang=${lang}`}>{t.schedule}</Link>
          <Link className="ui-btn-secondary" href={`/admin/categories?lang=${lang}`}>{t.categories}</Link>
          <Link className="ui-btn-secondary" href={`/admin/packages?lang=${lang}`}>{t.packages}</Link>
          <Link className="ui-btn-secondary" href={`/admin/addons?lang=${lang}`}>{t.addons}</Link>
          <Link className="ui-btn-secondary" href={`/admin/customers?lang=${lang}`}>{t.customers}</Link>
          <Link className="ui-btn-secondary" href={`/admin/points?lang=${lang}`}>{t.points}</Link>
          <Link className="ui-btn-secondary" href={`/admin/line?lang=${lang}`}>{t.line}</Link>
          <Link className="ui-btn-secondary" href={`/admin/settings?lang=${lang}`}>{t.settings}</Link>
        </div>
      </section>
    </main>
  );
}
