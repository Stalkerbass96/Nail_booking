import AdminLoginForm from "@/components/admin-login-form";
import { getAdminFromServerCookies } from "@/lib/admin-auth";
import { resolveLang } from "@/lib/lang";
import { redirect } from "next/navigation";

type Props = {
  searchParams: Promise<{ next?: string; lang?: string }>;
};

const TEXT = {
  zh: {
    title: "管理员登录",
    desc: "开发环境默认账号由 seed 写入，可通过环境变量修改密码。"
  },
  ja: {
    title: "管理者ログイン",
    desc: "開発用アカウントは seed で作成され、パスワードは環境変数で変更できます。"
  }
};

function ensureLang(nextPath: string, lang: "zh" | "ja"): string {
  if (!nextPath.startsWith("/")) return `/admin?lang=${lang}`;

  const [pathname, queryString = ""] = nextPath.split("?");
  const params = new URLSearchParams(queryString);
  params.set("lang", lang);
  const next = params.toString();

  return next ? `${pathname}?${next}` : pathname;
}

export default async function AdminLoginPage({ searchParams }: Props) {
  const query = await searchParams;
  const lang = resolveLang(query?.lang);
  const t = TEXT[lang];

  const admin = await getAdminFromServerCookies();
  if (admin) {
    redirect(`/admin?lang=${lang}`);
  }

  const rawNext = query?.next && query.next.startsWith("/") ? query.next : "/admin";
  const nextPath = ensureLang(rawNext, lang);

  return (
    <main className="mx-auto w-full max-w-md px-6 py-10">
      <section className="rounded-2xl border border-brand-100 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-semibold text-brand-900">{t.title}</h1>
        <p className="mt-2 text-sm text-brand-700">{t.desc}</p>

        <div className="mt-5">
          <AdminLoginForm nextPath={nextPath} lang={lang} />
        </div>
      </section>
    </main>
  );
}
