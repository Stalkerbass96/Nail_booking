import AdminLoginForm from "@/components/admin-login-form";
import { getAdminFromServerCookies } from "@/lib/admin-auth";
import { resolveLang } from "@/lib/lang";
import { redirect } from "next/navigation";

type Props = {
  searchParams: Promise<{ next?: string; lang?: string }>;
};

const TEXT = {
  zh: {
    title: "后台登录",
    desc: "使用管理员邮箱和密码登录。初始账号由 seed 创建，部署后请及时替换默认密码。"
  },
  ja: {
    title: "管理画面ログイン",
    desc: "管理者メールアドレスとパスワードでログインします。初期アカウントは seed で作成されるため、デプロイ後は早めに初期パスワードを変更してください。"
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
    <main className="mx-auto w-full max-w-lg px-4 py-8 sm:px-5 sm:py-10 md:py-14">
      <section className="admin-panel-shell">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-500">Admin Console</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-brand-900 sm:text-3xl">{t.title}</h1>
        <p className="mt-2 max-w-lg text-sm leading-7 text-brand-700">{t.desc}</p>

        <div className="mt-7">
          <AdminLoginForm nextPath={nextPath} lang={lang} />
        </div>
      </section>
    </main>
  );
}
